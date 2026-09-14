"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { 
  MapPin, 
  Navigation, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  RefreshCw, 
  Anchor 
} from "lucide-react";

export interface MobileLocation {
  latitude: number;
  longitude: number;
  label: string;
  source: "gps" | "manual";
}

export const MAJOR_COASTAL_PORTS = [
  // West Coast (Arabian Sea)
  { name: "Kochi Port (कोच्चि)", state: "Kerala", region: "West Coast", lat: 9.93, lon: 76.26, sea: "Arabian Sea", tag: "प्रमुख PFZ हब" },
  { name: "Veraval (वेरावल)", state: "Gujarat", region: "West Coast", lat: 20.90, lon: 70.36, sea: "Arabian Sea", tag: "मत्स्य बंदरगाह" },
  { name: "Mumbai (मुंबई)", state: "Maharashtra", region: "West Coast", lat: 18.92, lon: 72.83, sea: "Arabian Sea", tag: "ससून डॉक" },
  { name: "Porbandar (पोरबंदर)", state: "Gujarat", region: "West Coast", lat: 21.64, lon: 69.60, sea: "Arabian Sea", tag: "सक्रिय मत्स्य केंद्र" },
  { name: "Mangalore (मंगलौर)", state: "Karnataka", region: "West Coast", lat: 12.87, lon: 74.84, sea: "Arabian Sea", tag: "पुराना बंदरगाह" },
  { name: "Ratnagiri (रत्नागिरी)", state: "Maharashtra", region: "West Coast", lat: 16.99, lon: 73.30, sea: "Arabian Sea", tag: "मिरकरवाड़ा" },
  { name: "Goa (गोवा)", state: "Goa", region: "West Coast", lat: 15.40, lon: 73.80, sea: "Arabian Sea", tag: "मोरमुगाओ" },
  
  // East Coast & South
  { name: "Chennai (चेन्नई)", state: "Tamil Nadu", region: "East Coast", lat: 13.08, lon: 80.27, sea: "Bay of Bengal", tag: "कासिमेडु बंदरगाह" },
  { name: "Vizag (विशाखापट्टनम)", state: "Andhra Pradesh", region: "East Coast", lat: 17.68, lon: 83.21, sea: "Bay of Bengal", tag: "गहरे समुद्र क्षेत्र" },
  { name: "Kanyakumari (कन्याकुमारी)", state: "Tamil Nadu", region: "South", lat: 8.08, lon: 77.55, sea: "Indian Ocean", tag: "त्रिवेणी संगम" },
  { name: "Tuticorin (तूतीकोरिन)", state: "Tamil Nadu", region: "East Coast", lat: 8.76, lon: 78.13, sea: "Gulf of Mannar", tag: "मत्स्य केंद्र" },
  { name: "Paradip (पारादीप)", state: "Odisha", region: "East Coast", lat: 20.26, lon: 86.66, sea: "Bay of Bengal", tag: "चक्रवात निगरानी" },
  { name: "Digha (दीघा)", state: "West Bengal", region: "East Coast", lat: 21.62, lon: 87.51, sea: "Bay of Bengal", tag: "हिल्सा जोन" },
];

interface LocationDetectorProps {
  onLocationConfirmed: (loc: MobileLocation) => void;
  initialLocation?: MobileLocation | null;
}

