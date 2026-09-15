"use client";

import { useEffect, useState, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, Globe } from "lucide-react";

type VoiceMicProps = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  selectedLang?: string;
  onLanguageChange?: (lang: string) => void;
  compact?: boolean;
};

export interface VoiceLangItem {
  code: string;
  langCode: string;
  label: string;
  short: string;
}

export const VOICE_LANGS: VoiceLangItem[] = [
  { code: "hi-IN", langCode: "hi", label: "हिन्दी (Hindi)", short: "HI" },
  { code: "en-IN", langCode: "en", label: "English", short: "EN" },
  { code: "ta-IN", langCode: "ta", label: "தமிழ் (Tamil)", short: "TA" },
  { code: "te-IN", langCode: "te", label: "తెలుగు (Telugu)", short: "TE" },
  { code: "ml-IN", langCode: "ml", label: "മലയാളം (Malayalam)", short: "ML" },
  { code: "gu-IN", langCode: "gu", label: "ગુજરાતી (Gujarati)", short: "GU" },
  { code: "mr-IN", langCode: "mr", label: "मराठी (Marathi)", short: "MR" },
  { code: "bn-IN", langCode: "bn", label: "বাংলা (Bengali)", short: "BN" },
  { code: "kn-IN", langCode: "kn", label: "ಕನ್ನಡ (Kannada)", short: "KN" },
  { code: "or-IN", langCode: "or", label: "ଓଡ଼ିଆ (Odia)", short: "OR" },
];

// TypeScript Web Speech API definitions
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
}

export function VoiceMic({ onTranscript, disabled = false, selectedLang = "hi", onLanguageChange, compact = false }: VoiceMicProps) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const currentLangObj =
    VOICE_LANGS.find((v) => v.langCode === selectedLang || v.code === selectedLang) ||
    VOICE_LANGS[0];

  const [lang, setLang] = useState<string>(currentLangObj.code);

  useEffect(() => {
    const matched = VOICE_LANGS.find((v) => v.langCode === selectedLang || v.code === selectedLang);
    if (matched && matched.code !== lang) {
      setLang(matched.code);
    }
  }, [selectedLang, lang]);

  useEffect(() => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const text = event.results[0]?.[0]?.transcript;
        if (text) {
          onTranscript(text);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setSupported(true);
    }
  }, [lang, onTranscript]);

  const toggleListen = () => {
    if (!recognitionRef.current || disabled) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.lang = lang;
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  return (
    <div className="voice-mic-container" style={{ display: "inline-flex", alignItems: "center", gap: compact ? "4px" : "6px", flexShrink: 0 }}>
      <button
        type="button"
        className={`voice-mic-button ${isListening ? "listening" : ""}`}
        onClick={toggleListen}
        disabled={disabled || !supported}
        title={!supported ? "Voice recognition not supported in this browser" : isListening ? "Listening... Click to stop" : "Speak your question (Voice Mic)"}
        aria-label="Voice input"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: compact ? "34px" : "36px",
          height: compact ? "34px" : "36px",
          borderRadius: "50%",
          border: isListening ? "2px solid #e17a2c" : "1px solid rgba(8, 37, 54, 0.15)",
          backgroundColor: isListening ? "#e17a2c" : "rgba(8, 37, 54, 0.05)",
          color: isListening ? "#fff" : "inherit",
          cursor: supported ? "pointer" : "not-allowed",
          transition: "all 0.2s ease",
          position: "relative",
          flexShrink: 0,
          opacity: supported ? 1 : 0.6,
        }}
      >
        {isListening ? <MicOff size={compact ? 15 : 17} /> : <Mic size={compact ? 15 : 17} />}
        {isListening && (
          <span
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              borderRadius: "50%",
              border: "2px solid #e17a2c",
              animation: "ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite",
            }}
          />
        )}
      </button>

      {compact ? (
        <div
          className="voice-lang-compact"
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f1f5f9",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "3px 7px",
            cursor: "pointer",
            height: "28px",
            minWidth: "42px",
            flexShrink: 0,
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
          title={`Language: ${currentLangObj.label}`}
        >
          <span
            style={{
              fontSize: "11.5px",
              fontWeight: 800,
              color: "#0f172a",
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              pointerEvents: "none",
              userSelect: "none",
            }}
          >
            {currentLangObj.short}
            <span style={{ fontSize: "8.5px", color: "#64748b" }}>▼</span>
          </span>
          <select
            value={currentLangObj.langCode}
            onChange={(e) => {
              const chosenLangCode = e.target.value;
              const found = VOICE_LANGS.find((v) => v.langCode === chosenLangCode || v.code === chosenLangCode);
              if (found) {
                setLang(found.code);
                onLanguageChange?.(found.langCode);
              } else {
                setLang(chosenLangCode);
                onLanguageChange?.(chosenLangCode);
              }
            }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              opacity: 0,
              cursor: "pointer",
              zIndex: 10,
              WebkitAppearance: "none",
              MozAppearance: "none",
              appearance: "none",
            }}
            aria-label="Select Assistant Language"
          >
            {VOICE_LANGS.map((v) => (
              <option key={v.langCode} value={v.langCode} style={{ background: "#0f172a", color: "#fff", fontSize: "13px" }}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", opacity: 0.85 }}>
          <Globe size={12} />
          <select
            value={currentLangObj.langCode}
            onChange={(e) => {
              const chosenLangCode = e.target.value;
              const found = VOICE_LANGS.find((v) => v.langCode === chosenLangCode || v.code === chosenLangCode);
              if (found) {
                setLang(found.code);
                onLanguageChange?.(found.langCode);
              } else {
                setLang(chosenLangCode);
                onLanguageChange?.(chosenLangCode);
              }
            }}
            style={{
              background: "transparent",
              border: "none",
              color: "inherit",
              fontSize: "11px",
              cursor: "pointer",
              outline: "none",
            }}
            aria-label="Select Assistant Language"
          >
            {VOICE_LANGS.map((v) => (
              <option key={v.langCode} value={v.langCode} style={{ background: "#0f172a", color: "#fff" }}>
                {v.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

export function VoiceSpeaker({ text, lang }: { text: string; lang?: string }) {
  const [speaking, setSpeaking] = useState(false);

  const detectTextLang = (content: string): string => {
    if (/[\u0B80-\u0BFF]/.test(content)) return "ta-IN";
    if (/[\u0C00-\u0C7F]/.test(content)) return "te-IN";
    if (/[\u0D00-\u0D7F]/.test(content)) return "ml-IN";
    if (/[\u0A80-\u0AFF]/.test(content)) return "gu-IN";
    if (/[\u0980-\u09FF]/.test(content)) return "bn-IN";
    if (/[\u0C80-\u0CFF]/.test(content)) return "kn-IN";
    if (/[\u0900-\u097F]/.test(content)) return "hi-IN";
    return "en-IN";
  };

  const toggleSpeak = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[#*_`📍🛡️🌊🐟💡⚠️❌•]/g, "").slice(0, 350);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang || detectTextLang(text);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
    }
  };

  return (
    <button
      type="button"
      className="voice-speaker-btn"
      onClick={toggleSpeak}
      title={speaking ? "Stop speaking" : "Listen to response (Voice)"}
      aria-label="Read response aloud"
      style={{
        background: "transparent",
        border: "none",
        color: speaking ? "#38bdf8" : "inherit",
        cursor: "pointer",
        padding: "4px",
        display: "inline-flex",
        alignItems: "center",
        opacity: speaking ? 1 : 0.7,
      }}
    >
      {speaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
    </button>
  );
}

