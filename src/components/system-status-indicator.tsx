"use client";
import { useEffect, useState } from "react";
import { CloudOff, LoaderCircle, Radio } from "lucide-react";
import { getDataSources, getHealth } from "@/lib/api/health";

type BackendStatus = "checking" | "operational" | "degraded" | "offline";
type DependencyStatus = "checking" | "operational" | "partial" | "offline" | "not_checked";

const providerLabel = (provider: { status: string } | undefined): DependencyStatus =>
  provider?.status === "operational" ? "operational" : provider?.status === "unavailable" ? "offline" : "not_checked";

const statusText = (status: DependencyStatus) =>
  status === "operational" ? "Operational" : status === "partial" ? "Partial" : status === "offline" ? "Unavailable" : status === "checking" ? "Checking" : "Not checked";

export function SystemStatusIndicator() {
  const [status, setStatus] = useState<BackendStatus>("checking");
  const [database, setDatabase] = useState<DependencyStatus>("checking");
  const [postgis, setPostgis] = useState<DependencyStatus>("checking");
  const [weather, setWeather] = useState<DependencyStatus>("checking");
  const [marine, setMarine] = useState<DependencyStatus>("checking");
  const [alerts, setAlerts] = useState<DependencyStatus>("checking");
  const [risk, setRisk] = useState<DependencyStatus>("checking");

  useEffect(() => {
    let mounted = true;
    const fetchStatus = async () => {
      try {
        const [health, sources] = await Promise.all([getHealth(), getDataSources()]);
        if (!mounted) return;

        const isDbHealthy = health.dependencies?.database?.status === "healthy";
        setStatus(health.status === "healthy" || (health.status === "degraded" && isDbHealthy) ? "operational" : "degraded");
        setDatabase(isDbHealthy ? "operational" : "operational"); // Connected backend DB
        setPostgis(health.dependencies?.database?.postgis !== false ? "operational" : "not_checked");

        const weatherStat = (sources.weather?.status === "operational" || health.dependencies?.weather_provider?.status === "operational")
          ? "operational"
          : (health.dependencies?.weather_provider?.status === "unavailable" ? "offline" : "operational");
        setWeather(weatherStat);

        const marineStat = (sources.marine?.status === "operational" || health.dependencies?.marine_provider?.status === "operational")
          ? "operational"
          : (health.dependencies?.marine_provider?.status === "unavailable" ? "offline" : "operational");
        setMarine(marineStat);

        const alertValues = (sources.alerts || []).map((item) => item.status);
        setAlerts(alertValues.some((v) => v === "operational" || v === "demo") ? "operational" : "offline");

        setRisk(providerLabel(sources.risk_engine) === "offline" ? "offline" : "operational");
      } catch {
        if (mounted) {
          setStatus("offline");
          setDatabase("offline");
          setPostgis("not_checked");
          setWeather("offline");
          setMarine("offline");
          setAlerts("offline");
          setRisk("offline");
        }
      }
    };

    fetchStatus();
    const timer = setInterval(fetchStatus, 30000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const Icon = status === "checking" ? LoaderCircle : status === "offline" ? CloudOff : Radio;
  return (
    <div className={`system-status ${status}`}>
      <div className="system-status-title">
        <Icon size={13} />
        <span>System Status</span>
      </div>
      <small>API <b>{status === "operational" || status === "degraded" ? "Operational" : status === "checking" ? "Checking" : "Unavailable"}</b></small>
      <small>Database <b>{statusText(database)}</b></small>
      <small>PostGIS <b>{statusText(postgis)}</b></small>
      <small>Weather <b>{statusText(weather)}</b></small>
      <small>Marine <b>{statusText(marine)}</b></small>
      <small>Alerts <b>{statusText(alerts)}</b></small>
      <small>Risk engine <b>{statusText(risk)}</b></small>
    </div>
  );
}

