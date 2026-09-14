"use client";

import { useEffect, useState } from "react";

export function SplashScreen({
  show,
  onFinish,
  duration = 2000,
}: {
  show: boolean;
  onFinish?: () => void;
  duration?: number;
}) {
  const [visible, setVisible] = useState(show);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setFading(false);
      const timer = setTimeout(() => {
        setFading(true);
        const hideTimer = setTimeout(() => {
          setVisible(false);
          onFinish?.();
        }, 400); // 400ms fade transition
        return () => clearTimeout(hideTimer);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [show, duration, onFinish]);

  if (!visible) return null;

  return (
    <div
      className={`orca-splash-overlay ${fading ? "fade-out" : "fade-in"}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? "none" : "auto",
      }}
      aria-label="ORCA Launch Splash Screen"
    >
      <div
        className="orca-splash-content"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          animation: "splashLogoPop 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "140px",
            height: "140px",
            display: "grid",
            placeItems: "center",
            marginBottom: "16px",
            position: "relative",
          }}
        >
          <img
            src="/icon-512.png"
            alt="ORCA Logo"
            width={130}
            height={130}
            style={{
              objectFit: "contain",
              filter: "drop-shadow(0 12px 28px rgba(8, 37, 54, 0.14))",
            }}
          />
        </div>

        <h1
          style={{
            margin: "0 0 4px 0",
            fontSize: "26px",
            fontWeight: 900,
            letterSpacing: "3px",
            color: "#082536",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          ORCA
        </h1>

        <p
          style={{
            margin: 0,
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.8px",
            color: "#0e7490",
            textTransform: "uppercase",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          Marine Intelligence & Fisher Companion
        </p>

        {/* Subtle loading pulse bar */}
        <div
          style={{
            marginTop: "28px",
            width: "56px",
            height: "3.5px",
            backgroundColor: "rgba(14, 116, 144, 0.15)",
            borderRadius: "99px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: "60%",
              backgroundColor: "#0e7490",
              borderRadius: "99px",
              animation: "splashBarSlide 1.2s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}
