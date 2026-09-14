"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, Compass, Search, AlertCircle, CheckCircle2, ChevronRight, RefreshCw } from "lucide-react";

export interface MobileLocation {
  latitude: number;
  longitude: number;
  label: string;
  source: "gps" | "manual";
}

const MAJOR_COASTAL_PORTS = [
  { name: "Mumbai Harbor", state: "Maharashtra", lat: 18.92, lon: 72.83, sea: "Arabian Sea" },
  { name: "Kochi Port & Harbor", state: "Kerala", lat: 9.93, lon: 76.26, sea: "Arabian Sea" },
  { name: "Veraval Fishing Port", state: "Gujarat", lat: 20.90, lon: 70.36, sea: "Arabian Sea" },
  { name: "Porbandar Harbor", state: "Gujarat", lat: 21.64, lon: 69.60, sea: "Arabian Sea" },
  { name: "Chennai Port & Kasimedu", state: "Tamil Nadu", lat: 13.08, lon: 80.27, sea: "Bay of Bengal" },
  { name: "Visakhapatnam Harbor", state: "Andhra Pradesh", lat: 17.68, lon: 83.21, sea: "Bay of Bengal" },
  { name: "Mangalore Bunder", state: "Karnataka", lat: 12.87, lon: 74.84, sea: "Arabian Sea" },
  { name: "Ratnagiri Mirkarwada", state: "Maharashtra", lat: 16.99, lon: 73.30, sea: "Arabian Sea" },
  { name: "Goa (Mormugao & Panaji)", state: "Goa", lat: 15.40, lon: 73.80, sea: "Arabian Sea" },
  { name: "Kanyakumari Coast", state: "Tamil Nadu", lat: 8.08, lon: 77.55, sea: "Indian Ocean" },
  { name: "Tuticorin (Thoothukudi)", state: "Tamil Nadu", lat: 8.76, lon: 78.13, sea: "Gulf of Mannar" },
  { name: "Paradip Port", state: "Odisha", lat: 20.26, lon: 86.66, sea: "Bay of Bengal" },
  { name: "Digha & Shankarpur", state: "West Bengal", lat: 21.62, lon: 87.51, sea: "Bay of Bengal" },
];

interface LocationDetectorProps {
  onLocationConfirmed: (loc: MobileLocation) => void;
  initialLocation?: MobileLocation | null;
}

