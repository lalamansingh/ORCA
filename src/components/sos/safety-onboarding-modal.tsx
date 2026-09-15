"use client";

import { useState } from "react";
import { ShieldCheck, MapPin, Mic, Radio, Bell, X, Sparkles } from "lucide-react";

interface SafetyOnboardingModalProps {
  isOpen?: boolean;
  selectedLang?: string;
  onClose: () => void;
  onRunTestSOS?: () => void;
}

export function SafetyOnboardingModal({
  isOpen = true,
  selectedLang = "hi",
  onClose,
  onRunTestSOS,
}: SafetyOnboardingModalProps) {
  const [hardwareTriggerEnabled, setHardwareTriggerEnabled] = useState(true);

  if (!isOpen) return null;

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
          maxWidth: "420px",
          background: "linear-gradient(180deg, #091b26 0%, #030d14 100%)",
          border: "1.5px solid rgba(56, 189, 248, 0.4)",
          borderRadius: "20px",
          padding: "20px",
          color: "#ffffff",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ShieldCheck size={20} style={{ color: "#38bdf8" }} />
            <h3 style={{ fontSize: "16px", margin: 0, color: "#f8fafc" }}>
              {selectedLang === "en" ? "Set Up Emergency Safety" : "आपातकालीन सुरक्षा सेटअप"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
            }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: "11.5px", color: "#94a3b8", margin: "0 0 16px 0", lineHeight: 1.4 }}>
          {selectedLang === "en"
            ? "Configure hardware emergency keys, offline relay permissions, and speech distress capture."
            : "हार्डवेयर इमरजेंसी बटन, ऑफलाइन रिले अनुमतियां और आवाज संकट पहचान सेट करें।"}
        </p>

        {/* Feature List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "18px" }}>
          <div style={{ display: "flex", gap: "10px", background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "10px" }}>
            <div style={{ color: "#ef4444" }}><Radio size={20} /></div>
            <div>
              <strong style={{ fontSize: "12px", display: "block", color: "#f8fafc" }}>
                {selectedLang === "en" ? "3x Volume-Down Hardware Trigger" : "3 बार वॉल्यूम डाउन बटन"}
              </strong>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                {selectedLang === "en"
                  ? "Press Volume Down 3 times within 2 seconds to trigger SOS even with wet hands or low vision."
                  : "गीले हाथों या कम रोशनी में भी 2 सेकंड में 3 बार वॉल्यूम डाउन दबाकर SOS भेजें।"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "10px" }}>
            <div style={{ color: "#38bdf8" }}><Mic size={20} /></div>
            <div>
              <strong style={{ fontSize: "12px", display: "block", color: "#f8fafc" }}>
                {selectedLang === "en" ? "Voice Distress Capture (VAD)" : "आवाज से संकट पहचान"}
              </strong>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                {selectedLang === "en"
                  ? "Automatically transcribe emergency description in Hindi, Telugu, Tamil, Bengali & English."
                  : "हिंदी, तेलुगु, तमिल, बंगाली और अंग्रेजी में संकट संदेश का स्वचालित पाठ।" }
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", background: "rgba(255,255,255,0.04)", padding: "10px", borderRadius: "10px" }}>
            <div style={{ color: "#34d399" }}><MapPin size={20} /></div>
            <div>
              <strong style={{ fontSize: "12px", display: "block", color: "#f8fafc" }}>
                {selectedLang === "en" ? "Offline Peer Relay Storage" : "ऑफलाइन पीयर रिले सुरक्षा"}
              </strong>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                {selectedLang === "en"
                  ? "When cellular/satellite fails, SOS queues in IndexedDB and hops via nearby vessels."
                  : "नेटवर्क न होने पर SOS सुरक्षित सेव रहता है और पास की नावों के माध्यम से रिले होता है।"}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {onRunTestSOS && (
            <button
              type="button"
              onClick={onRunTestSOS}
              style={{
                width: "100%",
                padding: "10px",
                background: "rgba(239, 68, 68, 0.2)",
                border: "1px solid #ef4444",
                borderRadius: "10px",
                color: "#fee2e2",
                fontWeight: 700,
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <Sparkles size={14} />
              <span>{selectedLang === "en" ? "Run Test SOS Simulation" : "परीक्षण SOS सिमुलेशन चलाएं"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%",
              padding: "10px",
              background: "#38bdf8",
              border: "none",
              borderRadius: "10px",
              color: "#082536",
              fontWeight: 800,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {selectedLang === "en" ? "Save & Close Safety Settings" : "सुरक्षा सेटिंग्स सहेजें"}
          </button>
        </div>
      </div>
    </div>
  );
}