export function LocationDetector({ onLocationConfirmed, initialLocation }: LocationDetectorProps) {
  const [gpsStatus, setGpsStatus] = useState<"detecting" | "success" | "failed">(() =>
    initialLocation ? "success" : "detecting"
  );
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lon: number } | null>(() =>
    initialLocation ? { lat: initialLocation.latitude, lon: initialLocation.longitude } : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [customLat, setCustomLat] = useState("");
  const [customLon, setCustomLon] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const detectGPS = useCallback(() => {
    setGpsStatus("detecting");
    setErrorMessage("");
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGpsStatus("failed");
      setErrorMessage("GPS is not supported on this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setDetectedCoords({ lat, lon });
        setGpsStatus("success");
      },
      (err) => {
        setGpsStatus("failed");
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMessage("GPS अनुमति नहीं मिली। नीचे से अपना बंदरगाह चुनें।");
        } else {
          setErrorMessage("GPS सिग्नल नहीं मिला। नीचे से अपना बंदरगाह चुनें।");
        }
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    if (initialLocation) return;
    if (typeof window === "undefined" || !navigator.geolocation) {
      const timer = window.setTimeout(() => {
        setGpsStatus("failed");
        setErrorMessage("GPS browser support unavailable.");
      }, 0);
      return () => window.clearTimeout(timer);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setDetectedCoords({ lat, lon });
        setGpsStatus("success");
      },
      () => {
        setGpsStatus("failed");
      },
      { timeout: 5000, enableHighAccuracy: true }
    );
  }, [initialLocation]);

  const confirmGPSLocation = () => {
    if (!detectedCoords) return;
    let closestPort = MAJOR_COASTAL_PORTS[0];
    let minDiff = Infinity;
    for (const port of MAJOR_COASTAL_PORTS) {
      const diff = Math.hypot(port.lat - detectedCoords.lat, port.lon - detectedCoords.lon);
      if (diff < minDiff) {
        minDiff = diff;
        closestPort = port;
      }
    }

    const label = minDiff < 1.2 
      ? `${closestPort.name}, ${closestPort.state}`
      : `तटीय GPS (${detectedCoords.lat.toFixed(2)}°, ${detectedCoords.lon.toFixed(2)}°)`;

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

  const handleCustomCoordinatesSubmit = (e: FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(customLat);
    const lon = parseFloat(customLon);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      alert("Please enter valid coordinates (e.g. 18.92, 72.83).");
      return;
    }
    onLocationConfirmed({
      latitude: lat,
      longitude: lon,
      label: `कस्टम स्थान (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`,
      source: "manual",
    });
  };

  const filteredPorts = MAJOR_COASTAL_PORTS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sea.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: "16px", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column" }}>
      {/* 1. Header / GPS Status Banner */}
      <div 
        style={{
          background: "linear-gradient(135deg, rgba(2, 132, 199, 0.2) 0%, rgba(12, 21, 36, 0.95) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.35)",
          borderRadius: "18px",
          padding: "16px",
          marginBottom: "16px",
          textAlign: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
        }}
      >
        {gpsStatus === "detecting" ? (
          <div>
            <div className="radar-circle" style={{ margin: "0 auto 12px", width: "70px", height: "70px" }}>
              <div className="radar-sweep" />
              <Navigation size={28} style={{ color: "#38bdf8" }} />
            </div>
            <strong style={{ fontSize: "15px", display: "block", color: "#f8fafc" }}>
              तटीय GPS खोज रहे हैं...
            </strong>
            <span style={{ fontSize: "11.5px", color: "#94a3b8", display: "block", marginTop: "2px" }}>
              Searching for coastal satellites or choose port below:
            </span>
          </div>
        ) : gpsStatus === "success" && detectedCoords ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", color: "#34d399", marginBottom: "6px" }}>
              <CheckCircle2 size={22} />
              <strong style={{ fontSize: "15px" }}>स्थान मिल गया (GPS Locked)</strong>
            </div>
            <p style={{ fontSize: "13.5px", color: "#38bdf8", fontWeight: 700, margin: "2px 0 10px" }}>
              {detectedCoords.lat.toFixed(4)}°N, {detectedCoords.lon.toFixed(4)}°E
            </p>
            <button
              type="button"
              onClick={confirmGPSLocation}
              style={{
                width: "100%",
                padding: "11px",
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <span>✅ इस स्थान के साथ शुरू करें (Continue with GPS)</span>
              <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "#fbbf24", marginBottom: "4px" }}>
              <AlertCircle size={18} />
              <span style={{ fontSize: "13px", fontWeight: 700 }}>GPS स्वतः नहीं मिला</span>
            </div>
            <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "8px" }}>
              {errorMessage || "नीचे दिए गए बंदरगाहों में से एक चुनें:"}
            </span>
            <button
              type="button"
              onClick={detectGPS}
              style={{
                background: "rgba(56, 189, 248, 0.15)",
                border: "1px solid rgba(56, 189, 248, 0.35)",
                color: "#38bdf8",
                padding: "5px 12px",
                borderRadius: "16px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <RefreshCw size={11} /> दोबारा GPS खोजें (Retry GPS)
            </button>
          </div>
        )}
      </div>

      {/* 2. Direct 1-Tap Coastal Ports Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 800, color: "#f8fafc", display: "flex", alignItems: "center", gap: "6px", margin: 0 }}>
          <Anchor size={18} style={{ color: "#38bdf8" }} />
          प्रमुख तटीय बंदरगाह (Tap to Select)
        </h3>
        <span style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 600 }}>
          1-Tap
        </span>
      </div>

      {/* Search Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(12, 21, 36, 0.8)",
          border: "1px solid rgba(56, 189, 248, 0.25)",
          padding: "9px 12px",
          borderRadius: "14px",
          marginBottom: "10px",
        }}
      >
        <Search size={16} style={{ color: "#64748b" }} />
        <input
          type="text"
          placeholder="बंदरगाह खोजें (Kochi, Veraval, Mumbai, Kasimedu...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: "13px",
            outline: "none",
            width: "100%",
          }}
        />
      </div>

      {/* Ports Grid */}
      <div style={{ flex: 1, overflowY: "auto", paddingRight: "2px" }}>
        <div className="ports-grid" style={{ marginTop: 0 }}>
          {filteredPorts.map((port) => (
            <button
              key={port.name}
              type="button"
              className="port-card-btn"
              onClick={() => handleSelectPort(port)}
            >
              <strong style={{ color: "#f8fafc", fontSize: "13px" }}>
                <MapPin size={14} style={{ color: "#38bdf8", flexShrink: 0 }} />
                {port.name}
              </strong>
              <small style={{ color: "#94a3b8" }}>{port.state} · {port.sea}</small>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
                <span style={{ fontSize: "9.5px", color: "#34d399", background: "rgba(16, 185, 129, 0.12)", padding: "1px 6px", borderRadius: "4px" }}>
                  {port.tag}
                </span>
                <span style={{ fontSize: "10px", color: "#38bdf8", fontWeight: 600 }}>
                  चुनें ➔
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Decimal Coords Entry */}
      <form
        onSubmit={handleCustomCoordinatesSubmit}
        style={{
          marginTop: "10px",
          paddingTop: "10px",
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
            borderRadius: "10px",
            background: "rgba(12, 21, 36, 0.8)",
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
            borderRadius: "10px",
            background: "rgba(12, 21, 36, 0.8)",
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
            borderRadius: "10px",
            background: "#0284c7",
            color: "#fff",
            border: "none",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            opacity: !customLat || !customLon ? 0.4 : 1,
          }}
        >
          Set
        </button>
      </form>
    </div>
  );
}
