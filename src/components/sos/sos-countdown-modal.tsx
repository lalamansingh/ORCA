"use client";

import { ShieldAlert, X, Send } from "lucide-react";
import { useSOSStore } from "@/features/sos/sos-store";

interface SOSCountdownModalProps {
  countdownSeconds?: number;
  selectedLang?: string;
  onCancel?: () => void;
  onSendNow?: () => void;
}

export function SOSCountdownModal({
  countdownSeconds: propCountdown,
  selectedLang = "hi",
  onCancel,
  onSendNow,
}: SOSCountdownModalProps) {
  const store = useSOSStore();
  const isArmed = store.workflowState === "ARMED";
  const countdownSeconds = propCountdown !== undefined ? propCountdown : store.countdownSeconds;
  const handleCancel = onCancel || store.cancelSOS;
  const handleSendNow = onSendNow || store.startVoiceCapture;

  if (!isArmed && propCountdown === undefined) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(10px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          background: "linear-gradient(180deg, #1e0505 0%, #0a0101 100%)",
          border: "2px solid #ef4444",
          borderRadius: "20px",
          padding: "24px 20px",
          textAlign: "center",
          boxShadow: "0 0 40px rgba(239, 68, 68, 0.4)",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            width: "68px",
            height: "68px",
            borderRadius: "50%",
            background: "rgba(220, 38, 38, 0.2)",
            border: "2px solid #ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px auto",
            color: "#ef4444",
          }}
        >
          <ShieldAlert size={36} />
        </div>

        <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 4px 0", color: "#fee2e2" }}>
          {selectedLang === "en" ? "TRANSMITTING DISTRESS SOS" : "आपातकालीन SOS भेजा जा रहा है"}
        </h3>

        <p style={{ fontSize: "12px", color: "#fca5a5", margin: "0 0 16px 0", lineHeight: 1.4 }}>
          {selectedLang === "en"
            ? "Voice recorder will open in seconds. Tap CANCEL to abort false alarm."
            : "कुछ सेकंड में आवाज रिकॉर्डर खुलेगा। गलत अलार्म रोकने के लिए रद्द करें।"}
        </p>

        {/* Big Countdown Number Circle */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            border: "4px solid #ef4444",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px auto",
            fontSize: "36px",
            fontWeight: 900,
            color: "#ffffff",
            background: "rgba(239, 68, 68, 0.2)",
            animation: "pulse 1s infinite ease-in-out",
          }}
        >
          {countdownSeconds}
        </div>

        {/* Modal Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            onClick={handleCancel}
            style={{
              width: "100%",
              padding: "12px",
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "12px",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <X size={16} />
            <span>{selectedLang === "en" ? "Cancel SOS (False Alarm)" : "रद्द करें (गलत अलार्म)"}</span>
          </button>

          <button
            type="button"
            onClick={handleSendNow}
            style={{
              width: "100%",
              padding: "12px",
              background: "#ef4444",
              border: "none",
              borderRadius: "12px",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
            }}
          >
            <Send size={15} />
            <span>{selectedLang === "en" ? "Skip Countdown & Record Voice" : "तुरंत आवाज रिकॉर्ड करें"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
