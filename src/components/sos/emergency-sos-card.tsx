"use client";

import { useState } from "react";
import { 
  PhoneCall, 
  ShieldAlert, 
  Radio, 
  MapPin, 
  Wifi, 
  WifiOff, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  AlertTriangle 
} from "lucide-react";
import { SOSReport, SOSWorkflowState } from "@/features/sos/types";
import { useSOSStore } from "@/features/sos/sos-store";

interface EmergencySOSCardProps {
  workflowState?: SOSWorkflowState;
  activeReport?: SOSReport | null;
  isOnline?: boolean;
  gpsAvailable?: boolean;
  locationLabel?: string;
  selectedLang?: string;
  onArmSOS?: () => void;
  onOpenOnboarding?: () => void;
  onResetSOS?: () => void;
}

export function EmergencySOSCard({
  workflowState: propWorkflowState,
  activeReport: propActiveReport,
  isOnline = true,
  gpsAvailable = true,
  locationLabel = "Live GPS Sector",
  selectedLang = "hi",
  onArmSOS,
  onOpenOnboarding,
  onResetSOS,
}: EmergencySOSCardProps) {
  const store = useSOSStore();
  const workflowState = propWorkflowState || store.state;
  const activeReport = propActiveReport || store.lastSentReport;
  const armSOS = onArmSOS || store.armSOS;
  const resetSOS = onResetSOS || store.reset;

  const [isPressing, setIsPressing] = useState(false);

  const isAck = activeReport?.status === "ACKNOWLEDGED";
  const isResponding = activeReport?.status === "RESPONDING";
  const isResolved = activeReport?.status === "RESOLVED";
  const isSent = workflowState === "SENT" || workflowState === "QUEUED_OFFLINE";

  return (
    <div className="m-sos-emergency-container">
      {/* Top Header & Permission Status */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <ShieldAlert size={18} style={{ color: "#ef4444" }} />
          <strong style={{ fontSize: "14px", color: "#f8fafc", letterSpacing: "0.2px" }}>
            {selectedLang === "en" ? "EMERGENCY SOS DISTRESS" : "आपातकालीन समुद्री संकट (SOS)"}
          </strong>
        </div>
        <button
          type="button"
          onClick={onOpenOnboarding}
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#94a3b8",
            padding: "3px 8px",
            borderRadius: "6px",
            fontSize: "10.5px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            cursor: "pointer",
          }}
        >
          <HelpCircle size={12} />
          <span>{selectedLang === "en" ? "Safety Setup" : "सुरक्षा सेटअप"}</span>
        </button>
      </div>

      {/* Main Active SOS Status Panel (When SOS is active/sent) */}
      {(isSent || isAck || isResponding || isResolved) && activeReport ? (
        <div
          style={{
            background: isResolved
              ? "rgba(16, 185, 129, 0.15)"
              : isAck || isResponding
              ? "rgba(2, 132, 199, 0.2)"
              : "rgba(220, 38, 38, 0.2)",
            border: `1.5px solid ${isResolved ? "#10b981" : isAck || isResponding ? "#38bdf8" : "#ef4444"}`,
            borderRadius: "12px",
            padding: "12px",
            marginBottom: "12px",
            color: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {isResolved ? (
                <CheckCircle2 size={18} style={{ color: "#34d399" }} />
              ) : isAck ? (
                <CheckCircle2 size={18} style={{ color: "#38bdf8" }} />
              ) : (
                <Clock size={18} style={{ color: "#fbbf24" }} />
              )}
              <strong style={{ fontSize: "13px" }}>
                {isResolved
                  ? (selectedLang === "en" ? "✓ INCIDENT RESOLVED" : "✓ संकट का समाधान हो गया")
                  : isAck
                  ? (selectedLang === "en" ? "✓ ACKNOWLEDGED BY AUTHORITIES" : "✓ तटरक्षक बल द्वारा पुष्टि प्राप्त")
                  : isResponding
                  ? (selectedLang === "en" ? "🚨 RESCUE TEAM RESPONDING" : "🚨 बचाव दल रवाना हो चुका है")
                  : (selectedLang === "en" ? "⏳ SOS SENT — WAITING FOR ACKNOWLEDGEMENT" : "⏳ SOS भेजा गया — पुष्टि की प्रतीक्षा")}
              </strong>
            </div>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 800,
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(0,0,0,0.3)",
              }}
            >
              {activeReport.delivery_path === "direct" ? "DIRECT" : "OFFLINE RELAY"}
            </span>
          </div>

          <p style={{ fontSize: "11.5px", color: "#cbd5e1", margin: "4px 0 8px 0" }}>
            {isAck
              ? (selectedLang === "en"
                  ? "Coast Guard Operations Room has acknowledged your distress signal and coordinates."
                  : "भारतीय तटरक्षक कमांड रूम ने आपके संकट संदेश और जीपीएस निर्देशांक प्राप्त कर लिए हैं।")
              : (selectedLang === "en"
                  ? "Your distress report is logged on the Marine Command Center."
                  : "आपकी संकट रिपोर्ट समुद्री सुरक्षा कमांड सेंटर पर दर्ज हो गई है।")}
          </p>

          <div
            style={{
              background: "rgba(0,0,0,0.25)",
              padding: "8px",
              borderRadius: "6px",
              fontSize: "11px",
              marginBottom: "8px",
            }}
          >
            <div style={{ color: "#94a3b8", fontSize: "10px" }}>{selectedLang === "en" ? "Distress Transcript:" : "बोला गया संदेश:"}</div>
            <div style={{ fontStyle: "italic", color: "#f8fafc", marginTop: "2px" }}>
              &ldquo;{activeReport.transcript}&rdquo;
            </div>
            <div style={{ color: "#38bdf8", fontSize: "10.5px", marginTop: "4px" }}>
              📍 {activeReport.latitude.toFixed(4)}° N, {activeReport.longitude.toFixed(4)}° E (±{activeReport.accuracy_meters}m)
            </div>
          </div>

          <button
            type="button"
            onClick={resetSOS}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#ffffff",
              padding: "6px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {selectedLang === "en" ? "Close / New Distress Call" : "बंद करें / नया संकट कॉल"}
          </button>
        </div>
      ) : (
        /* Primary In-App SOS Big Trigger Control */
        <div
          style={{
            background: "linear-gradient(135deg, rgba(220, 38, 38, 0.15), rgba(153, 27, 27, 0.25))",
            border: "1.5px solid rgba(239, 68, 68, 0.5)",
            borderRadius: "14px",
            padding: "16px",
            textAlign: "center",
            marginBottom: "12px",
          }}
        >
          <p style={{ fontSize: "11.5px", color: "#fca5a5", margin: "0 0 12px 0", lineHeight: 1.4 }}>
            {selectedLang === "en"
              ? "Press the button below or click Volume Down 3 times to trigger immediate distress call to Coast Guard & Local Ports."
              : "तट रक्षक और स्थानीय बंदरगाहों को तत्काल संकट संदेश भेजने के लिए नीचे दिए गए बटन को दबाएं या वॉल्यूम डाउन 3 बार दबाएं।"}
          </p>

          <button
            type="button"
            className={`m-big-sos-btn ${isPressing ? "pressing" : ""}`}
            onMouseDown={() => setIsPressing(true)}
            onMouseUp={() => setIsPressing(false)}
            onTouchStart={() => setIsPressing(true)}
            onTouchEnd={() => setIsPressing(false)}
            onClick={armSOS}
            style={{
              width: "100%",
              background: "linear-gradient(180deg, #dc2626 0%, #991b1b 100%)",
              border: "2px solid #ef4444",
              color: "#ffffff",
              padding: "14px",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: 900,
              letterSpacing: "1px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 6px 16px rgba(220, 38, 38, 0.4)",
              transition: "transform 0.1s ease",
            }}
          >
            <ShieldAlert size={22} />
            <span>{selectedLang === "en" ? "SEND SOS DISTRESS" : "आपातकालीन SOS भेजें"}</span>
          </button>

          <div style={{ marginTop: "8px", fontSize: "10px", color: "#94a3b8" }}>
            💡 {selectedLang === "en" ? "Hardware Trigger: Triple-press Volume Down key on device." : "हार्डवेयर ट्रिगर: फोन का वॉल्यूम डाउन बटन 3 बार दबाएं।"}
          </div>
        </div>
      )}

      {/* Live System Status Indicators (GPS & Network Relay State) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          background: "rgba(8, 37, 54, 0.8)",
          padding: "8px 12px",
          borderRadius: "10px",
          border: "1px solid rgba(56, 189, 248, 0.2)",
          fontSize: "11px",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <MapPin size={13} style={{ color: gpsAvailable ? "#34d399" : "#fbbf24" }} />
          <div>
            <span style={{ color: "#94a3b8", fontSize: "9.5px", display: "block" }}>GPS Status</span>
            <strong style={{ color: gpsAvailable ? "#34d399" : "#fbbf24" }}>
              {gpsAvailable ? "GPS Available" : "Last Known"}
            </strong>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {isOnline ? (
            <Wifi size={13} style={{ color: "#34d399" }} />
          ) : (
            <WifiOff size={13} style={{ color: "#fbbf24" }} />
          )}
          <div>
            <span style={{ color: "#94a3b8", fontSize: "9.5px", display: "block" }}>Network Relay</span>
            <strong style={{ color: isOnline ? "#34d399" : "#fbbf24" }}>
              {isOnline ? "Online (Direct)" : "Offline (Peer Relay Active)"}
            </strong>
          </div>
        </div>
      </div>

      {/* Emergency Direct Hotlines */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <a
          href="tel:1554"
          style={{
            background: "rgba(220, 38, 38, 0.15)",
            border: "1px solid rgba(220, 38, 38, 0.4)",
            color: "#ffffff",
            padding: "8px 10px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            textDecoration: "none",
          }}
        >
          <PhoneCall size={12} style={{ color: "#ef4444" }} />
          <span>Coast Guard 1554</span>
        </a>

        <a
          href="tel:1093"
          style={{
            background: "rgba(2, 132, 199, 0.15)",
            border: "1px solid rgba(2, 132, 199, 0.4)",
            color: "#ffffff",
            padding: "8px 10px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            textDecoration: "none",
          }}
        >
          <PhoneCall size={12} style={{ color: "#38bdf8" }} />
          <span>Marine Police 1093</span>
        </a>
      </div>
    </div>
  );
}
