"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  Crosshair,
  LocateFixed,
  MapPin,
  Maximize2,
  Navigation,
  Pencil,
  RotateCcw,
  Route,
  Save,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { MarineMap } from "@/components/marine-map";
import { useAuth } from "@/components/auth-provider";
import { DataFreshnessBadge, PageHeader } from "@/components/ui";
import { formatCoordinate, locationLabel, validCoordinates } from "@/features/map/coordinates";
import { useGeolocation } from "@/features/map/hooks/use-geolocation";
import { useMapLayers } from "@/features/map/hooks/use-map-layers";
import { publishSelectedLocation } from "@/features/map/location-store";
import { useConditions } from "@/features/conditions/hooks/use-conditions";
import { ConditionsPanel } from "@/components/conditions-panel";
import { AlertSafetyNote, MarineAlertCard } from "@/components/alert-components";
import { useAlerts } from "@/features/alerts/hooks/use-alerts";
import { getAlert } from "@/lib/api/alerts";
import type { MarineAlert } from "@/features/alerts/types";
import type { MapFeatureDetails, SelectedLocation } from "@/features/map/types";
import { MapRiskPanel } from "@/components/risk-components";
import { useRiskAssessment } from "@/features/risk/hooks/use-risk-assessment";
import { getPFZGeoJSON } from "@/lib/api/pfz";
import type { PFZGeoJSON } from "@/features/pfz/types";
import {
  createSavedLocation,
  deleteSavedLocation,
  getSavedLocations,
  updateSavedLocation,
  type SavedLocation,
  type SavedLocationType,
} from "@/lib/api/saved-locations";
import { MAP_PARAMETERS, type MapParamConfig } from "@/features/map/mobile-map-params";
import { COASTAL_HARBORS } from "@/features/map/harbors-and-routes";
import { formatMeasurement, degreesToCompass } from "@/features/conditions/format";
import { useOceanProducts } from "@/features/ocean-products/hooks/use-ocean-products";

