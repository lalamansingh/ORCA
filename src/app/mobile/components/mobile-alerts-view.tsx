"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, PhoneCall, Radio, RefreshCw, LoaderCircle, CheckCircle2 } from "lucide-react";
import { getAlerts } from "@/lib/api/alerts";
import type { AlertListResponse, MarineAlert } from "@/features/alerts/types";
import type { MobileLocation } from "./location-detector";

interface MobileAlertsViewProps {
  location: MobileLocation;
}

export function MobileAlertsView({ location }: MobileAlertsViewProps) {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<MarineAlert[]>([]);
  const [error, setError] = useState("");

  const fetchAlerts = async () => {
    setLoading(true);
    setError("");
    try {
      const res: AlertListResponse = await getAlerts({
        latitude: location.latitude,
        longitude: location.longitude,
        radiusKm: 200,
        active: true,
      });
      setAlerts(res.alerts || []);
    } catch {
      setError("Unable to connect to IMD/INCOIS alert servers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void getAlerts({
      latitude: location.latitude,
      longitude: location.longitude,
      radiusKm: 200,
      active: true,
    })
      .then((res) => {
        if (active) {
          setAlerts(res.alerts || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError("Unable to connect to IMD/INCOIS alert servers.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [location.latitude, location.longitude]);

  return (
    <div style={{ padding: "16px", height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div>
          <h2 style={{ fontSize: "17px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldAlert size={20} style={{ color: "#ef4444" }} />
            सुरक्षा अलर्ट और चेतावनी
          </h2>
          <p style={{ fontSize: "11px", color: "#94a3b8" }}>
            INCOIS, IMD CAP & Maritime Coastal Bulletins
          </p>
        </div>
        <button
          type="button"
          onClick={fetchAlerts}
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

      {/* Emergency SOS Quick Dial Cards */}
      <div
        className="mobile-info-card"
        style={{
          background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)",
          border: "1px solid rgba(239, 68, 68, 0.4)",
          marginBottom: "16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
          <PhoneCall size={18} style={{ color: "#ef4444" }} />
          <strong style={{ fontSize: "14px", color: "#fca5a5" }}>
            समुद्री आपातकालीन सहायता (Emergency SOS)
          </strong>
        </div>
        <p style={{ fontSize: "11.5px", color: "#cbd5e1", lineHeight: 1.4, marginBottom: "10px" }}>
          यदि आप समुद्र में संकट में हैं या तत्काल सहायता की आवश्यकता है:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
          <a
            href="tel:1554"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              background: "#ef4444",
              color: "#fff",
              padding: "10px",
              borderRadius: "10px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
            }}
          >
            <Radio size={15} /> Coast Guard: 1554
          </a>

          <a
            href="tel:1093"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              background: "#0284c7",
              color: "#fff",
              padding: "10px",
              borderRadius: "10px",
              textDecoration: "none",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            <PhoneCall size={15} /> Coastal Police: 1093
          </a>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8" }}>
          <LoaderCircle className="spin" size={24} style={{ color: "#38bdf8", margin: "0 auto 8px" }} />
          <p style={{ fontSize: "12px" }}>आधिकारिक मौसम चेतावनियों की जांच हो रही है...</p>
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
          }}
        >
          {error}
        </div>
      )}

      {/* Active Alerts List */}
      {!loading && alerts.length === 0 && (
        <div
          className="mobile-info-card"
          style={{ textAlign: "center", padding: "24px 16px", borderColor: "rgba(16, 185, 129, 0.3)" }}
        >
          <CheckCircle2 size={36} style={{ color: "#10b981", margin: "0 auto 8px" }} />
          <strong style={{ fontSize: "14px", color: "#34d399", display: "block", marginBottom: "4px" }}>
            कोई सक्रिय गंभीर चेतावनी नहीं (No Active Severe Warnings)
          </strong>
          <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
            वर्तमान में आपके 200 किमी तटीय क्षेत्र में कोई चक्रवात या असाधारण ऊंची लहरों का खतरा दर्ज नहीं है।
          </p>
        </div>
      )}

      {!loading && alerts.length > 0 && (
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "10px", color: "#f8fafc" }}>
            सक्रिय सूचनाएं ({alerts.length}):
          </h4>
          {alerts.map((alert) => {
            const isSevere = alert.severity === "CRITICAL" || alert.severity === "SEVERE";
            return (
              <div key={alert.id} className="mobile-info-card" style={{ borderColor: isSevere ? "rgba(239, 68, 68, 0.5)" : "rgba(245, 158, 11, 0.4)" }}>
                <div className="mobile-info-card-header">
                  <span className={`mobile-info-badge ${isSevere ? "red" : "yellow"}`}>
                    {alert.severity} · {alert.type.replaceAll("_", " ")}
                  </span>
                  <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                    {alert.source_type || "OFFICIAL"}
                  </span>
                </div>
                <h3 style={{ fontSize: "14px", fontWeight: 700, margin: "6px 0", color: "#f8fafc" }}>
                  {alert.affected_area || "Coastal Maritime Zone"}
                </h3>
                <p style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: 1.5, margin: "4px 0" }}>
                  {alert.description || alert.summary || "Advisory active for mariners and coastal craft. Exercise caution."}
                </p>
                {alert.instructions && alert.instructions.length > 0 && (
                  <div style={{ marginTop: "8px", padding: "6px 8px", background: "rgba(2, 6, 23, 0.5)", borderRadius: "6px", fontSize: "11px", color: "#fca5a5" }}>
                    <strong>निर्देश: </strong>{alert.instructions.join("; ")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
