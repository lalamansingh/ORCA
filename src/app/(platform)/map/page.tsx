"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Crosshair, LocateFixed, MapPin, Pencil, Save, SlidersHorizontal, Trash2, X } from "lucide-react";
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
import {
  createSavedLocation,
  deleteSavedLocation,
  getSavedLocations,
  updateSavedLocation,
  type SavedLocation,
  type SavedLocationType,
} from "@/lib/api/saved-locations";

export default function MapPage() {
  const { layers, toggle } = useMapLayers();
  const { user } = useAuth();
  const gps = useGeolocation();
  const [selected, setSelected] = useState<SelectedLocation | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [details, setDetails] = useState<MapFeatureDetails | null>(null);
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
  const [requestedAlertId,setRequestedAlertId]=useState("");
  const [focusedAlert,setFocusedAlert]=useState<MarineAlert|null>(null);
  const conditions = useConditions(selected);
  const alertData = useAlerts(selected, 250, true);
  useEffect(()=>{const timer=window.setTimeout(()=>setRequestedAlertId(new URLSearchParams(window.location.search).get("alert")??""),0);return()=>window.clearTimeout(timer);},[]);
  useEffect(()=>{if(!requestedAlertId)return;let active=true;void getAlert(requestedAlertId,selected?.latitude,selected?.longitude).then(item=>{if(active)setFocusedAlert(item);},()=>{if(active)setFocusedAlert(null);});return()=>{active=false;};},[requestedAlertId,selected?.latitude,selected?.longitude]);
  const mapAlerts=useMemo(()=>{const items=alertData.data?.alerts??[];return focusedAlert&&items.every(item=>item.id!==focusedAlert.id)?[focusedAlert,...items]:items;},[alertData.data?.alerts,focusedAlert]);
  const displayedLayers=useMemo(()=>layers.map(layer=>layer.id==="alerts"?{...layer,dataStatus:alertData.data?.status==="complete"?"LIVE" as const:alertData.data?.status==="partial"?"PARTIAL" as const:alertData.data?.status==="unavailable"?"UNAVAILABLE" as const:"NOT_CONNECTED" as const}:layer),[alertData.data?.status,layers]);

  const loadSavedLocations = useCallback(async () => {
    try {
      setSaved(await getSavedLocations());
    } catch {
      // A signed-out visitor can still use the map; saved locations just stay unavailable.
      setSaved([]);
    }
  }, []);

  const adoptGpsLocation = useCallback((location: SelectedLocation) => {
    setSelected((current) => current?.source === "default" ? location : current ?? location);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadSavedLocations(); }, 0);
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
      setSaved((items) => editingLocation ? items.map((savedItem) => savedItem.id === item.id ? item : savedItem) : [...items, item]);
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

  return (
    <div className="page map-page-v2">
      <PageHeader
        eyebrow="SPATIAL INTELLIGENCE"
        title="Marine Intelligence Map"
        subtitle="Interactive location context with official alert geometry when providers supply it."
      />

      <div className="map-toolbar">
        <button onClick={gps.requestLocation} className="map-control">
          <LocateFixed size={16} />Use my current location
        </button>
        <button onClick={() => setSelectMode((value) => !value)} className={`map-control ${selectMode ? "active" : ""}`}>
          <Crosshair size={16} />{selectMode ? "Click map to select" : "Select location"}
        </button>
        <button onClick={() => setCoordinatesOpen((value) => !value)} className="map-control">
          <SlidersHorizontal size={16} />Coordinates
        </button>
        <span className="map-status">Map Ready · Location: {selected?.source ?? "none"} · Alerts: {alertData.data?.status ?? "not checked"}</span>
      </div>

      {gps.status === "idle" && <p className="location-help">ORCA uses your location to show nearby marine conditions, fishing zones and safety information.</p>}
      {gps.status !== "idle" && gps.status !== "success" && (
        <div className="location-notice">
          {gps.status === "requesting" ? "Requesting location permission…" : gps.status === "permission_denied" ? "Location access is disabled. Select a location manually, use coordinates, a saved location, or try again where your browser permits." : gps.status === "unsupported" ? "This browser does not support location access. Select a location manually or use coordinates." : "ORCA could not determine your location. Try again or select manually."}
        </div>
      )}

      {coordinatesOpen && (
        <section className="coordinate-form">
          <label>Latitude<input value={latitudeInput} onChange={(event) => setLatitudeInput(event.target.value)} inputMode="decimal" placeholder="e.g. 13.0827" /></label>
          <label>Longitude<input value={longitudeInput} onChange={(event) => setLongitudeInput(event.target.value)} inputMode="decimal" placeholder="e.g. 80.2707" /></label>
          <button className="button" onClick={goToCoordinates}>Go to Location</button>
          {coordinateError && <span role="alert">{coordinateError}</span>}
        </section>
      )}

      <div className="map-workspace-v2">
        <aside className="layers-panel-v2">
          <div className="panel-title"><h3>Layers</h3><DataFreshnessBadge>Fixture status</DataFreshnessBadge></div>
          {categories.map((category) => (
            <section key={category}>
              <p>{category}</p>
              {displayedLayers.filter((layer) => layer.category === category).map((layer) => (
                <label className={`layer-row ${!layer.available ? "unavailable" : ""}`} key={layer.id}>
                  <span><i style={{ background: layer.color }} />{layer.name}<small>{layer.dataStatus.replace("_", " ")}</small></span>
                  <input checked={layer.enabled} disabled={!layer.available} onChange={() => toggle(layer.id)} type="checkbox" />
                </label>
              ))}
            </section>
          ))}
          <div className="saved-list">
            <h3>Saved Locations</h3>
            {saved.length ? saved.map((item) => (
              <div className="saved-location-row" key={item.id}>
                <button onClick={() => onSelect({ latitude: item.latitude, longitude: item.longitude, source: "saved", label: item.name })}><MapPin size={13} />{item.name}</button>
                <button onClick={() => openEdit(item)} aria-label={`Edit ${item.name}`}><Pencil size={13} /></button>
                <button onClick={() => void removeLocation(item)} aria-label={`Delete ${item.name}`}><Trash2 size={13} /></button>
              </div>
            )) : <small>No saved locations yet.</small>}
          </div>
        </aside>

        <section className="map-canvas-v2">
          <MarineMap large layers={displayedLayers} selectedLocation={selected} savedLocations={saved} alerts={mapAlerts} focusAlertId={requestedAlertId} selectMode={selectMode} onSelectLocation={onSelect} onFeatureSelect={setDetails} />
        </section>

        <aside className="feature-panel-v2">
          {details ? <FeatureDetails details={details} onClose={() => setDetails(null)} /> : (
            <>
              <div className="feature-icon"><MapPin size={19} /></div>
              <p className="eyebrow">SELECTED LOCATION</p>
              <h3>{selected ? locationLabel(selected) : "Choose a location"}</h3>
              <span className="coordinates">{selectedDisplay}</span>
              {selected?.accuracy && <p className="accuracy">Accuracy ±{Math.round(selected.accuracy)} m</p>}
              <div className="feature-actions">
                {selected && <button onClick={openCreate}><Save size={15} />Save Location</button>}
                <button onClick={() => setSelectMode(true)}><Crosshair size={15} />Select on map</button>
              </div>
            </>
          )}
        </aside>
      </div>

      <ConditionsPanel compact conditions={conditions.data} loading={conditions.loading} error={conditions.error} onRefresh={conditions.refresh} />
      <section className="map-alert-sidebar"><AlertSafetyNote/>{focusedAlert&&<><div className="section-heading"><h2>Requested advisory</h2></div><MarineAlertCard compact alert={focusedAlert}/></>}{alertData.error||alertData.data?.status==="unavailable"?<p className="alert-state-warning">Unable to check alerts. The map cannot show a safety-clear state.</p>:alertData.data?.alerts.length?<><div className="section-heading"><h2>Nearby active advisories</h2><span>{alertData.data.alerts.length}</span></div>{alertData.data.alerts.filter(alert=>alert.id!==focusedAlert?.id).slice(0,3).map(alert=><MarineAlertCard compact alert={alert} key={alert.id}/>)}</>:selected?<p className="location-help">No active alerts found from available configured providers.</p>:<p className="location-help">Select a location to check nearby alerts.</p>}</section>

      {saveError && !saveOpen && <p className="save-error" role="alert">{saveError}</p>}
      {saveOpen && selected && (
        <div className="map-dialog-backdrop">
          <form className="map-dialog" onSubmit={(event) => { event.preventDefault(); void saveLocation(); }}>
            <h3>{editingLocation ? "Edit Saved Location" : "Save Location"}</h3>
            <p>{selectedDisplay}</p>
            <label>Name<input value={saveName} onChange={(event) => setSaveName(event.target.value)} required /></label>
            <label>Type<select value={saveType} onChange={(event) => setSaveType(event.target.value as SavedLocationType)}><option value="HOME_HARBOUR">Home Harbour</option><option value="FISHING_HARBOUR">Fishing Harbour</option><option value="FISHING_SPOT">Fishing Spot</option><option value="CUSTOM">Custom</option></select></label>
            {saveError && <span className="auth-error">{saveError}</span>}
            <div><button type="button" onClick={closeSaveDialog}>Cancel</button><button className="button" disabled={saving}>{saving ? "Saving…" : "Save Location"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

function FeatureDetails({ details, onClose }: { details: MapFeatureDetails; onClose: () => void }) {
  return <>
    <button className="close-panel" onClick={onClose} aria-label="Close feature details"><X size={16} /></button>
    <p className="eyebrow">{details.status}</p>
    <h3>{details.title}</h3>
    <span>{details.type}</span>
    <div className="feature-data-v2">
      <div><span>Coordinates</span><b>{details.coordinates}</b></div>
      <div><span>Source</span><b>{details.source}</b></div>
      <div><span>Updated</span><b>{details.updated}</b></div>
      {Object.entries(details.properties).map(([key, value]) => <div key={key}><span>{key}</span><b>{value}</b></div>)}
    </div>
  </>;
}
