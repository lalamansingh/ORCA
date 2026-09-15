"use client";

import { useMemo, useState } from "react";
import { Filter, RefreshCw, ShieldAlert, Radio, Bell } from "lucide-react";
import { AlertSafetyNote, MarineAlertCard, ProviderStatusBadge } from "@/components/alert-components";
import { PageHeader, StateBox } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { ALERT_SEVERITIES, ALERT_TYPES, type AlertSeverity, type AlertType } from "@/features/alerts/types";
import { filterAlerts, type AlertSection } from "@/features/alerts/presentation";
import { useAlerts } from "@/features/alerts/hooks/use-alerts";
import { useSharedSelectedLocation } from "@/features/map/location-store";
import type { SelectedLocation } from "@/features/map/types";
import { MarineSafetyCommandCenter } from "@/components/authority/marine-safety-command-center";

type Section = AlertSection;
type MainTab = "command_center" | "environmental_advisories";

export default function AlertsPage() {
  const { user } = useAuth();
  const shared = useSharedSelectedLocation();
  const profile: SelectedLocation | null =
    user?.default_latitude != null && user.default_longitude != null
      ? {
          latitude: user.default_latitude,
          longitude: user.default_longitude,
          source: "default",
          label: "Profile Default Location",
        }
      : null;
  const location = shared ?? profile;

  const [activeMainTab, setActiveMainTab] = useState<MainTab>("command_center");
  const [section, setSection] = useState<Section>("ACTIVE");
  const [type, setType] = useState<AlertType | "ALL">("ALL");
  const [severity, setSeverity] = useState<AlertSeverity | "ALL">("ALL");
  const [source, setSource] = useState("ALL");
  const [radius, setRadius] = useState(100);

  const alerts = useAlerts(location, radius, false);
  const sources = useMemo(
    () => Array.from(new Set(alerts.data?.alerts.map((alert) => alert.provider) ?? [])),
    [alerts.data]
  );
  const visible = useMemo(
    () => filterAlerts(alerts.data?.alerts ?? [], section, type, severity, source),
    [alerts.data, section, severity, source, type]
  );

  return (
    <div className="page alerts-page space-y-6">
      {/* Mode Switcher Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveMainTab("command_center")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeMainTab === "command_center"
              ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <ShieldAlert size={15} />
          <span>Authority SOS Command Center</span>
          <span className="bg-red-950 text-red-200 text-[10px] px-1.5 py-0.5 rounded border border-red-500/30">
            ISRO PS 26176
          </span>
        </button>

        <button
          onClick={() => setActiveMainTab("environmental_advisories")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeMainTab === "environmental_advisories"
              ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Bell size={15} />
          <span>Regional Environmental Advisories</span>
        </button>
      </div>

      {/* View 1: Maritime Authority Command Center */}
      {activeMainTab === "command_center" && <MarineSafetyCommandCenter />}

      {/* View 2: Traditional Environmental Advisories & INCOIS Bulletins */}
      {activeMainTab === "environmental_advisories" && (
        <>
          <PageHeader
            eyebrow="SAFETY INTELLIGENCE"
            title="Marine Safety Alerts & Ocean Forecasts"
            subtitle={
              location
                ? `Official and configured advisory sources near ${location.label ?? "the selected location"}.`
                : "Select a map or profile location to check relevant advisories."
            }
            action={
              <button className="map-control" onClick={alerts.refresh} disabled={!location || alerts.loading}>
                <RefreshCw size={15} />
                {alerts.loading ? "Checking…" : "Check now"}
              </button>
            }
          />
          <AlertSafetyNote />
          {!location ? (
            <StateBox
              kind="empty"
              title="Location required"
              detail="Choose a GPS, map, saved or profile default location before checking nearby alerts."
            />
          ) : alerts.error ? (
            <StateBox
              kind="unavailable"
              title="Unable to check alerts"
              detail="The alert API could not be reached. This does not mean there are no alerts."
            />
          ) : (
            <>
              {alerts.data?.status === "partial" && (
                <div className="alert-state-warning">
                  <Triangle />
                  Some sources or proximity services are unavailable. Available advisories are shown with their source status.
                </div>
              )}
              <div className="provider-strip">
                {alerts.data?.sources.map((item) => (
                  <span key={item.provider}>
                    <b>{item.provider}</b>
                    <ProviderStatusBadge status={item.status} />
                    <small>{item.message}</small>
                  </span>
                ))}
              </div>
              <div className="alert-filter-panel">
                <Filter size={16} />
                <label>
                  View
                  <select value={section} onChange={(event) => setSection(event.target.value as Section)}>
                    <option value="ACTIVE">Active</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="RECENT">Expired / recent</option>
                  </select>
                </label>
                <label>
                  Type
                  <select value={type} onChange={(event) => setType(event.target.value as AlertType | "ALL")}>
                    <option value="ALL">All types</option>
                    {ALERT_TYPES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Severity
                  <select value={severity} onChange={(event) => setSeverity(event.target.value as AlertSeverity | "ALL")}>
                    <option value="ALL">All severities</option>
                    {ALERT_SEVERITIES.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Radius
                  <select value={radius} onChange={(event) => setRadius(Number(event.target.value))}>
                    <option value={50}>50 km</option>
                    <option value={100}>100 km</option>
                    <option value={250}>250 km</option>
                    <option value={500}>500 km</option>
                  </select>
                </label>
                <label>
                  Source
                  <select value={source} onChange={(event) => setSource(event.target.value)}>
                    <option value="ALL">All sources</option>
                    {sources.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>
              <section className="alert-list normalized">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">{section === "RECENT" ? "HISTORY RETAINED" : "LOCATION-AWARE ADVISORIES"}</p>
                    <h2>
                      {section === "ACTIVE" ? "Active" : section === "UPCOMING" ? "Upcoming" : "Expired / Recent"} Marine Alerts
                    </h2>
                  </div>
                  <span>{visible.length} shown</span>
                </div>
                {visible.length ? (
                  visible.map((alert) => <MarineAlertCard alert={alert} key={alert.id} />)
                ) : (
                  <EmptyState section={section} unavailable={alerts.data?.status === "unavailable"} />
                )}
              </section>
              {!!alerts.data?.limitations.length && (
                <div className="alert-limitations">
                  <b>Current limitations</b>
                  {alerts.data.limitations.map((item) => (
                    <p key={item}>{item}</p>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ section, unavailable }: { section: Section; unavailable: boolean }) {
  if (unavailable)
    return (
      <StateBox
        kind="unavailable"
        title="Unable to check alerts"
        detail="All configured alert providers are unavailable. An empty list is not a safety clearance."
      />
    );
  return (
    <StateBox
      kind="empty"
      title={section === "ACTIVE" ? "No active alerts found." : `No ${section.toLowerCase()} alerts found.`}
      detail="Configured providers were checked for the selected location and filters. Continue to follow official authority channels."
    />
  );
}

function Triangle() {
  return <span aria-hidden="true">△</span>;
}
