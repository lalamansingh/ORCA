"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { LoaderCircle, MapPin, Satellite, Ship } from "lucide-react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { formatCoordinate } from "@/features/map/coordinates";
import {
  INDIA_MARINE_VIEW,
  LOCATION_ZOOM,
  COMPOSITE_BASE_STYLE,
} from "@/features/map/map-config";
import { demoFeatures } from "@/features/map/mock-layers";
import type { MapFeatureDetails, MarineMapLayer, SelectedLocation } from "@/features/map/types";
import type { MarineAlert } from "@/features/alerts/types";
import type { MarineRiskLevel } from "@/features/risk/types";
import type { PFZGeoJSON } from "@/features/pfz/types";
import { API_BASE_URL, API_V1_PREFIX } from "@/lib/api/config";

type Props = {
  routeGeometry?: import("geojson").LineString | null;
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
  riskLevel?: MarineRiskLevel;
  pfzs?: PFZGeoJSON | null;
};

const interactiveLayerIds = [
  "orca-pfz",
  "orca-pfz-live-line",
  "orca-pfz-live-fill",
  "orca-alert-fill",
  "orca-alert-line",
  "orca-alert-point",
  "orca-alert-label",
  "orca-cyclone-track",
  "orca-cyclone-points",
  "orca-cyclone-label",
  "orca-restricted",
  "orca-route",
  "orca-saved",
  "orca-ais-vessels-point",
  "orca-sst-grid-points",
  "orca-chl-grid-points",
];

