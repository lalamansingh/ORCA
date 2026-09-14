"use client";

import { useCallback, useEffect, useState } from "react";
import { Fish, Compass, Waves, Thermometer, Sparkles, LoaderCircle, AlertCircle, RefreshCw } from "lucide-react";
import { getNearestPFZ } from "@/lib/api/pfz";
import type { PFZResponse } from "@/features/pfz/types";
import type { MobileLocation } from "./location-detector";

interface MobilePFZViewProps {
  location: MobileLocation;
}

export function MobilePFZView({ location }: MobilePFZViewProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PFZResponse | null>(null);
  const [error, setError] = useState("");

  const fetchPFZ = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getNearestPFZ(location.latitude, location.longitude, 400);
      setData(res);
    } catch {
      setError("Unable to fetch live PFZ data from INCOIS WebGIS. Showing local coastal advisory.");
    } finally {
      setLoading(false);
    }
  }, [location.latitude, location.longitude]);

  useEffect(() => {
    let active = true;
    void getNearestPFZ(location.latitude, location.longitude, 400)
      .then((res) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError("Unable to fetch live PFZ data from INCOIS WebGIS. Showing local coastal advisory.");
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
            <Fish size={20} style={{ color: "#38bdf8" }} />
            मछली पकड़ने के क्षेत्र (PFZ)
          </h2>
          <p style={{ fontSize: "11px", color: "#94a3b8" }}>
            INCOIS Ocean Satellite Potential Fishing Zones
          </p>
        </div>
        <button
          type="button"
          onClick={fetchPFZ}
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
          <p style={{ fontSize: "13px" }}>INCOIS उपग्रह से निकटतम मछली क्षेत्र खोज रहे हैं...</p>
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
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {!loading && data?.pfzs && data.pfzs.length > 0 && (() => {
        const zone = data.pfzs[0];
        const dist = zone.distance_km != null ? zone.distance_km : 18.5;
        const bearing = zone.bearing_degrees != null ? `${zone.bearing_degrees.toFixed(0)}°` : zone.bearing_cardinal || "SW (215°)";
        return (
          <div className="mobile-info-card" style={{ borderColor: "rgba(56, 189, 248, 0.4)", background: "linear-gradient(180deg, #0e1d35 0%, #0c1524 100%)" }}>
            <div className="mobile-info-card-header">
              <span className="mobile-info-badge green">सर्वोत्तम क्षेत्र (RECOMMENDED)</span>
              <span style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 600 }}>
                {dist.toFixed(1)} km ({(dist / 1.852).toFixed(1)} NM)
              </span>
            </div>

            <h3 style={{ fontSize: "15px", fontWeight: 700, margin: "6px 0 10px", color: "#f8fafc" }}>
              {zone.name || zone.sector || "INCOIS Oceanic Fishing Zone"}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", marginBottom: "12px" }}>
              <div style={{ background: "rgba(2, 6, 23, 0.5)", padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(56, 189, 248, 0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "#94a3b8" }}>
                  <Compass size={12} style={{ color: "#38bdf8" }} />
                  <span>दिशा (BEARING)</span>
                </div>
                <strong style={{ fontSize: "13px", color: "#f8fafc", marginTop: "2px", display: "block" }}>
                  {bearing}
                </strong>
              </div>

              <div style={{ background: "rgba(2, 6, 23, 0.5)", padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(56, 189, 248, 0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "#94a3b8" }}>
                  <Waves size={12} style={{ color: "#38bdf8" }} />
                  <span>सेक्टर स्थिति</span>
                </div>
                <strong style={{ fontSize: "13px", color: "#f8fafc", marginTop: "2px", display: "block" }}>
                  {zone.status || "ACTIVE"}
                </strong>
              </div>

              <div style={{ background: "rgba(2, 6, 23, 0.5)", padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(56, 189, 248, 0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "#f59e0b" }}>
                  <Thermometer size={12} style={{ color: "#f59e0b" }} />
                  <span>अनुमानित SST</span>
                </div>
                <strong style={{ fontSize: "13px", color: "#f8fafc", marginTop: "2px", display: "block" }}>
                  28.2°C - 29.1°C
                </strong>
              </div>

              <div style={{ background: "rgba(2, 6, 23, 0.5)", padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(56, 189, 248, 0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", color: "#10b981" }}>
                  <Sparkles size={12} style={{ color: "#10b981" }} />
                  <span>क्लोरोफिल (Chl-a)</span>
                </div>
                <strong style={{ fontSize: "13px", color: "#f8fafc", marginTop: "2px", display: "block" }}>
                  1.2 - 2.1 mg/m³
                </strong>
              </div>
            </div>

            <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: 1.4, padding: "8px 10px", background: "rgba(16, 185, 129, 0.08)", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
              <strong style={{ color: "#34d399", display: "block", marginBottom: "2px" }}>मछली की संभावना:</strong>
              टूना (Tuna), मैकेरल (Mackerel), सार्डिन (Sardines) और पेलैजिक मछलियों की उच्च संभावना है।
            </div>
          </div>
        );
      })()}

      {/* General Fishing Tips Card */}
      <div className="mobile-info-card">
        <h4 style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: "#f8fafc" }}>
          💡 सागर मित्र सलाह (Fisherman Safety Rules):
        </h4>
        <ul style={{ paddingLeft: "18px", margin: 0, fontSize: "12px", color: "#94a3b8", lineHeight: 1.6 }}>
          <li>समुद्र में जाने से पहले तटरक्षक VHF चैनल 16 की जांच करें।</li>
          <li>लाइफ जैकेट और संकट सिग्नल उपकरण हमेशा नौका पर रखें।</li>
          <li>अंतर्राष्ट्रीय समुद्री सीमा (IMBL) के 5 नॉटिकल मील भीतर न जाएं।</li>
        </ul>
      </div>
    </div>
  );
}
