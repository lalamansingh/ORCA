"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, MapPin } from "lucide-react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { formatCoordinate } from "@/features/map/coordinates";
import { INDIA_MARINE_VIEW, LOCATION_ZOOM, MAP_STYLE_URL } from "@/features/map/map-config";
import { demoFeatures } from "@/features/map/mock-layers";
import type { MapFeatureDetails, MarineMapLayer, SelectedLocation } from "@/features/map/types";

type Props = {
  large?: boolean;
  layers?: MarineMapLayer[];
  selectedLocation?: SelectedLocation | null;
  selectMode?: boolean;
  onSelectLocation?: (location: SelectedLocation) => void;
  onFeatureSelect?: (feature: MapFeatureDetails) => void;
  showStatus?: boolean;
  savedLocations?: Array<{ id: string; name: string; location_type: string; latitude: number; longitude: number }>;
};

const interactiveLayerIds = ["orca-pfz", "orca-alerts", "orca-restricted", "orca-route", "orca-saved"];

export function MarineMap({
  large = false,
  layers = [],
  selectedLocation,
  selectMode = false,
  onSelectLocation,
  onFeatureSelect,
  showStatus = true,
  savedLocations = [],
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
          map.addSource("orca-demo", { type: "geojson", data: demoFeatures });

          ["pfz", "alerts", "restricted"].forEach((id) => {
            const color = id === "pfz" ? "#16a085" : id === "alerts" ? "#d95d16" : "#c53030";
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
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;
    for (const layer of layers) {
      const id = `orca-${layer.id}`;
      if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", layer.enabled ? "visible" : "none");
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
