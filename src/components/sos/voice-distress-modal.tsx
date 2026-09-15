"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff, Send, ShieldAlert, X, Edit3 } from "lucide-react";
import { VoiceDistressCapture } from "@/features/sos/voice-distress-capture";
import { useSOSStore } from "@/features/sos/sos-store";

interface VoiceDistressModalProps {
  selectedLang?: string;
  onCancel?: () => void;
  onSubmitTranscript?: (transcript: string) => void;
}

export function VoiceDistressModal({
  selectedLang = "hi",
  onCancel,
  onSubmitTranscript,
}: VoiceDistressModalProps) {
  const store = useSOSStore();
  const isCapturing = store.workflowState === "CAPTURING" || store.workflowState === "TRANSCRIBING";

  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(true);
  const [manualMode, setManualMode] = useState(false);

  useEffect(() => {
    if (!isCapturing && !onSubmitTranscript) return;
    if (manualMode) return;

    const cleanup = VoiceDistressCapture.startCapture(
      selectedLang,
      (text) => setTranscript(text),
      (result) => {
        setTranscript(result.transcript);
        setIsListening(false);
      }
    );

    return () => cleanup();
  }, [selectedLang, manualMode, isCapturing, onSubmitTranscript]);

  if (!isCapturing && !onSubmitTranscript) return null;

  const handleSubmit = () => {
    const finalMsg =
      transcript.trim() ||
      (selectedLang === "en"
        ? "Immediate emergency assistance required at sea."
        : "समुद्र में तत्काल आपातकालीन सहायता की आवश्यकता है।");
    if (onSubmitTranscript) {
      onSubmitTranscript(finalMsg);
    } else {
      store.submitReport({ transcript: finalMsg });
    }
  };

  const handleCancel = onCancel || store.cancelSOS;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.88)",
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
          maxWidth: "400px",
          background: "linear-gradient(180deg, #180a0a 0%, #080202 100%)",
          border: "2px solid #ef4444",
          borderRadius: "20px",
          padding: "24px 20px",
          textAlign: "center",
          boxShadow: "0 0 50px rgba(239, 68, 68, 0.5)",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: isListening ? "rgba(220, 38, 38, 0.3)" : "rgba(56, 189, 248, 0.2)",
            border: `2px solid ${isListening ? "#ef4444" : "#38bdf8"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 12px auto",
            color: isListening ? "#ef4444" : "#38bdf8",
            animation: isListening ? "pulse 1.5s infinite" : "none",
          }}
        >
          {isListening ? <Mic size={32} /> : <MicOff size={32} />}
        </div>

        <h3 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 4px 0", color: "#fee2e2" }}>
          {selectedLang === "en" ? "SPEAK YOUR DISTRESS MESSAGE" : "अपनी आपातकालीन स्थिति बोलें"}
        </h3>

        <p style={{ fontSize: "11.5px", color: "#94a3b8", margin: "0 0 14px 0", lineHeight: 1.4 }}>
          {selectedLang === "en"
            ? "Speak clearly in your language (e.g., engine failure, flooding, capsizing)."
            : "अपनी भाषा में स्पष्ट बोलें (उदा. इंजन खराब, नाव में पानी भरना, तूफान)।"}
        </p>

        {/* Live Speech Recognition Transcript Box */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.5)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "12px",
            padding: "12px",
            minHeight: "80px",
            textAlign: "left",
            fontSize: "13px",
            color: transcript ? "#ffffff" : "#64748b",
            marginBottom: "16px",
            position: "relative",
          }}
        >
          {manualMode ? (
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Type distress description here..."
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "#ffffff",
                fontSize: "13px",
                outline: "none",
                resize: "none",
                height: "60px",
              }}
            />
          ) : (
            <div>{transcript || (selectedLang === "en" ? "Listening to your voice..." : "आपकी आवाज सुनी जा रही है...")}</div>
          )}

          <button
            type="button"
            onClick={() => setManualMode(!manualMode)}
            style={{
              position: "absolute",
              bottom: "8px",
              right: "8px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              color: "#94a3b8",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "10.5px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
            }}
          >
            <Edit3 size={11} />
            <span>{manualMode ? "Mic Mode" : "Edit Text"}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            onClick={handleSubmit}
            style={{
              width: "100%",
              padding: "12px",
              background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)",
              border: "1.5px solid #ef4444",
              borderRadius: "12px",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "13.5px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(220, 38, 38, 0.4)",
            }}
          >
            <Send size={15} />
            <span>{selectedLang === "en" ? "TRANSMIT SOS REPORT NOW" : "तुरंत SOS रिपोर्ट भेजें"}</span>
          </button>

          <button
            type="button"
            onClick={handleCancel}
            style={{
              width: "100%",
              padding: "10px",
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "12px",
              color: "#94a3b8",
              fontSize: "12px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              cursor: "pointer",
            }}
          >
            <X size={14} />
            <span>{selectedLang === "en" ? "Cancel Distress" : "रद्द करें"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