export function MarineMap({
  routeGeometry,
  large = false,
  layers = [],
  selectedLocation,
  selectMode = false,
  onSelectLocation,
  onFeatureSelect,
  showStatus = true,
  savedLocations = [],
  alerts = [],
  showDemoFeatures = false,
  focusAlertId,
  riskLevel,
  pfzs,
}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const selectModeRef = useRef(selectMode);
  const selectLocationRef = useRef(onSelectLocation);
  const featureSelectRef = useRef(onFeatureSelect);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [baseStyle, setBaseStyle] = useState<"satellite" | "ocean" | "dark" | "vector">("satellite");
  const [styleRevision, setStyleRevision] = useState<number>(0);
  const [aisCount, setAisCount] = useState<number>(0);

  useEffect(() => {
    selectModeRef.current = selectMode;
    selectLocationRef.current = onSelectLocation;
    featureSelectRef.current = onFeatureSelect;
  }, [onFeatureSelect, onSelectLocation, selectMode]);



  const setupMapLayers = useCallback((map: MapLibreMap) => {
    if (!map) return;

    // Demo base layers
    if (!map.getSource("orca-demo")) {
      map.addSource("orca-demo", {
        type: "geojson",
        data: showDemoFeatures ? demoFeatures : { type: "FeatureCollection", features: [] },
      });

      ["pfz", "restricted", "sst", "chlorophyll"].forEach((id) => {
        const color = id === "pfz" ? "#16a085" : id === "restricted" ? "#c53030" : id === "sst" ? "#e27841" : "#79a951";
        map.addLayer({
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
    }

    // Calculated Route Layer
    if (!map.getSource("orca-calculated-route")) {
      map.addSource("orca-calculated-route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "orca-calculated-route-line",
        type: "line",
        source: "orca-calculated-route",
        paint: { "line-color": "#e5aa27", "line-width": 4 },
      });
    }

    // Live PFZ Layer
    if (!map.getSource("orca-pfz-live")) {
      map.addSource("orca-pfz-live", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "orca-pfz-live-fill",
        type: "fill",
        source: "orca-pfz-live",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "fill-color": "#16a085", "fill-opacity": 0.26, "fill-outline-color": "#0e756b" },
      });
      map.addLayer({
        id: "orca-pfz-live-line",
        type: "line",
        source: "orca-pfz-live",
        paint: { "line-color": "#16a085", "line-width": 3 },
      });
    }

    // Real-time Copernicus/NASA Satellite SST Heatmap Grid Layer
    if (!map.getSource("orca-sst-grid")) {
      map.addSource("orca-sst-grid", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "orca-sst-grid-points",
        type: "circle",
        source: "orca-sst-grid",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 12, 10, 24],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "value"],
            24, "#2563eb",
            27, "#06b6d4",
            28.5, "#10b981",
            30, "#f59e0b",
            32, "#ef4444",
          ],
          "circle-opacity": 0.45,
          "circle-blur": 0.6,
        },
      });
    }

    // Real-time Copernicus/NASA Chlorophyll Heatmap Grid Layer
    if (!map.getSource("orca-chl-grid")) {
      map.addSource("orca-chl-grid", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "orca-chl-grid-points",
        type: "circle",
        source: "orca-chl-grid",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 14, 10, 28],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "value"],
            0.2, "#6d28d9",
            0.8, "#0284c7",
            2.0, "#10b981",
            3.5, "#84cc16",
            5.0, "#eab308",
          ],
          "circle-opacity": 0.45,
          "circle-blur": 0.6,
        },
      });
    }

    // Live AIS Vessel Traffic Layer
    if (!map.getSource("orca-ais-vessels")) {
      map.addSource("orca-ais-vessels", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "orca-ais-vessels-point",
        type: "circle",
        source: "orca-ais-vessels",
        paint: {
          "circle-radius": 7,
          "circle-color": [
            "match",
            ["get", "vessel_type"],
            "FISHING", "#10b981",
            "CARGO", "#3b82f6",
            "TANKER", "#f97316",
            "COAST_GUARD", "#ef4444",
            "TUG", "#8b5cf6",
            "#06b6d4",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "orca-ais-vessels-label",
        type: "symbol",
        source: "orca-ais-vessels",
        layout: {
          "text-field": ["concat", ["get", "name"], " ( ", ["get", "speed_knots"], " kn )"],
          "text-size": 10,
          "text-offset": [0, 1.3],
          "text-optional": true,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#000000",
          "text-halo-width": 2,
        },
      });
    }

    // Marine Alerts Layer
    if (!map.getSource("orca-alert-data")) {
      map.addSource("orca-alert-data", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      const severityColor = [
        "match",
        ["get", "severity"],
        "CRITICAL", "#811c32",
        "SEVERE", "#c9413c",
        "WARNING", "#e17a2c",
        "WATCH", "#d3a42e",
        "#5a8ca5",
      ] as import("maplibre-gl").ExpressionSpecification;
      map.addLayer({
        id: "orca-alert-fill",
        type: "fill",
        source: "orca-alert-data",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "fill-color": severityColor, "fill-opacity": 0.22, "fill-outline-color": severityColor },
      });
      map.addLayer({
        id: "orca-alert-line",
        type: "line",
        source: "orca-alert-data",
        filter: ["all", ["==", ["geometry-type"], "LineString"], ["!=", ["get", "feature_kind"], "cyclone_track"]],
        paint: { "line-color": severityColor, "line-width": 4, "line-dasharray": [2, 1] },
      });
      map.addLayer({
        id: "orca-cyclone-track",
        type: "line",
        source: "orca-alert-data",
        filter: ["==", ["get", "feature_kind"], "cyclone_track"],
        paint: { "line-color": severityColor, "line-width": 3, "line-dasharray": [1, 1] },
      });
      map.addLayer({
        id: "orca-alert-point",
        type: "circle",
        source: "orca-alert-data",
        filter: ["all", ["==", ["geometry-type"], "Point"], ["!=", ["get", "feature_kind"], "cyclone_point"]],
        paint: { "circle-radius": 8, "circle-color": severityColor, "circle-stroke-width": 3, "circle-stroke-color": "#fff" },
      });
      map.addLayer({
        id: "orca-cyclone-points",
        type: "circle",
        source: "orca-alert-data",
        filter: ["==", ["get", "feature_kind"], "cyclone_point"],
        paint: { "circle-radius": 6, "circle-color": "#fff", "circle-stroke-width": 3, "circle-stroke-color": severityColor },
      });
      map.addLayer({
        id: "orca-alert-label",
        type: "symbol",
        source: "orca-alert-data",
        filter: ["==", ["get", "feature_kind"], "alert"],
        layout: { "text-field": ["concat", ["get", "severity"], " · ", ["get", "type"]], "text-size": 10, "text-offset": [0, 1.4] },
        paint: { "text-color": "#071a2b", "text-halo-color": "#fff", "text-halo-width": 2 },
      });
      map.addLayer({
        id: "orca-cyclone-label",
        type: "symbol",
        source: "orca-alert-data",
        filter: ["==", ["get", "feature_kind"], "cyclone_point"],
        layout: { "text-field": ["get", "forecast_time"], "text-size": 9, "text-offset": [0, 1.5] },
        paint: { "text-color": "#071a2b", "text-halo-color": "#fff", "text-halo-width": 2 },
      });
    }

    // Saved Locations Layer
    if (!map.getSource("orca-saved")) {
      map.addSource("orca-saved", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "orca-saved",
        type: "circle",
        source: "orca-saved",
        paint: { "circle-radius": 6, "circle-color": "#117ea6", "circle-stroke-width": 2, "circle-stroke-color": "#fff" },
      });
    }
  }, [showDemoFeatures]);

  // Initial Map Mount
  useEffect(() => {
    let cancelled = false;
    let mapInstance: MapLibreMap | undefined;

    const initializeMap = async () => {
      try {
        const maplibre = await import("maplibre-gl");
        if (!container.current || cancelled) return;

        mapInstance = new maplibre.Map({
          container: container.current,
          style: COMPOSITE_BASE_STYLE,
          center: INDIA_MARINE_VIEW.center,
          zoom: INDIA_MARINE_VIEW.zoom,
          attributionControl: false,
        });
        mapRef.current = mapInstance;

        mapInstance.on("load", () => {
          if (cancelled || !mapInstance) return;
          setupMapLayers(mapInstance);
          setState("ready");
          setStyleRevision((r) => r + 1);

          mapInstance.on("click", (event) => {
            const features = mapInstance?.queryRenderedFeatures(event.point, { layers: interactiveLayerIds }) ?? [];
            if (features[0]) {
              const properties = features[0].properties ?? {};
              featureSelectRef.current?.({
                id: String(properties.id ?? properties.mmsi ?? "feature"),
                title: String(properties.title ?? properties.name ?? properties.product ?? "Marine Feature"),
                type: String(properties.type ?? properties.vessel_type ?? properties.product ?? "Layer"),
                status: String(properties.status ?? properties.collision_risk ?? "Active"),
                source: String(properties.source ?? properties.provider ?? "ORCA Marine Network"),
                updated: String(properties.updated ?? properties.last_updated ?? properties.valid_time ?? "Real-time"),
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
        });

        // Informative logger without hard-failing on single missing tiles
        mapInstance.on("error", (e) => {
          if (process.env.NODE_ENV === "development") {
            console.debug("MapLibre tile notice:", e);
          }
        });
      } catch (err) {
        console.error("Map initialization failed:", err);
        setState("error");
      }
    };

    void initializeMap();

    return () => {
      cancelled = true;
      mapInstance?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Basemap Switcher Dynamically without destroying custom GeoJSON layers!
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;

    const BASEMAP_GROUPS: Record<"satellite" | "ocean" | "dark" | "vector", string[]> = {
      satellite: ["satellite-base-layer"],
      ocean: ["ocean-base-layer", "ocean-ref-layer"],
      dark: ["dark-base-layer"],
      vector: ["voyager-base-layer"],
    };

    Object.entries(BASEMAP_GROUPS).forEach(([groupKey, layerIds]) => {
      const isTarget = groupKey === baseStyle;
      layerIds.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, "visibility", isTarget ? "visible" : "none");
        }
      });
    });
  }, [baseStyle, state]);

  // Dynamic Layer Visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;
    for (const layer of layers) {
      const ids =
        layer.id === "alerts"
          ? ["orca-alert-fill", "orca-alert-line", "orca-alert-point", "orca-alert-label", "orca-cyclone-track", "orca-cyclone-points", "orca-cyclone-label"]
          : layer.id === "pfz"
          ? ["orca-pfz", "orca-pfz-live-fill", "orca-pfz-live-line"]
          : layer.id === "ais"
          ? ["orca-ais-vessels-point", "orca-ais-vessels-label"]
          : layer.id === "sst"
          ? ["orca-sst", "orca-sst-grid-points"]
          : layer.id === "chlorophyll"
          ? ["orca-chlorophyll", "orca-chl-grid-points"]
          : [`orca-${layer.id}`];

      for (const id of ids) {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, "visibility", layer.enabled ? "visible" : "none");
        }
      }
    }
  }, [layers, state, styleRevision]);

  // Load Live AIS Vessels
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;

    const lat = selectedLocation?.latitude ?? 18.92;
    const lon = selectedLocation?.longitude ?? 72.83;

    let active = true;
    fetch(`${API_BASE_URL}${API_V1_PREFIX}/ais/vessels?latitude=${lat}&longitude=${lon}&radius_km=150`)
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data.vessels) return;
        setAisCount(data.total_vessels);
        const source = map.getSource("orca-ais-vessels") as import("maplibre-gl").GeoJSONSource | undefined;
        if (source) {
          source.setData({
            type: "FeatureCollection",
            features: data.vessels.map((v: { mmsi: string; name: string; vessel_type: string; latitude: number; longitude: number; speed_knots: number; heading_degrees: number; destination: string; status: string; flag: string; collision_risk: string }) => ({
              type: "Feature",
              properties: {
                ...v,
                id: v.mmsi,
                title: v.name,
                type: `${v.vessel_type} Vessel`,
                status: `${v.speed_knots} kn · ${v.status.replace(/_/g, " ")}`,
                source: "AISStream Live Maritime Network",
                updated: "Just now",
              },
              geometry: { type: "Point", coordinates: [v.longitude, v.latitude] },
            })),
          });
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [selectedLocation, state, styleRevision]);

  // Load Copernicus SST & Chlorophyll EO Grids
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;

    const lat = selectedLocation?.latitude ?? 18.92;
    const lon = selectedLocation?.longitude ?? 72.83;

    // Load SST Grid
    fetch(`${API_BASE_URL}${API_V1_PREFIX}/ocean-products/grid?product=sst&latitude=${lat}&longitude=${lon}&radius_km=120`)
      .then((res) => res.json())
      .then((data) => {
        const source = map.getSource("orca-sst-grid") as import("maplibre-gl").GeoJSONSource | undefined;
        if (source && data.features) source.setData(data);
      })
      .catch(() => {});

    // Load Chlorophyll Grid
    fetch(`${API_BASE_URL}${API_V1_PREFIX}/ocean-products/grid?product=chlorophyll&latitude=${lat}&longitude=${lon}&radius_km=120`)
      .then((res) => res.json())
      .then((data) => {
        const source = map.getSource("orca-chl-grid") as import("maplibre-gl").GeoJSONSource | undefined;
        if (source && data.features) source.setData(data);
      })
      .catch(() => {});
  }, [selectedLocation, state, styleRevision]);

  // Saved Locations
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
  }, [savedLocations, state, styleRevision]);

  // Alerts
  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource("orca-alert-data") as import("maplibre-gl").GeoJSONSource | undefined;
    if (!source || state !== "ready") return;
    const features: import("geojson").Feature[] = [];
    for (const alert of alerts) {
      const properties = {
        id: alert.id,
        layer: "alerts",
        title: alert.title,
        type: alert.type.replaceAll("_", " "),
        status: `${alert.status} · ${alert.severity}`,
        severity: alert.severity,
        source: alert.source,
        updated: alert.issued_at ?? alert.retrieved_at,
        provider: alert.provider,
        affected_area: alert.affected_area ?? "Textual area not supplied",
        feature_kind: "alert",
      };
      if (alert.geometry) features.push({ type: "Feature", properties, geometry: alert.geometry });
      if (alert.forecast_track) features.push({ type: "Feature", properties: { ...properties, id: `${alert.id}-track`, title: `${alert.title} — forecast track`, feature_kind: "cyclone_track" }, geometry: alert.forecast_track });
      alert.forecast_points.forEach((point, index) => {
        if (typeof point.latitude === "number" && typeof point.longitude === "number")
          features.push({
            type: "Feature",
            properties: { ...properties, id: `${alert.id}-forecast-${index}`, title: `${alert.title} — forecast point`, feature_kind: "cyclone_point", forecast_time: typeof point.forecast_time === "string" ? point.forecast_time : "Forecast time supplied" },
            geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },
          });
      });
    }
    source.setData({ type: "FeatureCollection", features });
  }, [alerts, state, styleRevision]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready" || !focusAlertId) return;
    const alert = alerts.find((item) => item.id === focusAlertId);
    const focusGeometry = alert?.geometry ?? alert?.forecast_track;
    if (!focusGeometry) return;
    const points: [number, number][] = [];
    const collect = (value: unknown) => {
      if (Array.isArray(value) && value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number")
        points.push([value[0], value[1]]);
      else if (Array.isArray(value)) value.forEach(collect);
    };
    collect(focusGeometry.coordinates);
    if (!points.length) return;
    if (points.length === 1) {
      map.flyTo({ center: points[0], zoom: 7, essential: true });
      return;
    }
    const longitudes = points.map((point) => point[0]),
      latitudes = points.map((point) => point[1]);
    map.fitBounds(
      [
        [Math.min(...longitudes), Math.min(...latitudes)],
        [Math.max(...longitudes), Math.max(...latitudes)],
      ],
      { padding: 60, maxZoom: 8, essential: true }
    );
  }, [alerts, focusAlertId, state]);

  // Live PFZ
  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource("orca-pfz-live") as import("maplibre-gl").GeoJSONSource | undefined;
    if (!source || state !== "ready") return;
    if (pfzs && pfzs.features && pfzs.features.length > 0) {
      source.setData(pfzs as unknown as import("geojson").FeatureCollection);
    } else {
      fetch(`${API_BASE_URL}${API_V1_PREFIX}/pfz/geojson`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.features) source.setData(data);
        })
        .catch(() => {});
    }
  }, [pfzs, state, styleRevision]);

  // Selected Location Marker & Risk Label
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;

    const sourceId = "orca-selected-location";
    const existingSource = map.getSource(sourceId) as import("maplibre-gl").GeoJSONSource | undefined;
    if (!selectedLocation) {
      existingSource?.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    map.flyTo({ center: [selectedLocation.longitude, selectedLocation.latitude], zoom: LOCATION_ZOOM, essential: true });
    const feature = {
      type: "Feature" as const,
      properties: { risk_label: riskLevel && riskLevel !== "UNAVAILABLE" ? riskLevel : "" },
      geometry: { type: "Point" as const, coordinates: [selectedLocation.longitude, selectedLocation.latitude] },
    };
    if (existingSource) {
      existingSource.setData(feature);
    } else {
      map.addSource(sourceId, { type: "geojson", data: feature });
      map.addLayer({
        id: sourceId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": selectedLocation.accuracy ? Math.min(28, Math.max(8, selectedLocation.accuracy / 3)) : 8,
          "circle-color": selectedLocation.source === "gps" ? "#117ea6" : "#f6c452",
          "circle-opacity": selectedLocation.accuracy ? 0.22 : 1,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "orca-selected-risk",
        type: "symbol",
        source: sourceId,
        filter: ["!=", ["get", "risk_label"], ""],
        layout: { "text-field": ["get", "risk_label"], "text-size": 11, "text-offset": [0, -1.8], "text-allow-overlap": true },
        paint: {
          "text-color": ["match", ["get", "risk_label"], "LOW", "#166534", "MODERATE", "#8a5a05", "HIGH", "#b54708", "EXTREME", "#a61b2b", "#425466"],
          "text-halo-color": "#ffffff",
          "text-halo-width": 3,
        },
      });
    }
  }, [riskLevel, selectedLocation, state, styleRevision]);

  // Route Geometry
  useEffect(() => {
    const source = mapRef.current?.getSource("orca-calculated-route") as import("maplibre-gl").GeoJSONSource | undefined;
    if (source && state === "ready") source.setData({ type: "FeatureCollection", features: routeGeometry ? [{ type: "Feature", properties: {}, geometry: routeGeometry }] : [] });
  }, [routeGeometry, state, styleRevision]);

  return (
    <div className={`marine-map ${large ? "large" : ""} ${selectMode ? "select-mode" : ""}`} style={{ position: "relative" }}>
      <div ref={container} className="live-map" aria-label="Interactive marine map" />

      {/* Map Style Selector Overlay */}
      <div
        className="map-style-switcher"
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 10,
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(8px)",
          padding: "4px 8px",
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "11px",
        }}
      >
        <Satellite size={13} style={{ color: "#38bdf8" }} />
        <span style={{ fontWeight: 600, opacity: 0.85 }}>Base:</span>
        {(
          [
            { id: "satellite", label: "🛰️ Satellite" },
            { id: "ocean", label: "🌊 Bathymetry" },
            { id: "dark", label: "🌙 Dark Ocean" },
            { id: "vector", label: "🗺️ Vector" },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setBaseStyle(item.id)}
            style={{
              background: baseStyle === item.id ? "#1e293b" : "transparent",
              color: baseStyle === item.id ? "#38bdf8" : "#94a3b8",
              border: baseStyle === item.id ? "1px solid #38bdf8" : "none",
              borderRadius: "4px",
              padding: "2px 6px",
              cursor: "pointer",
              fontSize: "11px",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* AIS Traffic Indicator */}
      {aisCount > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: "14px",
            left: "14px",
            zIndex: 10,
            background: "rgba(15, 23, 42, 0.85)",
            backdropFilter: "blur(8px)",
            padding: "4px 10px",
            borderRadius: "6px",
            border: "1px solid rgba(59, 130, 246, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "11px",
            color: "#93c5fd",
          }}
        >
          <Ship size={13} style={{ color: "#3b82f6" }} />
          <span><b>{aisCount}</b> Live AIS Vessels in Area</span>
        </div>
      )}

      {state !== "ready" && (
        <div className="map-loading">
          {state === "loading" ? (
            <>
              <LoaderCircle className="spin" size={19} />
              Preparing high-resolution satellite marine map…
            </>
          ) : (
            <>Map tiles unavailable. Use coordinate selection to continue.</>
          )}
        </div>
      )}
      {showStatus && state === "ready" && (
        <div className="map-ui-top">
          <span className="map-location">
            <MapPin size={13} />
            {selectedLocation?.label ?? "India Marine Satellite View"}
          </span>
        </div>
      )}
    </div>
  );
}
