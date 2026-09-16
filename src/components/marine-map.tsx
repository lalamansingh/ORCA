"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { ChevronDown, ChevronUp, Layers, LoaderCircle, MapPin, Navigation, Radio, Satellite, ShieldAlert, Ship, Waves, Wind } from "lucide-react";
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
  routeStartPoint?: { latitude: number; longitude: number; label?: string } | null;
  routeEndPoint?: { latitude: number; longitude: number; label?: string } | null;
  large?: boolean;
  compact?: boolean;
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
  "orca-restricted-fill",
  "orca-restricted-line",
  "orca-restricted",
  "orca-calculated-route-line",
  "orca-route-corridor-fill",
  "orca-route-waypoint-points",
  "orca-route",
  "orca-saved",
  "orca-ais-vessels-point",
  "orca-sos-point",
  "orca-sos-label",
  "orca-sst-grid-points",
  "orca-chl-grid-points",
  "orca-waves-grid-circle",
  "orca-currents-grid-circle",
  "orca-weather-grid-circle",
];

export function MarineMap({
  routeGeometry,
  routeStartPoint,
  routeEndPoint,
  large = false,
  compact = false,
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
  const [baseStyle, setBaseStyle] = useState<"satellite" | "ocean" | "dark" | "vector">(
    compact ? "ocean" : "satellite"
  );
  const [styleRevision, setStyleRevision] = useState<number>(0);
  const [aisCount, setAisCount] = useState<number>(0);
  const [legendOpen, setLegendOpen] = useState<boolean>(!compact);

  useEffect(() => {
    selectModeRef.current = selectMode;
    selectLocationRef.current = onSelectLocation;
    featureSelectRef.current = onFeatureSelect;
  }, [onFeatureSelect, onSelectLocation, selectMode]);

  const enabledLayerMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    layers.forEach((l) => {
      map[l.id] = l.enabled;
    });
    return map;
  }, [layers]);

  const setupMapLayers = useCallback((map: MapLibreMap) => {
    if (!map) return;

    // 1. Base Demo Features Source & Layer
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



    // 3. Live Potential Fishing Zones (PFZ)
    if (!map.getSource("orca-pfz-live")) {
      map.addSource("orca-pfz-live", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "orca-pfz-live-fill",
        type: "fill",
        source: "orca-pfz-live",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "fill-color": "#16a085", "fill-opacity": 0.28, "fill-outline-color": "#10b981" },
      });
      map.addLayer({
        id: "orca-pfz-live-line",
        type: "line",
        source: "orca-pfz-live",
        paint: { "line-color": "#10b981", "line-width": 3 },
      });
      map.addLayer({
        id: "orca-pfz-live-label",
        type: "symbol",
        source: "orca-pfz-live",
        filter: ["==", ["geometry-type"], "Point"],
        layout: { "text-field": ["concat", "🐟 PFZ: ", ["get", "name"]], "text-size": 11, "text-offset": [0, 1.3] },
        paint: { "text-color": "#10b981", "text-halo-color": "#000000", "text-halo-width": 2 },
      });
    }

    // 4. Sea Surface Temperature (SST) Satellite Grid
    if (!map.getSource("orca-sst-grid")) {
      map.addSource("orca-sst-grid", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "orca-sst-grid-points",
        type: "circle",
        source: "orca-sst-grid",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 14, 10, 28],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "value"],
            24, "#2563eb",
            26.5, "#06b6d4",
            28.5, "#10b981",
            30, "#f59e0b",
            32, "#ef4444",
          ],
          "circle-opacity": 0.45,
          "circle-blur": 0.6,
        },
      });
      map.addLayer({
        id: "orca-sst-grid-label",
        type: "symbol",
        source: "orca-sst-grid",
        layout: { "text-field": ["get", "label"], "text-size": 9, "text-allow-overlap": false },
        paint: { "text-color": "#ffffff", "text-halo-color": "#000000", "text-halo-width": 2 },
      });
    }

    // 5. Chlorophyll-a Concentration Satellite Grid
    if (!map.getSource("orca-chl-grid")) {
      map.addSource("orca-chl-grid", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "orca-chl-grid-points",
        type: "circle",
        source: "orca-chl-grid",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 15, 10, 30],
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
      map.addLayer({
        id: "orca-chl-grid-label",
        type: "symbol",
        source: "orca-chl-grid",
        layout: { "text-field": ["get", "label"], "text-size": 9, "text-allow-overlap": false },
        paint: { "text-color": "#ffffff", "text-halo-color": "#000000", "text-halo-width": 2 },
      });
    }

    // 6. Wave & Swell Conditions Layer
    if (!map.getSource("orca-waves-grid")) {
      map.addSource("orca-waves-grid", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "orca-waves-grid-circle",
        type: "circle",
        source: "orca-waves-grid",
        paint: {
          "circle-radius": 8,
          "circle-color": "#06b6d4",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.85,
        },
      });
      map.addLayer({
        id: "orca-waves-grid-label",
        type: "symbol",
        source: "orca-waves-grid",
        layout: { "text-field": ["get", "label"], "text-size": 10, "text-offset": [0, 1.4], "text-allow-overlap": false },
        paint: { "text-color": "#38bdf8", "text-halo-color": "#031726", "text-halo-width": 2 },
      });
    }

    // 7. Ocean Currents Layer
    if (!map.getSource("orca-currents-grid")) {
      map.addSource("orca-currents-grid", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "orca-currents-grid-circle",
        type: "circle",
        source: "orca-currents-grid",
        paint: {
          "circle-radius": 8,
          "circle-color": "#8b5cf6",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.85,
        },
      });
      map.addLayer({
        id: "orca-currents-grid-label",
        type: "symbol",
        source: "orca-currents-grid",
        layout: { "text-field": ["get", "label"], "text-size": 10, "text-offset": [0, 1.4], "text-allow-overlap": false },
        paint: { "text-color": "#c084fc", "text-halo-color": "#070b19", "text-halo-width": 2 },
      });
    }

    // 8. Coastal Weather & Wind Layer
    if (!map.getSource("orca-weather-grid")) {
      map.addSource("orca-weather-grid", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "orca-weather-grid-circle",
        type: "circle",
        source: "orca-weather-grid",
        paint: {
          "circle-radius": 8,
          "circle-color": "#6495bd",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.85,
        },
      });
      map.addLayer({
        id: "orca-weather-grid-label",
        type: "symbol",
        source: "orca-weather-grid",
        layout: { "text-field": ["get", "label"], "text-size": 10, "text-offset": [0, 1.4], "text-allow-overlap": false },
        paint: { "text-color": "#93c5fd", "text-halo-color": "#031726", "text-halo-width": 2 },
      });
    }

    // 9. Restricted Maritime Zones Layer
    if (!map.getSource("orca-restricted-zones")) {
      map.addSource("orca-restricted-zones", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "orca-restricted-fill",
        type: "fill",
        source: "orca-restricted-zones",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "fill-color": "#dc2626", "fill-opacity": 0.22, "fill-outline-color": "#ef4444" },
      });
      map.addLayer({
        id: "orca-restricted-line",
        type: "line",
        source: "orca-restricted-zones",
        paint: { "line-color": "#ef4444", "line-width": 3, "line-dasharray": [3, 2] },
      });
      map.addLayer({
        id: "orca-restricted-label",
        type: "symbol",
        source: "orca-restricted-zones",
        layout: { "text-field": ["concat", "⛔ ", ["get", "name"]], "text-size": 10, "text-offset": [0, 1.2] },
        paint: { "text-color": "#f87171", "text-halo-color": "#000000", "text-halo-width": 2 },
      });
    }

    // 10. Live AIS Vessel Traffic Layer
    if (!map.getSource("orca-ais-vessels")) {
      map.addSource("orca-ais-vessels", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "orca-ais-vessels-point",
        type: "circle",
        source: "orca-ais-vessels",
        paint: {
          "circle-radius": 8,
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
          "text-field": ["concat", "🚢 ", ["get", "name"], " (", ["get", "speed_knots"], " kn)"],
          "text-size": 10,
          "text-offset": [0, 1.4],
          "text-optional": true,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#000000",
          "text-halo-width": 2,
        },
      });
    }

    // 11. Marine Multi-Hazard Alerts Layer
    if (!map.getSource("orca-alert-data")) {
      map.addSource("orca-alert-data", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      const severityColor = [
        "match",
        ["get", "severity"],
        "CRITICAL", "#811c32",
        "SEVERE", "#c9413c",
        "WARNING", "#e17a2c",
        "WATCH", "#d3a42e",
        "#0284c7",
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
        layout: { "text-field": ["concat", "⚠️ ", ["get", "severity"], " · ", ["get", "type"]], "text-size": 10, "text-offset": [0, 1.4] },
        paint: { "text-color": "#ffffff", "text-halo-color": "#000000", "text-halo-width": 2 },
      });
      map.addLayer({
        id: "orca-cyclone-label",
        type: "symbol",
        source: "orca-alert-data",
        filter: ["==", ["get", "feature_kind"], "cyclone_point"],
        layout: { "text-field": ["get", "forecast_time"], "text-size": 9, "text-offset": [0, 1.5] },
        paint: { "text-color": "#ffffff", "text-halo-color": "#000000", "text-halo-width": 2 },
      });
    }

    // 12. Saved Waypoints Layer
    if (!map.getSource("orca-saved")) {
      map.addSource("orca-saved", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "orca-saved",
        type: "circle",
        source: "orca-saved",
        paint: { "circle-radius": 7, "circle-color": "#117ea6", "circle-stroke-width": 2, "circle-stroke-color": "#fff" },
      });
      map.addLayer({
        id: "orca-saved-label",
        type: "symbol",
        source: "orca-saved",
        layout: { "text-field": ["concat", "📍 ", ["get", "title"]], "text-size": 10, "text-offset": [0, 1.4] },
        paint: { "text-color": "#38bdf8", "text-halo-color": "#000000", "text-halo-width": 2 },
      });
    }

    // 12b. Real-time Inbound SOS Distress Pins (ISRO PS 26176)
    if (!map.getSource("orca-sos-data")) {
      map.addSource("orca-sos-data", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      const sosColor = [
        "match",
        ["get", "status"],
        "new", "#ef4444",
        "transmitted", "#ef4444",
        "acknowledged", "#f59e0b",
        "responding", "#3b82f6",
        "resolved", "#10b981",
        "#ef4444",
      ] as import("maplibre-gl").ExpressionSpecification;

      map.addLayer({
        id: "orca-sos-point",
        type: "circle",
        source: "orca-sos-data",
        paint: {
          "circle-radius": 10,
          "circle-color": sosColor,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "orca-sos-label",
        type: "symbol",
        source: "orca-sos-data",
        layout: {
          "text-field": ["concat", "🚨 SOS: ", ["get", "vesselName"]],
          "text-size": 11,
          "text-offset": [0, 1.4],
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#991b1b",
          "text-halo-width": 3,
        },
      });
    }

    // 13. High-Priority Calculated Route & Navigation Channel (On Top of Grids)
    if (!map.getSource("orca-calculated-route")) {
      map.addSource("orca-calculated-route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      map.addLayer({
        id: "orca-route-corridor-fill",
        type: "line",
        source: "orca-calculated-route",
        filter: ["==", ["geometry-type"], "LineString"],
        paint: { "line-color": "#00f0ff", "line-width": 24, "line-opacity": 0.28 },
      });
      map.addLayer({
        id: "orca-calculated-route-casing",
        type: "line",
        source: "orca-calculated-route",
        filter: ["==", ["geometry-type"], "LineString"],
        paint: { "line-color": "#0284c7", "line-width": 8 },
      });
      map.addLayer({
        id: "orca-calculated-route-line",
        type: "line",
        source: "orca-calculated-route",
        filter: ["==", ["geometry-type"], "LineString"],
        paint: { "line-color": "#38bdf8", "line-width": 4.5 },
      });
      map.addLayer({
        id: "orca-route-waypoint-halo",
        type: "circle",
        source: "orca-calculated-route",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "kind"], "boat_origin"], 24,
            ["==", ["get", "kind"], "target_pin"], 26,
            12
          ],
          "circle-color": [
            "case",
            ["==", ["get", "kind"], "boat_origin"], "#38bdf8",
            ["==", ["get", "kind"], "target_pin"], "#ef4444",
            "#06b6d4"
          ],
          "circle-opacity": 0.28,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": [
            "case",
            ["==", ["get", "kind"], "boat_origin"], "#38bdf8",
            ["==", ["get", "kind"], "target_pin"], "#f87171",
            "#67e8f9"
          ],
        },
      });
      map.addLayer({
        id: "orca-route-waypoint-points",
        type: "circle",
        source: "orca-calculated-route",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-radius": [
            "case",
            ["==", ["get", "kind"], "boat_origin"], 11,
            ["==", ["get", "kind"], "target_pin"], 13,
            7
          ],
          "circle-color": [
            "case",
            ["==", ["get", "kind"], "boat_origin"], "#0284c7",
            ["==", ["get", "kind"], "target_pin"], "#dc2626",
            "#06b6d4"
          ],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "orca-route-waypoint-labels",
        type: "symbol",
        source: "orca-calculated-route",
        filter: ["==", ["geometry-type"], "Point"],
        layout: {
          "text-field": [
            "case",
            ["==", ["get", "kind"], "boat_origin"], ["concat", "🟢 ", ["get", "name"]],
            ["==", ["get", "kind"], "target_pin"], ["concat", "📍 ", ["get", "name"]],
            ["concat", "⚓ ", ["get", "name"]]
          ],
          "text-size": 12,
          "text-offset": [0, 1.6],
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#082536",
          "text-halo-width": 3,
        },
      });
    }
  }, [showDemoFeatures]);

  // Map Initialization
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
          center: selectedLocation ? [selectedLocation.longitude, selectedLocation.latitude] : INDIA_MARINE_VIEW.center,
          zoom: selectedLocation ? (compact ? 7.5 : LOCATION_ZOOM) : INDIA_MARINE_VIEW.zoom,
          attributionControl: false,
        });
        mapRef.current = mapInstance;

        mapInstance.on("load", () => {
          if (cancelled || !mapInstance) return;
          setupMapLayers(mapInstance);

          // Apply initial basemap visibility
          const BASEMAP_GROUPS: Record<"satellite" | "ocean" | "dark" | "vector", string[]> = {
            satellite: ["satellite-base-layer"],
            ocean: ["ocean-base-layer", "ocean-ref-layer"],
            dark: ["dark-base-layer", "dark-ref-layer"],
            vector: ["voyager-base-layer"],
          };
          Object.entries(BASEMAP_GROUPS).forEach(([groupKey, layerIds]) => {
            const isTarget = groupKey === (compact ? "ocean" : baseStyle);
            layerIds.forEach((layerId) => {
              if (mapInstance?.getLayer(layerId)) {
                mapInstance.setLayoutProperty(layerId, "visibility", isTarget ? "visible" : "none");
              }
            });
          });

          setState("ready");
          setStyleRevision((r) => r + 1);

          mapInstance.on("click", (event) => {
            const lat = Number(event.lngLat.lat.toFixed(4));
            const lng = Number(event.lngLat.lng.toFixed(4));
            const features = mapInstance?.queryRenderedFeatures(event.point, { layers: interactiveLayerIds }) ?? [];
            let label = `Marine Point [${lat.toFixed(2)}° N, ${lng.toFixed(2)}° E]`;

            if (features[0]) {
              const properties = features[0].properties ?? {};
              const featureTitle = String(properties.title ?? properties.name ?? properties.product ?? "");
              if (featureTitle) label = featureTitle;
              featureSelectRef.current?.({
                id: String(properties.id ?? properties.mmsi ?? "feature"),
                title: featureTitle || "Marine Specification",
                type: String(properties.type ?? properties.vessel_type ?? properties.product ?? "Layer"),
                status: String(properties.status ?? properties.collision_risk ?? properties.restriction_level ?? "Active"),
                source: String(properties.source ?? properties.provider ?? "ORCA Marine Intelligence Network"),
                updated: String(properties.updated ?? properties.last_updated ?? properties.valid_time ?? "Real-time Live Feed"),
                coordinates: `${formatCoordinate(lat, "latitude")} · ${formatCoordinate(lng, "longitude")}`,
                properties: Object.fromEntries(
                  Object.entries(properties)
                    .filter(([key]) => !["id", "title", "type", "status", "source", "updated", "layer"].includes(key))
                    .map(([key, value]) => [key, String(value)]),
                ),
              });
            }

            // In compact (mobile) mode or when selectMode is active, clicking ANYWHERE on the map selects that location
            if (compact || selectModeRef.current) {
              selectLocationRef.current?.({
                latitude: lat,
                longitude: lng,
                source: "map",
                label,
              });
            }
          });
        });

        mapInstance.on("error", (e) => {
          if (process.env.NODE_ENV === "development") {
            console.debug("MapLibre notice:", e);
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

  // Automatic Map Resize on Mount & Tab Transition
  useEffect(() => {
    const handleResize = () => {
      mapRef.current?.resize();
    };
    window.addEventListener("resize", handleResize);

    let ro: ResizeObserver | null = null;
    if (container.current && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        mapRef.current?.resize();
      });
      ro.observe(container.current);
    }

    const t1 = setTimeout(handleResize, 100);
    const t2 = setTimeout(handleResize, 300);
    const t3 = setTimeout(handleResize, 800);
    return () => {
      window.removeEventListener("resize", handleResize);
      ro?.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [state, compact]);

  // Turn-by-Turn GPS Navigation Map Helpers (North Reset & Re-centre)
  useEffect(() => {
    const handleResetNorth = () => {
      mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 400 });
    };
    const handleRecenterStart = () => {
      if (routeStartPoint && mapRef.current) {
        mapRef.current.easeTo({
          center: [routeStartPoint.longitude, routeStartPoint.latitude],
          zoom: Math.max(mapRef.current.getZoom(), 9),
          duration: 500,
        });
      }
    };
    window.addEventListener("orca-map-reset-north", handleResetNorth);
    window.addEventListener("orca-map-recenter-start", handleRecenterStart);
    return () => {
      window.removeEventListener("orca-map-reset-north", handleResetNorth);
      window.removeEventListener("orca-map-recenter-start", handleRecenterStart);
    };
  }, [routeStartPoint]);

  // Basemap Switcher Handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;

    const BASEMAP_GROUPS: Record<"satellite" | "ocean" | "dark" | "vector", string[]> = {
      satellite: ["satellite-base-layer"],
      ocean: ["ocean-base-layer", "ocean-ref-layer"],
      dark: ["dark-base-layer", "dark-ref-layer"],
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
    map.triggerRepaint();
  }, [baseStyle, state]);

  // Dynamic Layer Visibility Controller for all 11 layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;

    const layerMap: Record<string, string[]> = {
      pfz: ["orca-pfz", "orca-pfz-live-fill", "orca-pfz-live-line", "orca-pfz-live-label"],
      sst: ["orca-sst", "orca-sst-grid-points", "orca-sst-grid-label"],
      chlorophyll: ["orca-chlorophyll", "orca-chl-grid-points", "orca-chl-grid-label"],
      waves: ["orca-waves-grid-circle", "orca-waves-grid-label"],
      currents: ["orca-currents-grid-circle", "orca-currents-grid-label"],
      weather: ["orca-weather-grid-circle", "orca-weather-grid-label"],
      ais: ["orca-ais-vessels-point", "orca-ais-vessels-label"],
      alerts: ["orca-alert-fill", "orca-alert-line", "orca-alert-point", "orca-alert-label", "orca-cyclone-track", "orca-cyclone-points", "orca-cyclone-label"],
      restricted: ["orca-restricted", "orca-restricted-fill", "orca-restricted-line", "orca-restricted-label"],
      route: ["orca-route", "orca-calculated-route-casing", "orca-calculated-route-line", "orca-route-corridor-fill", "orca-route-waypoint-points", "orca-route-waypoint-labels"],
      saved: ["orca-saved", "orca-saved-label"],
    };

    for (const layer of layers) {
      const ids = layerMap[layer.id] || [`orca-${layer.id}`];
      for (const id of ids) {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, "visibility", layer.enabled ? "visible" : "none");
        }
      }
    }
  }, [layers, state, styleRevision]);

  // 1. Fetch & Populate Live AIS Vessels
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

  // 2. Fetch & Populate Ocean Products Grids (SST, Chlorophyll, Waves, Currents, Weather, Restricted)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;

    const lat = selectedLocation?.latitude ?? 18.92;
    const lon = selectedLocation?.longitude ?? 72.83;

    const fetchGrid = (product: string, sourceId: string) => {
      fetch(`${API_BASE_URL}${API_V1_PREFIX}/ocean-products/grid?product=${product}&latitude=${lat}&longitude=${lon}&radius_km=130`)
        .then((res) => res.json())
        .then((data) => {
          const source = map.getSource(sourceId) as import("maplibre-gl").GeoJSONSource | undefined;
          if (source && data && data.features) {
            source.setData(data);
          }
        })
        .catch(() => {});
    };

    fetchGrid("sst", "orca-sst-grid");
    fetchGrid("chlorophyll", "orca-chl-grid");
    fetchGrid("waves", "orca-waves-grid");
    fetchGrid("currents", "orca-currents-grid");
    fetchGrid("weather", "orca-weather-grid");
    fetchGrid("restricted", "orca-restricted-zones");
  }, [selectedLocation, state, styleRevision]);

  // 3. Populate Saved Locations
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
          status: "Saved Waypoint",
          source: "Your ORCA Account",
          updated: "Saved Location",
        },
        geometry: { type: "Point" as const, coordinates: [location.longitude, location.latitude] },
      })),
    });
  }, [savedLocations, state, styleRevision]);

  // 3b. Populate Real-time Inbound Distress SOS Pins (ISRO PS 26176)
  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource("orca-sos-data") as import("maplibre-gl").GeoJSONSource | undefined;
    if (!source || state !== "ready") return;

    let active = true;
    const loadSOSReports = async () => {
      try {
        const res = await fetch("/api/v1/sos");
        const data = await res.json();
        if (active && data.success && Array.isArray(data.reports)) {
          const sosFeatures: import("geojson").Feature[] = data.reports.map((report: any) => ({
            type: "Feature" as const,
            properties: {
              id: report.id,
              layer: "sos_incident",
              title: `🚨 SOS: ${report.deviceProfile?.vesselName || "Distress Vessel"}`,
              vesselName: report.deviceProfile?.vesselName || "Boat",
              status: report.status,
              type: "Marine Distress SOS",
              source: `Trigger: ${report.triggerMethod}`,
              updated: report.createdAt,
              transcript: report.spokenDistress?.transcript || "No voice transcript",
              feature_kind: "sos_incident",
            },
            geometry: {
              type: "Point" as const,
              coordinates: [report.location.longitude, report.location.latitude],
            },
          }));
          source.setData({ type: "FeatureCollection", features: sosFeatures });
        }
      } catch (err) {
        // Silently handle if offline
      }
    };

    loadSOSReports();
    const interval = setInterval(loadSOSReports, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [state, styleRevision]);

  // 4. Populate Live Marine Alerts & Cyclone Tracks
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
        affected_area: alert.affected_area ?? "Coastal Sector",
        feature_kind: "alert",
      };
      if (alert.geometry) features.push({ type: "Feature", properties, geometry: alert.geometry });
      if (alert.forecast_track) features.push({ type: "Feature", properties: { ...properties, id: `${alert.id}-track`, title: `${alert.title} — Forecast Track`, feature_kind: "cyclone_track" }, geometry: alert.forecast_track });
      alert.forecast_points.forEach((point, index) => {
        if (typeof point.latitude === "number" && typeof point.longitude === "number")
          features.push({
            type: "Feature",
            properties: { ...properties, id: `${alert.id}-forecast-${index}`, title: `${alert.title} — Forecast Point`, feature_kind: "cyclone_point", forecast_time: typeof point.forecast_time === "string" ? point.forecast_time : "Forecast point" },
            geometry: { type: "Point", coordinates: [point.longitude, point.latitude] },
          });
      });
    }
    source.setData({ type: "FeatureCollection", features });
  }, [alerts, state, styleRevision]);

  // 5. Populate Live Potential Fishing Zones (PFZ)
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

  // 6. Populate Safe Navigation Channel & Route Waypoints
  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource("orca-calculated-route") as import("maplibre-gl").GeoJSONSource | undefined;
    if (!source || !map || state !== "ready") return;

    if (routeGeometry && routeGeometry.coordinates && routeGeometry.coordinates.length >= 2) {
      const coords = routeGeometry.coordinates as [number, number][];
      const startPt: [number, number] = routeStartPoint
        ? [routeStartPoint.longitude, routeStartPoint.latitude]
        : coords[0];
      const endPt: [number, number] = routeEndPoint
        ? [routeEndPoint.longitude, routeEndPoint.latitude]
        : coords[coords.length - 1];

      const navFeatures: import("geojson").Feature[] = [
        {
          type: "Feature",
          geometry: routeGeometry,
          properties: {
            id: "route-primary-safe-channel",
            kind: "route_line",
            title: "Optimized Safe Navigation Channel (A*)",
            type: "Safe Marine Route",
            status: "SAFE · ZERO HAZARD ENCOUNTER",
            source: "ORCA Marine Routing Engine",
            updated: "Real-time Computed",
          },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: startPt },
          properties: {
            kind: "boat_origin",
            name: routeStartPoint?.label || "Departure (Point A)",
            title: "Departure (Point A)",
            status: "Departure Waypoint",
          },
        },
      ];

      for (let i = 1; i < coords.length - 1; i++) {
        navFeatures.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: coords[i] },
          properties: {
            kind: "mid_waypoint",
            name: `Fairway WP-${i}`,
            title: `Fairway Waypoint ${i}`,
            status: "Transit Waypoint",
          },
        });
      }

      navFeatures.push({
        type: "Feature",
        geometry: { type: "Point", coordinates: endPt },
        properties: {
          kind: "target_pin",
          name: routeEndPoint?.label || "Destination (Point B)",
          title: "Destination (Point B)",
          status: "Target Waypoint",
        },
      });

      source.setData({
        type: "FeatureCollection",
        features: navFeatures,
      });

      // Fit map camera bounds to the route
      const longitudes = [startPt[0], endPt[0], ...coords.map((c) => c[0])];
      const latitudes = [startPt[1], endPt[1], ...coords.map((c) => c[1])];
      const minLon = Math.min(...longitudes);
      const maxLon = Math.max(...longitudes);
      const minLat = Math.min(...latitudes);
      const maxLat = Math.max(...latitudes);

      try {
        map.resize();
        map.fitBounds(
          [
            [minLon, minLat],
            [maxLon, maxLat],
          ],
          { padding: 60, maxZoom: 11, duration: 800, essential: true }
        );
      } catch {}

      const fitTimer = setTimeout(() => {
        try {
          map.resize();
          map.fitBounds(
            [
              [minLon, minLat],
              [maxLon, maxLat],
            ],
            { padding: 60, maxZoom: 11, duration: 800, essential: true }
          );
        } catch {}
      }, 100);

      return () => clearTimeout(fitTimer);
    } else if (routeStartPoint && !routeEndPoint) {
      // User tapped Point 1: Point it out immediately with prominent start marker & center camera!
      const startPt: [number, number] = [routeStartPoint.longitude, routeStartPoint.latitude];
      source.setData({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: startPt },
            properties: {
              kind: "boat_origin",
              name: routeStartPoint.label || "Start (Point A)",
              title: "Departure (Point A)",
              status: "Departure Waypoint Set",
            },
          },
        ],
      });
      try {
        map.easeTo({
          center: startPt,
          zoom: Math.max(map.getZoom(), 8.5),
          duration: 400,
        });
      } catch {}
    } else if (routeGeometry === null && !routeStartPoint && !routeEndPoint) {
      // Explicitly empty route (route cleared)
      source.setData({ type: "FeatureCollection", features: [] });
    } else if (showDemoFeatures && !compact) {
      // Default Recommended Safe Navigation Channel connecting coastal harbor to prime fishing front
      const lat = selectedLocation?.latitude ?? 18.92;
      const lon = selectedLocation?.longitude ?? 72.83;
      const navFeatures: import("geojson").Feature[] = [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [lon, lat],
              [lon - 0.25, lat + 0.15],
              [lon - 0.55, lat + 0.35],
              [lon - 0.85, lat + 0.45],
            ],
          },
          properties: {
            id: "route-primary-safe-channel",
            title: "Optimized Safe Navigation Channel (A*)",
            type: "Safe Marine Route",
            status: "SAFE · ZERO HAZARD ENCOUNTER",
            source: "ORCA Marine Routing Engine",
            updated: "Real-time Computed",
          },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [lon, lat] },
          properties: { name: "Origin Harbor", title: "Origin Harbor", status: "Departure Waypoint" },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [lon - 0.55, lat + 0.35] },
          properties: { name: "Mid-Channel WP-1", title: "Mid-Channel Waypoint 1", status: "Transit Waypoint" },
        },
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: [lon - 0.85, lat + 0.45] },
          properties: { name: "PFZ Front Destination", title: "PFZ Front Destination", status: "Target Waypoint" },
        },
      ];
      source.setData({ type: "FeatureCollection", features: navFeatures });
    } else {
      source.setData({ type: "FeatureCollection", features: [] });
    }
  }, [routeGeometry, routeStartPoint, routeEndPoint, selectedLocation, showDemoFeatures, compact, state, styleRevision]);

  // 7. Selected Location Center & Risk Ring
  useEffect(() => {
    const map = mapRef.current;
    if (!map || state !== "ready") return;

    const sourceId = "orca-selected-location";
    const existingSource = map.getSource(sourceId) as import("maplibre-gl").GeoJSONSource | undefined;
    if (!selectedLocation) {
      existingSource?.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    const currentZoom = map.getZoom();
    const targetZoom = compact ? Math.max(currentZoom, 8) : Math.max(currentZoom, LOCATION_ZOOM);
    map.easeTo({
      center: [selectedLocation.longitude, selectedLocation.latitude],
      zoom: targetZoom,
      duration: 350,
    });

    const coordText = `📍 ${selectedLocation.latitude.toFixed(3)}°N, ${selectedLocation.longitude.toFixed(3)}°E`;
    const feature = {
      type: "Feature" as const,
      properties: {
        risk_label: riskLevel && riskLevel !== "UNAVAILABLE" ? riskLevel : "",
        coord_label: coordText,
      },
      geometry: { type: "Point" as const, coordinates: [selectedLocation.longitude, selectedLocation.latitude] },
    };
    if (existingSource) {
      existingSource.setData(feature);
    } else {
      map.addSource(sourceId, { type: "geojson", data: feature });

      // Outer pulsing radar ring
      map.addLayer({
        id: `${sourceId}-pulse`,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": 18,
          "circle-color": "#38bdf8",
          "circle-opacity": 0.22,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#38bdf8",
        },
      });

      // Core point marker
      map.addLayer({
        id: sourceId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": selectedLocation.accuracy ? Math.min(28, Math.max(9, selectedLocation.accuracy / 3)) : 9,
          "circle-color": selectedLocation.source === "gps" ? "#117ea6" : "#0284c7",
          "circle-opacity": selectedLocation.accuracy ? 0.22 : 1,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Coordinate text label directly on map
      map.addLayer({
        id: "orca-selected-coord-label",
        type: "symbol",
        source: sourceId,
        layout: {
          "text-field": ["get", "coord_label"],
          "text-size": 11,
          "text-offset": [0, -1.9],
          "text-allow-overlap": true,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "#082536",
          "text-halo-width": 3,
        },
      });

      map.addLayer({
        id: "orca-selected-risk",
        type: "symbol",
        source: sourceId,
        filter: ["!=", ["get", "risk_label"], ""],
        layout: { "text-field": ["get", "risk_label"], "text-size": 10, "text-offset": [0, 1.8], "text-allow-overlap": true },
        paint: {
          "text-color": ["match", ["get", "risk_label"], "LOW", "#10b981", "MODERATE", "#f59e0b", "HIGH", "#f97316", "EXTREME", "#ef4444", "#38bdf8"],
          "text-halo-color": "#082536",
          "text-halo-width": 3,
        },
      });
    }
  }, [riskLevel, selectedLocation, state, styleRevision]);

  // Focus Alert Viewport
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

  return (
    <div className={`marine-map ${large ? "large" : ""} ${compact ? "compact" : ""} ${selectMode ? "select-mode" : ""}`} style={{ position: "relative", height: "100%", minHeight: compact ? "310px" : undefined }}>
      <div ref={container} className="live-map" style={compact ? { opacity: 1 } : undefined} aria-label="Interactive marine map" />

      {/* Map Style Selector Overlay */}
      <div
        className="map-style-switcher"
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 10,
          background: "rgba(15, 23, 42, 0.9)",
          backdropFilter: "blur(10px)",
          padding: "3px 6px",
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.18)",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          fontSize: "10.5px",
        }}
      >
        {!compact && <Satellite size={13} style={{ color: "#38bdf8" }} />}
        {!compact && <span style={{ fontWeight: 600, color: "#e2e8f0" }}>Base:</span>}
        {(
          compact
            ? [
                { id: "ocean", label: "🌊 Bathy" },
                { id: "satellite", label: "🛰️ Sat" },
                { id: "vector", label: "🗺️ Map" },
                { id: "dark", label: "🌙 Dark" },
              ]
            : [
                { id: "satellite", label: "🛰️ Satellite" },
                { id: "ocean", label: "🌊 Bathymetry" },
                { id: "dark", label: "🌙 Dark Ocean" },
                { id: "vector", label: "🗺️ Vector" },
              ]
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setBaseStyle(item.id as "satellite" | "ocean" | "dark" | "vector")}
            style={{
              background: baseStyle === item.id ? "#0284c7" : "transparent",
              color: baseStyle === item.id ? "#ffffff" : "#94a3b8",
              border: baseStyle === item.id ? "1px solid #38bdf8" : "none",
              borderRadius: "4px",
              padding: "2px 6px",
              cursor: "pointer",
              fontSize: "10.5px",
              fontWeight: baseStyle === item.id ? 700 : 500,
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Floating Live Map Specifications & Layer Legend HUD */}
      {!compact && (
        <div
          className="map-live-hud"
        style={{
          position: "absolute",
          bottom: "14px",
          left: "14px",
          zIndex: 10,
          background: "rgba(11, 20, 38, 0.92)",
          backdropFilter: "blur(12px)",
          borderRadius: "10px",
          border: "1px solid rgba(56, 189, 248, 0.35)",
          color: "#f8fafc",
          maxWidth: "340px",
          fontSize: "11px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          overflow: "hidden",
        }}
      >
        <div
          onClick={() => setLegendOpen(!legendOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            background: "rgba(30, 41, 59, 0.6)",
            cursor: "pointer",
            borderBottom: legendOpen ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
            <Layers size={13} style={{ color: "#38bdf8" }} />
            <span>Map Specifications & Active Layers</span>
          </div>
          {legendOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </div>

        {legendOpen && (
          <div style={{ padding: "10px 12px", display: "grid", gap: "8px" }}>
            {/* AIS Traffic Count */}
            {aisCount > 0 && enabledLayerMap["ais"] && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#93c5fd" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Ship size={13} style={{ color: "#3b82f6" }} /> <b>Live AIS Traffic:</b>
                </span>
                <span style={{ background: "#1e3a8a", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                  {aisCount} Vessels
                </span>
              </div>
            )}

            {/* SST Scale */}
            {enabledLayerMap["sst"] && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span>🌡️ <b>SST Temperature:</b></span>
                  <span style={{ color: "#cbd5e1" }}>24°C — 32°C</span>
                </div>
                <div
                  style={{
                    height: "6px",
                    borderRadius: "3px",
                    background: "linear-gradient(to right, #2563eb, #06b6d4, #10b981, #f59e0b, #ef4444)",
                  }}
                />
              </div>
            )}

            {/* Chlorophyll Scale */}
            {enabledLayerMap["chlorophyll"] && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
                  <span>🧪 <b>Chlorophyll-a:</b></span>
                  <span style={{ color: "#cbd5e1" }}>0.2 — 5.0 mg/m³</span>
                </div>
                <div
                  style={{
                    height: "6px",
                    borderRadius: "3px",
                    background: "linear-gradient(to right, #6d28d9, #0284c7, #10b981, #84cc16, #eab308)",
                  }}
                />
              </div>
            )}

            {/* Wave & Swell Specifications */}
            {enabledLayerMap["waves"] && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#67e8f9" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Waves size={13} style={{ color: "#06b6d4" }} /> <b>Wave & Swell:</b>
                </span>
                <span>0.8m — 3.5m (SW Swell)</span>
              </div>
            )}

            {/* Ocean Currents */}
            {enabledLayerMap["currents"] && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#d8b4fe" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Radio size={13} style={{ color: "#8b5cf6" }} /> <b>Ocean Currents:</b>
                </span>
                <span>0.4 — 1.6 m/s (Drift Vector)</span>
              </div>
            )}

            {/* Coastal Weather & Wind */}
            {enabledLayerMap["weather"] && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#bfdbfe" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Wind size={13} style={{ color: "#60a5fa" }} /> <b>Wind & Weather:</b>
                </span>
                <span>12 — 28 kn (Gusts 34 kn)</span>
              </div>
            )}

            {/* Restricted Maritime Zones */}
            {enabledLayerMap["restricted"] && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fca5a5" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <ShieldAlert size={13} style={{ color: "#ef4444" }} /> <b>Restricted Zones:</b>
                </span>
                <span>Naval W-12 · Port · MPA</span>
              </div>
            )}

            {/* PFZ Fronts */}
            {enabledLayerMap["pfz"] && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#6ee7b7" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  🐟 <b>Potential Fishing Zones:</b>
                </span>
                <span>Thermal Front Active</span>
              </div>
            )}

            {/* Route Channel */}
            {enabledLayerMap["route"] && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "#fde047" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <Navigation size={13} style={{ color: "#eab308" }} /> <b>Safe Channel:</b>
                </span>
                <span>A* Hazard-Clear Corridor</span>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {state !== "ready" && (
        <div className="map-loading">
          {state === "loading" ? (
            <>
              <LoaderCircle className="spin" size={19} />
              Preparing high-resolution marine satellite & telemetry map…
            </>
          ) : (
            <>Map tiles unavailable. Use coordinate selection to continue.</>
          )}
        </div>
      )}
      {showStatus && state === "ready" && (
        <div className="map-ui-top" style={compact ? { top: "10px", left: "10px", right: "auto", zIndex: 10 } : undefined}>
          <span className="map-location" style={{ fontSize: "11px", fontWeight: 700 }}>
            <MapPin size={13} style={{ color: "#34bdd1" }} />
            {(selectedLocation?.label ?? "India Marine View").split(" ")[0]}
          </span>
        </div>
      )}
    </div>
  );
}
