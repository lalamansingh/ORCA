"use client";

import { useEffect } from "react";
import { AlertTriangle, ShieldCheck, MapPin, Waves, Wind, ShieldAlert, ArrowUpRight } from "lucide-react";
import { Hazard } from "@/features/hazards/types";

interface FullScreenAlarmAlertProps {
  hazard?: Hazard | null;
  alert?: Hazard | null;
  selectedLang?: string;
  onSafe?: () => void;
  onAcknowledgeSafe?: () => void;
  onViewRoute?: () => void;
  onViewSafeRoute?: (hazard?: Hazard) => void;
  onNeedHelp?: () => void;
  onRequestEmergencySOS?: () => void;
}

export function FullScreenAlarmAlert({
  hazard: propHazard,
  alert: propAlert,
  selectedLang = "en",
  onSafe,
  onAcknowledgeSafe,
  onViewRoute,
  onViewSafeRoute,
  onNeedHelp,
  onRequestEmergencySOS,
}: FullScreenAlarmAlertProps) {
  const activeHazard = propHazard || propAlert;

  // Optional tactile vibration only if explicitly active
  useEffect(() => {
    if (!activeHazard || typeof window === "undefined") return;

    if (navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch (e) {
        // Silent
      }
    }
  }, [activeHazard]);

  if (!activeHazard) return null;

  const handleSafe = () => {
    if (onAcknowledgeSafe) onAcknowledgeSafe();
    else if (onSafe) onSafe();
  };

  const handleViewRoute = () => {
    if (onViewSafeRoute) onViewSafeRoute(activeHazard);
    else if (onViewRoute) onViewRoute();
  };

  const handleNeedHelp = () => {
    if (onRequestEmergencySOS) onRequestEmergencySOS();
    else if (onNeedHelp) onNeedHelp();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 0, 0, 0.94)",
        backdropFilter: "blur(14px)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "flash-border 2s infinite ease-in-out",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "linear-gradient(180deg, #2b0404 0%, #0d0101 100%)",
          border: "2.5px solid #ef4444",
          borderRadius: "22px",
          padding: "24px 20px",
          textAlign: "center",
          color: "#ffffff",
          boxShadow: "0 0 50px rgba(239, 68, 68, 0.6)",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "rgba(220, 38, 38, 0.3)",
            border: "2px solid #ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px auto",
            color: "#f87171",
          }}
        >
          <AlertTriangle size={36} />
        </div>

        <div
          style={{
            display: "inline-block",
            padding: "4px 12px",
            background: "#ef4444",
            borderRadius: "20px",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: "10px",
            color: "#ffffff",
          }}
        >
          🚨 {activeHazard.severity.toUpperCase()} HAZARD BROADCAST
        </div>

        <h2 style={{ fontSize: "20px", fontWeight: 800, margin: "0 0 6px 0", color: "#fee2e2", lineHeight: 1.25 }}>
          {activeHazard.title}
        </h2>

        <p style={{ fontSize: "12px", color: "#fca5a5", margin: "0 0 16px 0", lineHeight: 1.4 }}>
          {activeHazard.headline || activeHazard.description}
        </p>

        {/* Hazard Metrics Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
            background: "rgba(0, 0, 0, 0.4)",
            borderRadius: "12px",
            padding: "10px",
            marginBottom: "16px",
            border: "1px solid rgba(239, 68, 68, 0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#cbd5e1" }}>
            <Waves size={14} style={{ color: "#38bdf8" }} />
            <span>Wave: <strong>{activeHazard.metrics?.wave_height_m ? `${activeHazard.metrics.wave_height_m}m` : "Severe"}</strong></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#cbd5e1" }}>
            <Wind size={14} style={{ color: "#facc15" }} />
            <span>Wind: <strong>{activeHazard.metrics?.wind_speed_kmh ? `${activeHazard.metrics.wind_speed_kmh} km/h` : "Squalls"}</strong></span>
          </div>
        </div>

        {/* Mandatory Action Guidance */}
        <div
          style={{
            background: "rgba(220, 38, 38, 0.15)",
            borderLeft: "3px solid #ef4444",
            borderRadius: "6px",
            padding: "10px 12px",
            textAlign: "left",
            fontSize: "11.5px",
            color: "#fecaca",
            marginBottom: "20px",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: "2px" }}>⚠️ Recommended Action:</div>
          <div>{activeHazard.recommended_action}</div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={handleNeedHelp}
            style={{
              width: "100%",
              padding: "14px",
              background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
              border: "1.5px solid #ef4444",
              borderRadius: "14px",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(220, 38, 38, 0.5)",
            }}
          >
            <ShieldAlert size={18} />
            <span>I NEED HELP — TRIGGER EMERGENCY SOS</span>
          </button>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <button
              onClick={handleViewRoute}
              style={{
                padding: "12px",
                background: "rgba(56, 189, 248, 0.15)",
                border: "1px solid #38bdf8",
                borderRadius: "12px",
                color: "#38bdf8",
                fontWeight: 700,
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                cursor: "pointer",
              }}
            >
              <span>View Safe Route</span>
              <ArrowUpRight size={14} />
            </button>

            <button
              onClick={handleSafe}
              style={{
                padding: "12px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                color: "#cbd5e1",
                fontWeight: 700,
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                cursor: "pointer",
              }}
            >
              <ShieldCheck size={14} style={{ color: "#4ade80" }} />
              <span>I Am Safe</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
