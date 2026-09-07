"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, MapPin } from "lucide-react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { formatCoordinate } from "@/features/map/coordinates";
import { INDIA_MARINE_VIEW, LOCATION_ZOOM, MAP_STYLE_URL } from "@/features/map/map-config";
import { demoFeatures } from "@/features/map/mock-layers";
import type { MapFeatureDetails, MarineMapLayer, SelectedLocation } from "@/features/map/types";
import type { MarineAlert } from "@/features/alerts/types";

type Props = {
  large?: boolean;
  layers?: MarineMapLayer[];
  selectedLocation?: SelectedLocation | null;
  selectMode?: boolean;
  onSelectLocation?: (location: SelectedLocation) => void;
  onFeatureSelect?: (feature: MapFeatureDetails) => void;
  showStatus?: boolean;
  savedLocations?: Array<{ id: string; name: string; location_type: string; latitude: number; longitude: number }>;
  alerts?: MarineAlert[];
  showDemoFeatures?: boolean;
  focusAlertId?: string;
};

const interactiveLayerIds = ["orca-pfz", "orca-alert-fill", "orca-alert-line", "orca-alert-point", "orca-alert-label", "orca-cyclone-track", "orca-cyclone-points", "orca-cyclone-label", "orca-restricted", "orca-route", "orca-saved"];