export function LocationDetector({ onLocationConfirmed, initialLocation }: LocationDetectorProps) {
  const [gpsStatus, setGpsStatus] = useState<"detecting" | "success" | "failed">("detecting");
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customLat, setCustomLat] = useState("");
  const [customLon, setCustomLon] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const detectGPS = () => {
    setGpsStatus("detecting");
    setErrorMessage("");

    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsStatus("failed");
      setErrorMessage("GPS is not supported on this device/browser.");
      setManualMode(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setDetectedCoords({ lat, lon });
        setGpsStatus("success");
      },
      (error) => {
        setGpsStatus("failed");
        if (error.code === error.PERMISSION_DENIED) {
          setErrorMessage("Location permission was denied. Please select your port manually.");
        } else {
          setErrorMessage("Unable to retrieve GPS satellite fix. Please select manually.");
        }
        setManualMode(true);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (!initialLocation) {
      detectGPS();
    } else {
      setDetectedCoords({ lat: initialLocation.latitude, lon: initialLocation.longitude });
      setGpsStatus("success");
    }
  }, []);

  const confirmGPSLocation = () => {
    if (!detectedCoords) return;
    // Find closest coastal port for human-friendly label
    let closestPort = MAJOR_COASTAL_PORTS[0];
    let minDiff = Infinity;
    for (const port of MAJOR_COASTAL_PORTS) {
      const diff = Math.hypot(port.lat - detectedCoords.lat, port.lon - detectedCoords.lon);
      if (diff < minDiff) {
        minDiff = diff;
        closestPort = port;
      }
    }

    const label = minDiff < 1.0 
      ? `${closestPort.name} (${closestPort.state})`
      : `Coast (${detectedCoords.lat.toFixed(2)}°, ${detectedCoords.lon.toFixed(2)}°)`;

    onLocationConfirmed({
      latitude: detectedCoords.lat,
      longitude: detectedCoords.lon,
      label,
      source: "gps",
    });
  };

  const handleSelectPort = (port: typeof MAJOR_COASTAL_PORTS[0]) => {
    onLocationConfirmed({
      latitude: port.lat,
      longitude: port.lon,
      label: `${port.name}, ${port.state}`,
      source: "manual",
    });
  };

  const handleCustomCoordinatesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      alert("Please enter valid decimal coordinates (e.g. 18.92, 72.83).");
      return;
    }
    onLocationConfirmed({
      latitude: lat,
      longitude: lon,
      label: `Custom Port (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
      source: "manual",
    });
  };

  const filteredPorts = MAJOR_COASTAL_PORTS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sea.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="location-detection-screen">
      {/* Detecting Stage */}
      {gpsStatus === "detecting" && !manualMode && (
        <div style={{ width: "100%", maxWidth: "340px", textAlign: "center" }}>
          <div className="radar-circle" style={{ margin: "0 auto 20px" }}>
            <div className="radar-sweep" />
            <div className="radar-sweep-2" />
            <Navigation size={36} style={{ color: "#38bdf8" }} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>
            तटीय स्थान खोज रहे हैं...
          </h2>
          <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: 1.5, marginBottom: "20px" }}>
            Detecting your coastal GPS position for customized fishing zones and wave safety.
          </p>
          <button
            type="button"
            className="presentation-btn"
            style={{ margin: "0 auto", padding: "8px 16px", borderRadius: "20px" }}
            onClick={() => setManualMode(true)}
          >
            मैन्युअल रूप से चुनें (Choose Manually)
          </button>
        </div>
      )}

      {/* GPS Success Stage */}
      {gpsStatus === "success" && !manualMode && detectedCoords && (
        <div style={{ width: "100%", maxWidth: "340px", textAlign: "center" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "rgba(16, 185, 129, 0.15)",
              border: "2px solid #10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "#10b981",
            }}
          >
            <CheckCircle2 size={38} />
          </div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "6px" }}>
            स्थान मिल गया (Location Detected)
          </h2>
          <p style={{ fontSize: "14px", color: "#38bdf8", fontWeight: 600, marginBottom: "4px" }}>
            {detectedCoords.lat.toFixed(4)}° N, {detectedCoords.lon.toFixed(4)}° E
          </p>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "24px" }}>
            GPS Coordinates locked for live sea state & PFZ calculation.
          </p>

          <button
            type="button"
            onClick={confirmGPSLocation}
            style={{
              width: "100%",
              padding: "13px",
              background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "14px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(2, 132, 199, 0.4)",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span>आगे बढ़ें (Open Assistant Chat)</span>
            <ChevronRight size={18} />
          </button>

          <button
            type="button"
            onClick={() => setManualMode(true)}
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              fontSize: "12px",
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            दूसरा बंदरगाह / स्थान चुनें (Change Port Manually)
          </button>
        </div>
      )}

      {/* Manual Selection Mode */}
      {manualMode && (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
          <div style={{ textAlign: "left", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 700 }}>बंदरगाह / तटीय स्थान चुनें</h2>
              <button
                type="button"
                onClick={detectGPS}
                style={{
                  background: "rgba(56, 189, 248, 0.12)",
                  border: "1px solid rgba(56, 189, 248, 0.25)",
                  color: "#38bdf8",
                  padding: "4px 8px",
                  borderRadius: "8px",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={12} /> Auto GPS
              </button>
            </div>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
              Select your coastal landing center or enter custom coordinates.
            </p>
            {errorMessage && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: "rgba(245, 158, 11, 0.12)",
                  border: "1px solid rgba(245, 158, 11, 0.25)",
                  color: "#fbbf24",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <AlertCircle size={14} />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Search bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(15, 23, 42, 0.7)",
              border: "1px solid rgba(56, 189, 248, 0.2)",
              padding: "8px 12px",
              borderRadius: "12px",
              marginBottom: "10px",
            }}
          >
            <Search size={16} style={{ color: "#64748b" }} />
            <input
              type="text"
              placeholder="Search Kochi, Mumbai, Veraval..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "#fff",
                fontSize: "12.5px",
                outline: "none",
                width: "100%",
              }}
            />
          </div>

          {/* Ports List */}
          <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px", maxHeight: "380px" }}>
            <div className="ports-grid">
              {filteredPorts.map((port) => (
                <button
                  key={port.name}
                  type="button"
                  className="port-card-btn"
                  onClick={() => handleSelectPort(port)}
                >
                  <strong>
                    <MapPin size={14} style={{ color: "#38bdf8" }} />
                    {port.name}
                  </strong>
                  <small>{port.state} · {port.sea}</small>
                  <span style={{ fontSize: "10px", color: "#38bdf8", marginTop: "2px" }}>
                    {port.lat}°N, {port.lon}°E
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Coords collapsible */}
          <form
            onSubmit={handleCustomCoordinatesSubmit}
            style={{
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px solid rgba(56, 189, 248, 0.15)",
              display: "flex",
              gap: "6px",
              alignItems: "center",
            }}
          >
            <input
              type="number"
              step="any"
              placeholder="Lat (e.g. 18.9)"
              value={customLat}
              onChange={(e) => setCustomLat(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: "8px",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                color: "#fff",
                fontSize: "12px",
                outline: "none",
              }}
            />
            <input
              type="number"
              step="any"
              placeholder="Lon (e.g. 72.8)"
              value={customLon}
              onChange={(e) => setCustomLon(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: "8px",
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(56, 189, 248, 0.2)",
                color: "#fff",
                fontSize: "12px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={!customLat || !customLon}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                background: "#0284c7",
                color: "#fff",
                border: "none",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                opacity: !customLat || !customLon ? 0.5 : 1,
              }}
            >
              Set
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
