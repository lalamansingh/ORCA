"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Bot, 
  Fish, 
  Waves, 
  ShieldAlert, 
  MapPin, 
  Smartphone, 
  Maximize2, 
  Minimize2, 
  ExternalLink,
  Wifi, 
  Signal, 
  Battery, 
  Globe 
} from "lucide-react";
import { LocationDetector, type MobileLocation } from "./components/location-detector";
import { MobileChat, MOBILE_LANGUAGES } from "./components/mobile-chat";
import { MobilePFZView } from "./components/mobile-pfz-view";
import { MobileWeatherView } from "./components/mobile-weather-view";
import { MobileAlertsView } from "./components/mobile-alerts-view";
import "./mobile.css";

type ActiveTab = "chat" | "pfz" | "weather" | "alerts";

export default function MobileAppPage() {
  const [location, setLocation] = useState<MobileLocation | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("chat");
  const [selectedLang, setSelectedLang] = useState("hi");
  const [frameMode, setFrameMode] = useState(true);
  const [currentTime, setCurrentTime] = useState("09:41");
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Update mock Android clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="android-wrapper">
      {/* Top Presentation Bar (For hackathon judges demonstration) */}
      <header className="presentation-bar">
        <div className="presentation-badge">
          <span />
          <strong>ORCA ANDROID APP (END-USER SOLUTION)</strong>
        </div>

        <div className="presentation-actions">
          <button
            type="button"
            className="presentation-btn"
            onClick={() => setFrameMode((prev) => !prev)}
            title={frameMode ? "Switch to Fullscreen" : "Show Phone Frame"}
          >
            {frameMode ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
            <span>{frameMode ? "Fullscreen" : "Phone Frame"}</span>
          </button>

          <Link
            href="/dashboard"
            className="presentation-btn"
            style={{ textDecoration: "none", color: "#38bdf8" }}
            title="Switch to Web Dashboard for Judges"
          >
            <ExternalLink size={13} />
            <span>Web Command Center</span>
          </Link>
        </div>
      </header>

      {/* Android Device Mockup Frame */}
      <div className={frameMode ? "android-phone-frame" : "android-phone-fullscreen"}>
        {/* Android Native Status Bar */}
        <div className="android-status-bar">
          <span>{currentTime}</span>
          <div className="status-bar-notch" />
          <div className="status-bar-icons">
            <Signal size={13} />
            <Wifi size={13} />
            <Battery size={14} />
          </div>
        </div>

        {/* Android Top App Bar */}
        <div className="android-app-bar">
          <button
            type="button"
            className="app-bar-location"
            onClick={() => setLocation(null)}
            title="Click to change port / re-detect location"
          >
            <MapPin size={16} style={{ color: "#38bdf8", flexShrink: 0 }} />
            <div style={{ textAlign: "left" }}>
              <strong>{location ? location.label : "स्थान चुनें (Select Port)"}</strong>
              <small>
                {location
                  ? `${location.latitude.toFixed(2)}°N, ${location.longitude.toFixed(2)}°E · Tap to change`
                  : "GPS Satellite & Port Search"}
              </small>
            </div>
          </button>

          <div className="app-bar-tools">
            <button
              type="button"
              className="android-lang-pill"
              onClick={() => setShowLangMenu((prev) => !prev)}
            >
              <Globe size={13} style={{ color: "#38bdf8" }} />
              <span>{MOBILE_LANGUAGES.find((l) => l.code === selectedLang)?.native || "हिन्दी"}</span>
            </button>
          </div>
        </div>

        {/* Language Selection Modal Overlay */}
        {showLangMenu && (
          <div
            style={{
              position: "absolute",
              top: "84px",
              right: "12px",
              zIndex: 100,
              background: "#0e1726",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              borderRadius: "14px",
              padding: "8px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.7)",
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "6px",
              maxWidth: "280px",
            }}
          >
            {MOBILE_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setSelectedLang(lang.code);
                  setShowLangMenu(false);
                }}
                style={{
                  background: selectedLang === lang.code ? "rgba(56, 189, 248, 0.2)" : "rgba(255, 255, 255, 0.04)",
                  border: selectedLang === lang.code ? "1px solid #38bdf8" : "1px solid transparent",
                  color: selectedLang === lang.code ? "#38bdf8" : "#e2e8f0",
                  padding: "6px 10px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {lang.native} ({lang.name})
              </button>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        <div className="android-content-area">
          {/* Step 1: Location Setup if no location selected yet */}
          {!location ? (
            <LocationDetector onLocationConfirmed={(loc) => setLocation(loc)} />
          ) : (
            /* Step 2 & 3: Chat + Web feature views */
            <>
              {activeTab === "chat" && (
                <MobileChat
                  location={location}
                  selectedLang={selectedLang}
                  onSelectLang={setSelectedLang}
                  onOpenPFZTab={() => setActiveTab("pfz")}
                  onOpenWeatherTab={() => setActiveTab("weather")}
                  onOpenAlertsTab={() => setActiveTab("alerts")}
                />
              )}

              {activeTab === "pfz" && (
                <MobilePFZView location={location} />
              )}

              {activeTab === "weather" && (
                <MobileWeatherView location={location} />
              )}

              {activeTab === "alerts" && (
                <MobileAlertsView location={location} />
              )}
            </>
          )}
        </div>

        {/* Android Bottom Navigation Bar (Visible once location is active) */}
        {location && (
          <nav className="android-bottom-nav">
            <button
              type="button"
              className={`nav-tab-item ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              <Bot size={20} />
              <span>साथी Chat</span>
            </button>

            <button
              type="button"
              className={`nav-tab-item ${activeTab === "pfz" ? "active" : ""}`}
              onClick={() => setActiveTab("pfz")}
            >
              <Fish size={20} />
              <span>मछली (PFZ)</span>
            </button>

            <button
              type="button"
              className={`nav-tab-item ${activeTab === "weather" ? "active" : ""}`}
              onClick={() => setActiveTab("weather")}
            >
              <Waves size={20} />
              <span>मौसम & लहरें</span>
            </button>

            <button
              type="button"
              className={`nav-tab-item ${activeTab === "alerts" ? "active" : ""}`}
              onClick={() => setActiveTab("alerts")}
            >
              <ShieldAlert size={20} />
              <span>अलर्ट्स (SOS)</span>
            </button>
          </nav>
        )}

        {/* Android Bottom Gesture Indicator */}
        <div className="android-gesture-bar">
          <div className="gesture-pill" />
        </div>
      </div>
    </div>
  );
}
