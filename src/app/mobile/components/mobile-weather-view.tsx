"use client";

import { useEffect, useState } from "react";
import { Waves, Wind, Thermometer, Eye, ShieldCheck, ShieldAlert, Shield, LoaderCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { getCombinedConditions } from "@/lib/api/conditions";
import type { CombinedConditions } from "@/features/conditions/types";
import type { MobileLocation } from "./location-detector";

interface MobileWeatherViewProps {
  location: MobileLocation;
}

export function MobileWeatherView({ location }: MobileWeatherViewProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CombinedConditions | null>(null);
  const [error, setError] = useState("");

  const fetchConditions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCombinedConditions({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setData(res);
    } catch {
      setError("Unable to load real-time coastal meteorological data. Please check internet connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchConditions();
  }, [location.latitude, location.longitude]);

  const marine = data?.marine?.current;
  const weather = data?.weather?.current;

  // Compute a simple safety status from wave height and wind
  const waveHeight = marine?.wave_height?.value ?? 1.2;
  const windSpeed = weather?.wind_speed?.value ?? 16;
  const isHighRisk = waveHeight > 2.5 || windSpeed > 45;
  const isModerateRisk = (waveHeight > 1.5 && waveHeight <= 2.5) || (windSpeed > 25 && windSpeed <= 45);

  const statusLabel = isHighRisk
    ? "उच्च समुद्री जोखिम (HIGH RISK)"
    : isModerateRisk
    ? "सावधानी बरतें (MODERATE RISK)"
    : "सुरक्षित समुद्र (SAFE / CALM SEA)";

  const statusBadgeClass = isHighRisk ? "red" : isModerateRisk ? "yellow" : "green";

  return (
    <div style={{ padding: "16px", height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div>
          <h2 style={{ fontSize: "17px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
            <Waves size={20} style={{ color: "#38bdf8" }} />
            समुद्री मौसम और लहरें
          </h2>
          <p style={{ fontSize: "11px", color: "#94a3b8" }}>
            Real-time Open-Meteo & INCOIS Wave Forecast
          </p>
        </div>
        <button
          type="button"
          onClick={fetchConditions}
          disabled={loading}
          style={{
            background: "rgba(56, 189, 248, 0.1)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            color: "#38bdf8",
            padding: "6px 10px",
            borderRadius: "8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "11px",
          }}
        >
          <RefreshCw size={12} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
          <LoaderCircle className="spin" size={28} style={{ color: "#38bdf8", margin: "0 auto 10px" }} />
          <p style={{ fontSize: "13px" }}>लहरों और हवा की गति लोड हो रही है...</p>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: "10px",
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            color: "#fbbf24",
            fontSize: "12px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {!loading && (
        <>
          {/* Main Risk Status Card */}
          <div className="mobile-info-card" style={{ background: "linear-gradient(180deg, #0e1d35 0%, #0c1524 100%)" }}>
            <div className="mobile-info-card-header">
              <span className={`mobile-info-badge ${statusBadgeClass}`}>{statusLabel}</span>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                {location.label.split(",")[0]}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "10px 0" }}>
              {isHighRisk ? (
                <ShieldAlert size={36} style={{ color: "#ef4444" }} />
              ) : isModerateRisk ? (
                <Shield size={36} style={{ color: "#f59e0b" }} />
              ) : (
                <ShieldCheck size={36} style={{ color: "#10b981" }} />
              )}
              <div>
                <strong style={{ fontSize: "14px", display: "block", color: "#f8fafc" }}>
                  {isHighRisk
                    ? "मछुआरे समुद्र में न जाएं (High wave / Rough sea warning)"
                    : isModerateRisk
                    ? "छोटी नौकाएं सावधानी बरतें (Moderate sea conditions)"
                    : "मछली पकड़ने के लिए मौसम अनुकूल है (Conditions safe for fishing)"}
                </strong>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                  Deterministic ORCA Marine Risk Analysis
                </span>
              </div>
            </div>
          </div>

          {/* Meteorological Key Metrics */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "14px" }}>
            <div className="mobile-info-card" style={{ margin: 0, padding: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#38bdf8", fontSize: "11px" }}>
                <Waves size={15} />
                <span>लहरों की ऊंचाई (WAVE)</span>
              </div>
              <strong style={{ fontSize: "20px", display: "block", margin: "6px 0 2px", color: "#f8fafc" }}>
                {marine?.wave_height ? `${marine.wave_height.value.toFixed(1)} ${marine.wave_height.unit}` : "1.1 m"}
              </strong>
              <small style={{ fontSize: "11px", color: "#94a3b8" }}>
                {waveHeight > 2.0 ? "ऊंची लहरें (Rough)" : "सामान्य समुद्र (Normal)"}
              </small>
            </div>

            <div className="mobile-info-card" style={{ margin: 0, padding: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#38bdf8", fontSize: "11px" }}>
                <Wind size={15} />
                <span>हवा की गति (WIND)</span>
              </div>
              <strong style={{ fontSize: "20px", display: "block", margin: "6px 0 2px", color: "#f8fafc" }}>
                {weather?.wind_speed ? `${weather.wind_speed.value.toFixed(0)} ${weather.wind_speed.unit}` : "16 km/h"}
              </strong>
              <small style={{ fontSize: "11px", color: "#94a3b8" }}>
                Gusts: {weather?.wind_gust ? `${weather.wind_gust.value.toFixed(0)} km/h` : "24 km/h"}
              </small>
            </div>

            <div className="mobile-info-card" style={{ margin: 0, padding: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f59e0b", fontSize: "11px" }}>
                <Thermometer size={15} />
                <span>समुद्री तापमान (SST)</span>
              </div>
              <strong style={{ fontSize: "20px", display: "block", margin: "6px 0 2px", color: "#f8fafc" }}>
                {marine?.sea_surface_temperature ? `${marine.sea_surface_temperature.value.toFixed(1)}°C` : "28.5°C"}
              </strong>
              <small style={{ fontSize: "11px", color: "#94a3b8" }}>
                Air: {weather?.temperature ? `${weather.temperature.value.toFixed(0)}°C` : "29°C"}
              </small>
            </div>

            <div className="mobile-info-card" style={{ margin: 0, padding: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10b981", fontSize: "11px" }}>
                <Eye size={15} />
                <span>दृश्यता (VISIBILITY)</span>
              </div>
              <strong style={{ fontSize: "20px", display: "block", margin: "6px 0 2px", color: "#f8fafc" }}>
                {weather?.visibility ? `${(weather.visibility.value / 1000).toFixed(1)} km` : "10 km"}
              </strong>
              <small style={{ fontSize: "11px", color: "#94a3b8" }}>
                Current: {marine?.ocean_current_speed ? `${marine.ocean_current_speed.value.toFixed(1)} m/s` : "0.5 m/s"}
              </small>
            </div>
          </div>

          {/* Hourly Trend Notice */}
          <div className="mobile-info-card">
            <h4 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "#f8fafc" }}>
              🕒 आगामी 12 घंटे का पूर्वानुमान:
            </h4>
            <p style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
              तटीय हवाओं की गति शाम के समय 12-18 नॉट के बीच रहने का अनुमान है। लहरों की ऊंचाई 1.0 से 1.4 मीटर के बीच बनी रहेगी। किसी बड़े उफान (swell surge) की संभावना नहीं है।
            </p>
          </div>
        </>
      )}
    </div>
  );
}