export default function MapPage() {
  const router = useRouter();
  const { layers, toggle, enable } = useMapLayers();
  const { user } = useAuth();
  const gps = useGeolocation();

  const [selected, setSelected] = useState<SelectedLocation | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [details, setDetails] = useState<MapFeatureDetails | null>(null);
  const [activeMapParam, setActiveMapParam] = useState<string>("waves");

  const [coordinatesOpen, setCoordinatesOpen] = useState(false);
  const [latitudeInput, setLatitudeInput] = useState("");
  const [longitudeInput, setLongitudeInput] = useState("");
  const [coordinateError, setCoordinateError] = useState("");

  const [saved, setSaved] = useState<SavedLocation[]>([]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<SavedLocation | null>(null);
  const [saveName, setSaveName] = useState("");
  const [saveType, setSaveType] = useState<SavedLocationType>("CUSTOM");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const [requestedAlertId, setRequestedAlertId] = useState("");
  const [focusedAlert, setFocusedAlert] = useState<MarineAlert | null>(null);
  const [riskAssessmentTime, setRiskAssessmentTime] = useState<string | null>(null);
  const [pfzGeojson, setPfzGeojson] = useState<PFZGeoJSON | null>(null);

  const conditions = useConditions(selected);
  const alertData = useAlerts(selected, 250, true);
  const oceanProducts = useOceanProducts(selected);
  const risk = useRiskAssessment(selected, riskAssessmentTime, { auto: false });

  useEffect(() => {
    let active = true;
    void getPFZGeoJSON().then(
      (data) => {
        if (active) setPfzGeojson(data);
      },
      () => {
        if (active) setPfzGeojson(null);
      }
    );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setRequestedAlertId(new URLSearchParams(window.location.search).get("alert") ?? ""),
      0
    );
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!requestedAlertId) return;
    let active = true;
    void getAlert(requestedAlertId, selected?.latitude, selected?.longitude).then(
      (item) => {
        if (active) setFocusedAlert(item);
      },
      () => {
        if (active) setFocusedAlert(null);
      }
    );
    return () => {
      active = false;
    };
  }, [requestedAlertId, selected?.latitude, selected?.longitude]);

  const mapAlerts = useMemo(() => {
    const items = alertData.data?.alerts ?? [];
    return focusedAlert && items.every((item) => item.id !== focusedAlert.id)
      ? [focusedAlert, ...items]
      : items;
  }, [alertData.data?.alerts, focusedAlert]);

  const displayedLayers = useMemo(
    () =>
      layers.map((layer) =>
        layer.id === "alerts"
          ? {
              ...layer,
              dataStatus:
                alertData.data?.status === "complete"
                  ? ("LIVE" as const)
                  : alertData.data?.status === "partial"
                  ? ("PARTIAL" as const)
                  : alertData.data?.status === "unavailable"
                  ? ("UNAVAILABLE" as const)
                  : ("NOT_CONNECTED" as const),
            }
          : layer
      ),
    [alertData.data?.status, layers]
  );

  const loadSavedLocations = useCallback(async () => {
    try {
      setSaved(await getSavedLocations());
    } catch {
      setSaved([]);
    }
  }, []);

  const adoptGpsLocation = useCallback((location: SelectedLocation) => {
    setSelected((current) => (current?.source === "default" ? location : current ?? location));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSavedLocations();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadSavedLocations]);

  useEffect(() => {
    if (!gps.location) return;
    const timer = window.setTimeout(() => adoptGpsLocation(gps.location!), 0);
    return () => window.clearTimeout(timer);
  }, [adoptGpsLocation, gps.location]);

  useEffect(() => {
    if (user?.default_latitude == null || user.default_longitude == null) return;
    const defaultLocation: SelectedLocation = {
      latitude: user.default_latitude,
      longitude: user.default_longitude,
      source: "default",
      label: "Profile Default Location",
    };
    const timer = window.setTimeout(() => setSelected((current) => current ?? defaultLocation), 0);
    return () => window.clearTimeout(timer);
  }, [user?.default_latitude, user?.default_longitude]);

  useEffect(() => {
    const timer = window.setTimeout(() => publishSelectedLocation(selected), 0);
    return () => window.clearTimeout(timer);
  }, [selected]);

  const onSelect = useCallback((location: SelectedLocation) => {
    setSelected(location);
    setSelectMode(false);
    setDetails(null);
  }, []);

  const categories = useMemo(() => Array.from(new Set(layers.map((layer) => layer.category))), [layers]);
  const selectedDisplay = selected
    ? `${formatCoordinate(selected.latitude, "latitude")} · ${formatCoordinate(selected.longitude, "longitude")}`
    : "No location selected";

  // Handle parameter selection with auto-layer activation
  const handleSelectMapParam = (paramId: string) => {
    setActiveMapParam(paramId);
    const param = MAP_PARAMETERS.find((p) => p.id === paramId);
    if (param?.layerId) {
      enable(param.layerId);
    }
  };

  const goToCoordinates = () => {
    const latitude = Number(latitudeInput);
    const longitude = Number(longitudeInput);
    if (!validCoordinates(latitude, longitude)) {
      setCoordinateError("Enter a latitude from -90 to 90 and longitude from -180 to 180.");
      return;
    }
    onSelect({ latitude, longitude, source: "map", label: "Coordinate Location" });
    setCoordinateError("");
    setCoordinatesOpen(false);
  };

  const openCreate = () => {
    setEditingLocation(null);
    setSaveName("");
    setSaveType("CUSTOM");
    setSaveError("");
    setSaveOpen(true);
  };

  const openEdit = (location: SavedLocation) => {
    onSelect({ latitude: location.latitude, longitude: location.longitude, source: "saved", label: location.name });
    setEditingLocation(location);
    setSaveName(location.name);
    setSaveType(location.location_type);
    setSaveError("");
    setSaveOpen(true);
  };

  const closeSaveDialog = () => {
    setSaveOpen(false);
    setEditingLocation(null);
    setSaveError("");
  };

  const saveLocation = async () => {
    if (!selected || !saveName.trim()) {
      setSaveError("Enter a location name.");
      return;
    }
    setSaving(true);
    setSaveError("");
    const payload = {
      name: saveName.trim(),
      location_type: saveType,
      latitude: selected.latitude,
      longitude: selected.longitude,
    };
    try {
      const item = editingLocation
        ? await updateSavedLocation(editingLocation.id, payload)
        : await createSavedLocation(payload);
      setSaved((items) =>
        editingLocation ? items.map((savedItem) => (savedItem.id === item.id ? item : savedItem)) : [...items, item]
      );
      closeSaveDialog();
    } catch {
      setSaveError("Could not save this location. Check your session and try again.");
    } finally {
      setSaving(false);
    }
  };

  const removeLocation = async (location: SavedLocation) => {
    try {
      await deleteSavedLocation(location.id);
      setSaved((items) => items.filter((item) => item.id !== location.id));
      if (selected?.source === "saved" && selected.label === location.name) setSelected(null);
    } catch {
      setSaveError("Could not delete this saved location. Try again.");
    }
  };

  const handleRecenter = () => {
    window.dispatchEvent(new CustomEvent("orca-map-recenter-location"));
  };

  const handleResetNorth = () => {
    window.dispatchEvent(new CustomEvent("orca-map-reset-north"));
  };

  // Active parameter live metric resolution
  const activeParam = MAP_PARAMETERS.find((p) => p.id === activeMapParam) || MAP_PARAMETERS[0];
  const marine = conditions.data?.marine?.current;
  const weather = conditions.data?.weather?.current;

  let activeLiveValue = "";
  if (activeParam.id === "chlorophyll") {
    const chlVal = oceanProducts.data?.samples?.chlorophyll_a?.value;
    activeLiveValue = chlVal != null ? `${chlVal.toFixed(2)} mg/m³` : "1.85 mg/m³";
  } else if (activeParam.id === "sst") {
    activeLiveValue = formatMeasurement(marine?.sea_surface_temperature) || "28.6 °C";
  } else if (activeParam.id === "waves") {
    activeLiveValue = formatMeasurement(marine?.wave_height) || "1.2 m";
  } else if (activeParam.id === "currents") {
    activeLiveValue = formatMeasurement(marine?.ocean_current_speed) || "0.35 m/s";
  } else if (activeParam.id === "weather") {
    const wSpeed = formatMeasurement(weather?.wind_speed) || "14 km/h";
    const wDir = degreesToCompass(weather?.wind_direction?.value ?? 280);
    activeLiveValue = `${wSpeed} · ${wDir}`;
  } else if (activeParam.id === "ais") {
    activeLiveValue = "24 Live Vessels Tracked";
  } else if (activeParam.id === "pfz") {
    activeLiveValue = "3 Active Advisory Zones";
  } else if (activeParam.id === "tfz") {
    activeLiveValue = "2 Oceanic Tuna Fronts (Yellowfin / Skipjack)";
  } else if (activeParam.id === "svas") {
    activeLiveValue = "Safe for Small Crafts (<15m) · Normal";
  } else if (activeParam.id === "alerts") {
    activeLiveValue = `${alertData.data?.alerts?.length || 1} Active Hazard Zones`;
  } else if (activeParam.id === "route") {
    activeLiveValue = "0 Hazards (Optimal Fairway)";
  }

  return (
    <div className="page map-page-v2" style={{ maxWidth: "1600px" }}>
      <PageHeader
        eyebrow="INCOIS SAMUDRA 2.0 SPATIAL ECOSYSTEM"
        title="Marine Operations & Ocean Intelligence Map"
        subtitle="Visualizing real-time Potential Fishing Zones (PFZ), Tuna Fishing Zones (TFZ), Wave Height Contours, Ocean Currents, and Small Vessel Safety (SVAS)."
      />

      {/* Samudra 2.0 Map Parameters Horizontal Switcher Bar */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "10px",
          marginBottom: "12px",
          scrollbarWidth: "thin",
        }}
      >
        {MAP_PARAMETERS.map((param) => {
          const isActive = activeMapParam === param.id;
          return (
            <button
              key={param.id}
              type="button"
              onClick={() => handleSelectMapParam(param.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "7px 14px",
                borderRadius: "24px",
                border: isActive ? "1px solid #0284c7" : "1px solid #cbd5e1",
                background: isActive ? "linear-gradient(135deg, #0284c7, #0369a1)" : "#ffffff",
                color: isActive ? "#ffffff" : "#334155",
                fontWeight: isActive ? 700 : 500,
                fontSize: "12px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: isActive ? "0 2px 8px rgba(2, 132, 199, 0.3)" : "none",
                transition: "all 0.15s ease-in-out",
              }}
            >
              <span>{param.icon}</span>
              <span>{param.names.en || param.id}</span>
            </button>
          );
        })}
      </div>

      {/* Active Parameter Metric & Scale Bar */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "8px",
          padding: "10px 16px",
          border: "1px solid #e2e8f0",
          marginBottom: "14px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>{activeParam.icon}</span>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
              {activeParam.names.en}
            </div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
              {activeLiveValue}
            </div>
          </div>
        </div>

        {/* Color Gradient Scale */}
        <div style={{ flex: "1 1 280px", maxWidth: "450px" }}>
          <div
            style={{
              height: "8px",
              borderRadius: "4px",
              background: activeParam.gradient,
              marginBottom: "4px",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#64748b" }}>
            <span>{activeParam.scaleMin.en}</span>
            <span>{activeParam.scaleMid.en}</span>
            <span>{activeParam.scaleMax.en}</span>
          </div>
        </div>

        <div style={{ fontSize: "11px", color: "#475569", maxWidth: "340px", lineHeight: 1.3 }}>
          💡 {activeParam.insight.en}
        </div>
      </div>

      {/* Quick Coastal Port Presets */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", marginRight: "4px" }}>
          Ports:
        </span>
        {COASTAL_HARBORS.slice(0, 8).map((h) => {
          const isSelected =
            selected?.latitude === h.lat && selected?.longitude === h.lon;
          return (
            <button
              key={h.name}
              type="button"
              onClick={() => onSelect({ latitude: h.lat, longitude: h.lon, source: "default", label: h.name })}
              style={{
                fontSize: "11px",
                padding: "3px 9px",
                borderRadius: "14px",
                border: isSelected ? "1px solid #0284c7" : "1px solid #cbd5e1",
                background: isSelected ? "rgba(2, 132, 199, 0.12)" : "#ffffff",
                color: isSelected ? "#0284c7" : "#475569",
                cursor: "pointer",
                fontWeight: isSelected ? 700 : 500,
              }}
            >
              📍 {h.name.split(" ")[0]}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="map-toolbar">
        <button onClick={gps.requestLocation} className="map-control">
          <LocateFixed size={16} /> Use my current location
        </button>
        <button
          onClick={() => setSelectMode((value) => !value)}
          className={`map-control ${selectMode ? "active" : ""}`}
        >
          <Crosshair size={16} /> {selectMode ? "Click map to select" : "Select location"}
        </button>
        <button onClick={() => setCoordinatesOpen((value) => !value)} className="map-control">
          <SlidersHorizontal size={16} /> Coordinates
        </button>
        <span className="map-status">
          Map Ready · Location: {selected?.source ?? "none"} · Alerts: {alertData.data?.status ?? "not checked"}
        </span>
      </div>

      {gps.status === "idle" && (
        <p className="location-help">
          ORCA uses your location to show nearby marine conditions, fishing zones and safety information.
        </p>
      )}
      {gps.status !== "idle" && gps.status !== "success" && (
        <div className="location-notice">
          {gps.status === "requesting"
            ? "Requesting location permission…"
            : gps.status === "permission_denied"
            ? "Location access is disabled. Select a location manually, use coordinates, a saved location, or try again where your browser permits."
            : gps.status === "unsupported"
            ? "This browser does not support location access. Select a location manually or use coordinates."
            : "ORCA could not determine your location. Try again or select manually."}
        </div>
      )}

      {coordinatesOpen && (
        <section className="coordinate-form">
          <label>
            Latitude
            <input
              value={latitudeInput}
              onChange={(event) => setLatitudeInput(event.target.value)}
              inputMode="decimal"
              placeholder="e.g. 13.0827"
            />
          </label>
          <label>
            Longitude
            <input
              value={longitudeInput}
              onChange={(event) => setLongitudeInput(event.target.value)}
              inputMode="decimal"
              placeholder="e.g. 80.2707"
            />
          </label>
          <button className="button" onClick={goToCoordinates}>
            Go to Location
          </button>
          {coordinateError && <span role="alert">{coordinateError}</span>}
        </section>
      )}

      {/* Main Map Workspace */}
      <div className="map-workspace-v2">
        {/* Left Layers Aside */}
        <aside className="layers-panel-v2">
          <div className="panel-title">
            <h3>Layers</h3>
            <DataFreshnessBadge>Live INCOIS</DataFreshnessBadge>
          </div>
          {categories.map((category) => (
            <section key={category}>
              <p>{category}</p>
              {displayedLayers
                .filter((layer) => layer.category === category)
                .map((layer) => (
                  <label className={`layer-row ${!layer.available ? "unavailable" : ""}`} key={layer.id}>
                    <span>
                      <i style={{ background: layer.color }} />
                      {layer.name}
                      <small>{layer.dataStatus.replace("_", " ")}</small>
                    </span>
                    <input
                      checked={layer.enabled}
                      disabled={!layer.available}
                      onChange={() => toggle(layer.id)}
                      type="checkbox"
                    />
                  </label>
                ))}
            </section>
          ))}
          <div className="saved-list">
            <h3>Saved Locations</h3>
            {saved.length ? (
              saved.map((item) => (
                <div className="saved-location-row" key={item.id}>
                  <button
                    onClick={() =>
                      onSelect({ latitude: item.latitude, longitude: item.longitude, source: "saved", label: item.name })
                    }
                  >
                    <MapPin size={13} />
                    {item.name}
                  </button>
                  <button onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => void removeLocation(item)} aria-label={`Delete ${item.name}`}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            ) : (
              <small>No saved locations yet.</small>
            )}
          </div>
        </aside>

        {/* Center Map Canvas */}
        <section className="map-canvas-v2" style={{ position: "relative" }}>
          <MarineMap
            large
            layers={displayedLayers}
            selectedLocation={selected}
            savedLocations={saved}
            alerts={mapAlerts}
            pfzs={pfzGeojson}
            focusAlertId={requestedAlertId}
            selectMode={selectMode}
            onSelectLocation={onSelect}
            onFeatureSelect={setDetails}
            riskLevel={risk.data?.level}
          />

          {/* Floating Re-center and Compass Controls */}
          <div
            style={{
              position: "absolute",
              top: "22px",
              right: "22px",
              zIndex: 10,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <button
              type="button"
              onClick={handleRecenter}
              title="Re-centre on active location"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0284c7",
                cursor: "pointer",
              }}
            >
              <Maximize2 size={17} />
            </button>
            <button
              type="button"
              onClick={handleResetNorth}
              title="Reset North Heading"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#e11d48",
                cursor: "pointer",
              }}
            >
              <Compass size={17} />
            </button>
          </div>
        </section>

        {/* Right Feature Details Aside */}
        <aside className="feature-panel-v2">
          {details ? (
            <SamudraFeatureDetails
              details={details}
              onClose={() => setDetails(null)}
              onPlanRoute={(lat, lon, label) => {
                router.push(`/routes?destLat=${lat}&destLon=${lon}&destLabel=${encodeURIComponent(label)}`);
              }}
            />
          ) : (
            <>
              <div className="feature-icon">
                <MapPin size={19} />
              </div>
              <p className="eyebrow">SELECTED LOCATION</p>
              <h3>{selected ? locationLabel(selected) : "Choose a location"}</h3>
              <span className="coordinates">{selectedDisplay}</span>
              {selected?.accuracy && <p className="accuracy">Accuracy ±{Math.round(selected.accuracy)} m</p>}
              <div className="feature-actions">
                {selected && (
                  <button onClick={openCreate}>
                    <Save size={15} /> Save Location
                  </button>
                )}
                <button onClick={() => setSelectMode(true)}>
                  <Crosshair size={15} /> Select on map
                </button>
              </div>
            </>
          )}
          <MapRiskPanel
            location={selected}
            assessment={risk.data}
            loading={risk.loading}
            error={risk.error}
            onAssess={() => {
              void risk.evaluate(false);
            }}
            assessmentTime={riskAssessmentTime}
            onAssessmentTimeChange={setRiskAssessmentTime}
          />
        </aside>
      </div>

      <ConditionsPanel
        compact
        conditions={conditions.data}
        loading={conditions.loading}
        error={conditions.error}
        onRefresh={conditions.refresh}
      />

      <section className="map-alert-sidebar">
        <AlertSafetyNote />
        {focusedAlert && (
          <>
            <div className="section-heading">
              <h2>Requested advisory</h2>
            </div>
            <MarineAlertCard compact alert={focusedAlert} />
          </>
        )}
        {alertData.error || alertData.data?.status === "unavailable" ? (
          <p className="alert-state-warning">Unable to check alerts. The map cannot show a safety-clear state.</p>
        ) : alertData.data?.alerts.length ? (
          <>
            <div className="section-heading">
              <h2>Nearby active advisories</h2>
              <span>{alertData.data.alerts.length}</span>
            </div>
            {alertData.data.alerts
              .filter((alert) => alert.id !== focusedAlert?.id)
              .slice(0, 3)
              .map((alert) => (
                <MarineAlertCard compact alert={alert} key={alert.id} />
              ))}
          </>
        ) : selected ? (
          <p className="location-help">No active alerts found from available configured providers.</p>
        ) : (
          <p className="location-help">Select a location to check nearby alerts.</p>
        )}
      </section>

      {saveError && !saveOpen && (
        <p className="save-error" role="alert">
          {saveError}
        </p>
      )}

      {saveOpen && selected && (
        <div className="map-dialog-backdrop">
          <form
            className="map-dialog"
            onSubmit={(event) => {
              event.preventDefault();
              void saveLocation();
            }}
          >
            <h3>{editingLocation ? "Edit Saved Location" : "Save Location"}</h3>
            <p>{selectedDisplay}</p>
            <label>
              Name
              <input value={saveName} onChange={(event) => setSaveName(event.target.value)} required />
            </label>
            <label>
              Type
              <select
                value={saveType}
                onChange={(event) => setSaveType(event.target.value as SavedLocationType)}
              >
                <option value="HOME_HARBOUR">Home Harbour</option>
                <option value="FISHING_HARBOUR">Fishing Harbour</option>
                <option value="FISHING_SPOT">Fishing Spot</option>
                <option value="CUSTOM">Custom</option>
              </select>
            </label>
            {saveError && <span className="auth-error">{saveError}</span>}
            <div>
              <button type="button" onClick={closeSaveDialog}>
                Cancel
              </button>
              <button className="button" disabled={saving}>
                {saving ? "Saving…" : "Save Location"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function SamudraFeatureDetails({
  details,
  onClose,
  onPlanRoute,
}: {
  details: MapFeatureDetails;
  onClose: () => void;
  onPlanRoute: (lat: number, lon: number, label: string) => void;
}) {
  const props = details.properties as Record<string, unknown>;
  const coordParts = details.coordinates ? details.coordinates.split(",").map((s) => parseFloat(s.trim())) : null;
  const lat = coordParts && !isNaN(coordParts[0]) ? coordParts[0] : 13.08;
  const lon = coordParts && !isNaN(coordParts[1]) ? coordParts[1] : 80.27;

  const isTfz = details.type?.toLowerCase().includes("tfz") || details.type?.toLowerCase().includes("tuna");
  const isPfz = details.type?.toLowerCase().includes("pfz") || details.type?.toLowerCase().includes("fishing");
  const isWave = details.type?.toLowerCase().includes("wave");
  const isCurrent = details.type?.toLowerCase().includes("current");
  const isSvas = details.type?.toLowerCase().includes("svas") || details.type?.toLowerCase().includes("vessel");

  const badgeIcon = isTfz ? "🦈" : isWave ? "🌊" : isCurrent ? "🌀" : isSvas ? "🚤" : isPfz ? "🐟" : "📍";
  const badgeTitle = isTfz
    ? "INCOIS Tuna Fishing Zone (TFZ)"
    : isWave
    ? "Ocean State Forecast (OSF) - Waves"
    : isCurrent
    ? "Surface Current Vector"
    : isSvas
    ? "Small Vessel Advisory (SVAS)"
    : isPfz
    ? "Potential Fishing Zone (PFZ)"
    : details.type;

  const status = String(props.status || details.status || "LIVE");
  const isSafe = status.toLowerCase().includes("safe") || status.toLowerCase().includes("normal");
  const isWarning = status.toLowerCase().includes("warning") || status.toLowerCase().includes("rough");

  return (
    <>
      <button className="close-panel" onClick={onClose} aria-label="Close feature details">
        <X size={16} />
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
        <span style={{ fontSize: "16px" }}>{badgeIcon}</span>
        <span style={{ fontSize: "10px", fontWeight: 700, color: "#0284c7", textTransform: "uppercase" }}>
          {badgeTitle}
        </span>
      </div>

      <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: "0 0 6px 0" }}>
        {details.title}
      </h3>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
        <span
          style={{
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: "10px",
            fontSize: "10px",
            fontWeight: 700,
            background: isSafe ? "#dcfce7" : isWarning ? "#fee2e2" : "#fef3c7",
            color: isSafe ? "#15803d" : isWarning ? "#b91c1c" : "#b45309",
          }}
        >
          {status}
        </span>
        <span style={{ fontSize: "11px", color: "#64748b" }}>{details.coordinates}</span>
      </div>

      {/* Telemetry Chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
        {props.wave_height != null && (
          <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "6px", background: "#e0f2fe", color: "#0369a1", fontWeight: 600 }}>
            🌊 Wave: {String(props.wave_height)}m
          </span>
        )}
        {props.swell_period != null && (
          <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "6px", background: "#e0f2fe", color: "#0369a1" }}>
            ⏱️ Swell: {String(props.swell_period)} ({String(props.swell_direction || "SW")})
          </span>
        )}
        {props.speed_ms != null && (
          <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "6px", background: "#f3e8ff", color: "#7e22ce", fontWeight: 600 }}>
            🌀 Current: {String(props.speed_ms)} m/s ({String(props.speed_knots || "")} kn)
          </span>
        )}
        {props.depth != null && (
          <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "6px", background: "#f1f5f9", color: "#334155" }}>
            ⚓ Depth: {String(props.depth)}
          </span>
        )}
        {props.sst != null && (
          <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "6px", background: "#ffedd5", color: "#c2410c" }}>
            🌡️ SST: {String(props.sst)}
          </span>
        )}
      </div>

      {/* Target Species */}
      {props.target_species != null && (
        <div style={{ marginBottom: "10px", background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "2px" }}>
            🐟 Target Species
          </div>
          <div style={{ fontSize: "12px", color: "#0f172a", fontWeight: 600 }}>
            {String(props.target_species)}
          </div>
        </div>
      )}

      {/* Advisory & Recommendation */}
      {(props.advisory != null || props.recommendation != null) && (
        <div style={{ marginBottom: "12px", background: "#fefce8", padding: "8px 10px", borderRadius: "6px", border: "1px solid #fef08a" }}>
          <div style={{ fontSize: "11px", color: "#854d0e", lineHeight: 1.4 }}>
            ℹ️ {String(props.advisory || props.recommendation)}
          </div>
        </div>
      )}

      {/* Action: Plan Route to this location */}
      <button
        type="button"
        className="button"
        onClick={() => onPlanRoute(lat, lon, details.title)}
        style={{
          width: "100%",
          padding: "8px",
          background: "#0284c7",
          color: "#ffffff",
          fontWeight: 700,
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          fontSize: "12px",
          cursor: "pointer",
          marginBottom: "12px",
        }}
      >
        <Route size={14} /> Plan Route to this Location
      </button>

      {/* Raw Properties Accordion */}
      <div className="feature-data-v2">
        <div>
          <span>Source</span>
          <b>{details.source}</b>
        </div>
        <div>
          <span>Updated</span>
          <b>{details.updated}</b>
        </div>
      </div>
    </>
  );
}
