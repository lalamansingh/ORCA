"use client";

import { useEffect, useState, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, Globe } from "lucide-react";

type VoiceMicProps = {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  selectedLang?: string;
  onLanguageChange?: (lang: string) => void;
};

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

export function VoiceMic({ onTranscript, disabled = false, selectedLang = "hi-IN", onLanguageChange }: VoiceMicProps) {
  const [isListening, setIsListening] = useState(false);
  const [lang, setLang] = useState<string>(selectedLang);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    if (selectedLang && selectedLang !== lang) {
      setLang(selectedLang);
    }
  }, [selectedLang]);

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
      const timer = window.setTimeout(() => setSupported(true), 0);
      return () => window.clearTimeout(timer);
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

  if (!supported) return null;

  return (
    <div className="voice-mic-container" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      <button
        type="button"
        className={`voice-mic-button ${isListening ? "listening" : ""}`}
        onClick={toggleListen}
        disabled={disabled}
        title={isListening ? "Listening... Click to stop" : "Speak your question (Voice Mic)"}
        aria-label="Voice input"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          border: isListening ? "2px solid #e17a2c" : "1px solid rgba(255,255,255,0.18)",
          backgroundColor: isListening ? "#e17a2c" : "rgba(255,255,255,0.06)",
          color: isListening ? "#fff" : "inherit",
          cursor: "pointer",
          transition: "all 0.2s ease",
          position: "relative",
        }}
      >
        {isListening ? <MicOff size={17} /> : <Mic size={17} />}
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

      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11px", opacity: 0.85 }}>
        <Globe size={12} />
        <select
          value={lang}
          onChange={(e) => {
            setLang(e.target.value);
            onLanguageChange?.(e.target.value);
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "inherit",
            fontSize: "11px",
            cursor: "pointer",
            outline: "none",
          }}
          aria-label="Voice language"
        >
          <option value="hi-IN" style={{ background: "#0f172a", color: "#fff" }}>हिंदी (Hindi)</option>
          <option value="en-IN" style={{ background: "#0f172a", color: "#fff" }}>English (India)</option>
          <option value="ta-IN" style={{ background: "#0f172a", color: "#fff" }}>தமிழ் (Tamil)</option>
          <option value="te-IN" style={{ background: "#0f172a", color: "#fff" }}>తెలుగు (Telugu)</option>
          <option value="ml-IN" style={{ background: "#0f172a", color: "#fff" }}>മലയാളം (Malayalam)</option>
          <option value="gu-IN" style={{ background: "#0f172a", color: "#fff" }}>ગુજરાતી (Gujarati)</option>
          <option value="mr-IN" style={{ background: "#0f172a", color: "#fff" }}>मराठी (Marathi)</option>
          <option value="bn-IN" style={{ background: "#0f172a", color: "#fff" }}>বাংলা (Bengali)</option>
          <option value="kn-IN" style={{ background: "#0f172a", color: "#fff" }}>ಕನ್ನಡ (Kannada)</option>
        </select>
      </div>
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