export function MarineMap({
  large = false,
  layers = [],
  selectedLocation,
  selectMode = false,
  onSelectLocation,
  onFeatureSelect,
  showStatus = true,
  savedLocations = [],
  alerts = [],
  showDemoFeatures = true,
  focusAlertId,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const selectModeRef = useRef(selectMode);
  const selectLocationRef = useRef(onSelectLocation);
  const featureSelectRef = useRef(onFeatureSelect);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    selectModeRef.current = selectMode;
    selectLocationRef.current = onSelectLocation;
    featureSelectRef.current = onFeatureSelect;
  }, [onFeatureSelect, onSelectLocation, selectMode]);

  useEffect(() => {
    let cancelled = false;
    let map: MapLibreMap | undefined;

    const initializeMap = async () => {
      try {
        const maplibre = await import("maplibre-gl");
        if (!container.current || cancelled) return;

        map = new maplibre.Map({
          container: container.current,
          style: MAP_STYLE_URL,
          center: INDIA_MARINE_VIEW.center,
          zoom: INDIA_MARINE_VIEW.zoom,
          attributionControl: false,
        });
        mapRef.current = map;

        map.on("load", () => {
          if (cancelled || !map) return;
          map.addSource("orca-demo", { type: "geojson", data: showDemoFeatures ? demoFeatures : { type: "FeatureCollection", features: [] } });

          ["pfz", "restricted"].forEach((id) => {
            const color = id === "pfz" ? "#16a085" : "#c53030";
            map?.addLayer({
              id: `orca-${id}`,
              type: "fill",
              source: "orca-demo",
              filter: ["==", ["get", "layer"], id],
              paint: { "fill-color": color, "fill-opacity": 0.28, "fill-outline-color": color },
            });
          });
          map.addLayer({
            id: "orca-route",
            type: "line",
            source: "orca-demo",
            filter: ["==", ["get", "layer"], "route"],
            paint: { "line-color": "#f6c452", "line-width": 3, "line-dasharray": [2, 1] },
          });
          map.addSource("orca-alert-data", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          const severityColor = ["match", ["get", "severity"], "CRITICAL", "#811c32", "SEVERE", "#c9413c", "WARNING", "#e17a2c", "WATCH", "#d3a42e", "#5a8ca5"] as import("maplibre-gl").ExpressionSpecification;
          map.addLayer({id:"orca-alert-fill",type:"fill",source:"orca-alert-data",filter:["==",["geometry-type"],"Polygon"],paint:{"fill-color":severityColor,"fill-opacity":0.22,"fill-outline-color":severityColor}});
          map.addLayer({id:"orca-alert-line",type:"line",source:"orca-alert-data",filter:["all",["==",["geometry-type"],"LineString"],["!=",["get","feature_kind"],"cyclone_track"]],paint:{"line-color":severityColor,"line-width":4,"line-dasharray":[2,1]}});
          map.addLayer({id:"orca-cyclone-track",type:"line",source:"orca-alert-data",filter:["==",["get","feature_kind"],"cyclone_track"],paint:{"line-color":severityColor,"line-width":3,"line-dasharray":[1,1]}});
          map.addLayer({id:"orca-alert-point",type:"circle",source:"orca-alert-data",filter:["all",["==",["geometry-type"],"Point"],["!=",["get","feature_kind"],"cyclone_point"]],paint:{"circle-radius":8,"circle-color":severityColor,"circle-stroke-width":3,"circle-stroke-color":"#fff"}});
          map.addLayer({id:"orca-cyclone-points",type:"circle",source:"orca-alert-data",filter:["==",["get","feature_kind"],"cyclone_point"],paint:{"circle-radius":6,"circle-color":"#fff","circle-stroke-width":3,"circle-stroke-color":severityColor}});
          map.addLayer({id:"orca-alert-label",type:"symbol",source:"orca-alert-data",filter:["==",["get","feature_kind"],"alert"],layout:{"text-field":["concat",["get","severity"]," · ",["get","type"]],"text-size":10,"text-offset":[0,1.4]},paint:{"text-color":"#071a2b","text-halo-color":"#fff","text-halo-width":2}});
          map.addLayer({id:"orca-cyclone-label",type:"symbol",source:"orca-alert-data",filter:["==",["get","feature_kind"],"cyclone_point"],layout:{"text-field":["get","forecast_time"],"text-size":9,"text-offset":[0,1.5]},paint:{"text-color":"#071a2b","text-halo-color":"#fff","text-halo-width":2}});
          map.addSource("orca-saved", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
          map.addLayer({
            id: "orca-saved",
            type: "circle",
            source: "orca-saved",
            paint: { "circle-radius": 6, "circle-color": "#117ea6", "circle-stroke-width": 2, "circle-stroke-color": "#fff" },
          });

          map.on("click", (event) => {
            const features = map?.queryRenderedFeatures(event.point, { layers: interactiveLayerIds }) ?? [];
            if (features[0]) {
              const properties = features[0].properties ?? {};
              featureSelectRef.current?.({
                id: String(properties.id),
                title: String(properties.title),
                type: String(properties.type),
                status: String(properties.status),
                source: String(properties.source),
                updated: String(properties.updated),
                coordinates: `${formatCoordinate(event.lngLat.lat, "latitude")} · ${formatCoordinate(event.lngLat.lng, "longitude")}`,
                properties: Object.fromEntries(
                  Object.entries(properties)
                    .filter(([key]) => !["id", "title", "type", "status", "source", "updated", "layer"].includes(key))
                    .map(([key, value]) => [key, String(value)]),
                ),
              });
            } else if (selectModeRef.current) {
              selectLocationRef.current?.({
                latitude: event.lngLat.lat,
                longitude: event.lngLat.lng,
                source: "map",
                label: "Selected Location",
              });
            }
          });
          setState("ready");
        });
        map.on("error", () => setState("error"));
      } catch {
        setState("error");
      }
    };

    void initializeMap();
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
    };
  }, [showDemoFeatures]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;
    for (const layer of layers) {
      const ids=layer.id==="alerts"?["orca-alert-fill","orca-alert-line","orca-alert-point","orca-alert-label","orca-cyclone-track","orca-cyclone-points","orca-cyclone-label"]:[`orca-${layer.id}`];
      for(const id of ids)if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", layer.enabled ? "visible" : "none");
    }
  }, [layers, state]);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource("orca-saved") as import("maplibre-gl").GeoJSONSource | undefined;
    if (!source || state !== "ready") return;
    source.setData({
      type: "FeatureCollection",
      features: savedLocations.map((location) => ({
        type: "Feature" as const,
        properties: {
          id: location.id,
          layer: "saved",
          title: location.name,
          type: location.location_type.replaceAll("_", " "),
          status: "Saved Location",
          source: "Your ORCA account",
          updated: "Saved by you",
        },
        geometry: { type: "Point" as const, coordinates: [location.longitude, location.latitude] },
      })),
    });
  }, [savedLocations, state]);

  useEffect(()=>{
    const map=mapRef.current;const source=map?.getSource("orca-alert-data") as import("maplibre-gl").GeoJSONSource|undefined;if(!source||state!=="ready")return;
    const features:import("geojson").Feature[]=[];
    for(const alert of alerts){const properties={id:alert.id,layer:"alerts",title:alert.title,type:alert.type.replaceAll("_"," "),status:`${alert.status} · ${alert.severity}`,severity:alert.severity,source:alert.source,updated:alert.issued_at??alert.retrieved_at,provider:alert.provider,affected_area:alert.affected_area??"Textual area not supplied",feature_kind:"alert"};if(alert.geometry)features.push({type:"Feature",properties,geometry:alert.geometry});if(alert.forecast_track)features.push({type:"Feature",properties:{...properties,id:`${alert.id}-track`,title:`${alert.title} — forecast track`,feature_kind:"cyclone_track"},geometry:alert.forecast_track});alert.forecast_points.forEach((point,index)=>{if(typeof point.latitude==="number"&&typeof point.longitude==="number")features.push({type:"Feature",properties:{...properties,id:`${alert.id}-forecast-${index}`,title:`${alert.title} — forecast point`,feature_kind:"cyclone_point",forecast_time:typeof point.forecast_time==="string"?point.forecast_time:"Forecast time supplied in details"},geometry:{type:"Point",coordinates:[point.longitude,point.latitude]}});});}
    source.setData({type:"FeatureCollection",features});
  },[alerts,state]);

  useEffect(()=>{
    const map=mapRef.current;if(!map||state!=="ready"||!focusAlertId)return;const alert=alerts.find(item=>item.id===focusAlertId);const focusGeometry=alert?.geometry??alert?.forecast_track;if(!focusGeometry)return;
    const points:[number,number][]=[];const collect=(value:unknown)=>{if(Array.isArray(value)&&value.length>=2&&typeof value[0]==="number"&&typeof value[1]==="number")points.push([value[0],value[1]]);else if(Array.isArray(value))value.forEach(collect);};collect(focusGeometry.coordinates);
    if(!points.length)return;if(points.length===1){map.flyTo({center:points[0],zoom:7,essential:true});return;}const longitudes=points.map(point=>point[0]),latitudes=points.map(point=>point[1]);map.fitBounds([[Math.min(...longitudes),Math.min(...latitudes)],[Math.max(...longitudes),Math.max(...latitudes)]],{padding:60,maxZoom:8,essential:true});
  },[alerts,focusAlertId,state]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedLocation || state !== "ready") return;

    map.flyTo({ center: [selectedLocation.longitude, selectedLocation.latitude], zoom: LOCATION_ZOOM, essential: true });
    const sourceId = "orca-selected-location";
    const feature = {
      type: "Feature" as const,
      properties: {},
      geometry: { type: "Point" as const, coordinates: [selectedLocation.longitude, selectedLocation.latitude] },
    };
    const source = map.getSource(sourceId) as import("maplibre-gl").GeoJSONSource | undefined;
    if (source) {
      source.setData(feature);
    } else {
      map.addSource(sourceId, { type: "geojson", data: feature });
      map.addLayer({
        id: sourceId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": selectedLocation.accuracy ? Math.min(28, Math.max(8, selectedLocation.accuracy / 3)) : 7,
          "circle-color": selectedLocation.source === "gps" ? "#117ea6" : "#f6c452",
          "circle-opacity": selectedLocation.accuracy ? 0.22 : 1,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });
    }
  }, [selectedLocation, state]);

  return (
    <div className={`marine-map ${large ? "large" : ""} ${selectMode ? "select-mode" : ""}`}>
      <div ref={container} className="live-map" aria-label="Interactive marine map" />
      {state !== "ready" && (
        <div className="map-loading">
          {state === "loading" ? <><LoaderCircle className="spin" size={19} />Preparing marine map…</> : <>Map could not initialize. Demo map unavailable.</>}
        </div>
      )}
      {showStatus && state === "ready" && <div className="map-ui-top"><span className="map-location"><MapPin size={13} />{selectedLocation?.label ?? "India marine view"}</span></div>}
    </div>
  );
}
