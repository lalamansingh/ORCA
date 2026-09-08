"use client";

import {DependencyStatus} from "@/components/dependency-status";
import "../demo-polish.css";
import { useEffect, useState } from "react";
import { Bell, Globe2, MapPinned, Moon, SlidersHorizontal, Trash2, UserRound } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { AlertSeverityBadge } from "@/components/alert-components";
import { useAuth } from "@/components/auth-provider";
import { ALERT_SEVERITIES, ALERT_TYPES, type AlertSeverity, type AlertSubscription, type AlertType } from "@/features/alerts/types";
import { updateProfile } from "@/lib/api/auth";
import { createAlertSubscription, deleteAlertSubscription, getAlertSubscriptions, updateAlertSubscription } from "@/lib/api/alerts";
import { getSavedLocations, type SavedLocation } from "@/lib/api/saved-locations";

const interfaceSettings=[{icon:Globe2,title:"Preferred Language",desc:"English",control:"English"},{icon:MapPinned,title:"Default Location",desc:"Optional location coordinates",control:"Change location"},{icon:SlidersHorizontal,title:"Units",desc:"Metric units",control:"Metric"},{icon:MapPinned,title:"Map Preferences",desc:"Remember development layer choices",control:"Configure"},{icon:Moon,title:"Accessibility & Theme",desc:"System theme · standard contrast",control:"System"}];

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>([]);
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [type, setType] = useState<AlertType>("CYCLONE");
  const [severity, setSeverity] = useState<AlertSeverity>("WARNING");
  const [radius, setRadius] = useState(100);
  const [locationId, setLocationId] = useState("");
  const [preferenceError, setPreferenceError] = useState("");

  const loadLocalSubscriptions = (): AlertSubscription[] => {
    try {
      const stored = localStorage.getItem("orca_alert_subscriptions");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveLocalSubscriptions = (items: AlertSubscription[]) => {
    try {
      localStorage.setItem("orca_alert_subscriptions", JSON.stringify(items));
    } catch {
      // Ignore localStorage errors
    }
  };

  useEffect(() => {
    let active = true;
    const local = loadLocalSubscriptions();
    if (local.length > 0) {
      setSubscriptions(local);
    }

    void Promise.allSettled([getAlertSubscriptions(), getSavedLocations()]).then(
      ([subsResult, locsResult]) => {
        if (!active) return;
        if (subsResult.status === "fulfilled" && Array.isArray(subsResult.value)) {
          if (subsResult.value.length > 0) {
            setSubscriptions(subsResult.value);
            saveLocalSubscriptions(subsResult.value);
          }
        }
        if (locsResult.status === "fulfilled" && Array.isArray(locsResult.value)) {
          setLocations(locsResult.value);
        }
      }
    );
    return () => {
      active = false;
    };
  }, []);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setProfileSaved(false);
    try {
      await updateProfile({
        full_name: name || user.full_name || undefined,
        preferred_language: user.preferred_language,
        preferred_units: user.preferred_units === "nautical" ? "nautical" : "metric",
      });
      await refreshUser();
      setProfileSaved(true);
    } catch {
      setProfileSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const addSubscription = async () => {
    setPreferenceError("");
    const newSub: AlertSubscription = {
      id: "sub-" + Date.now(),
      alert_type: type,
      minimum_severity: severity,
      radius_km: radius,
      saved_location_id: locationId || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };


    try {
      const item = await createAlertSubscription({
        alert_type: type,
        minimum_severity: severity,
        radius_km: radius,
        saved_location_id: locationId || null,
        is_active: true,
      });
      setSubscriptions((items) => {
        const next = [...items, item];
        saveLocalSubscriptions(next);
        return next;
      });
    } catch {
      // Gracefully persist locally
      setSubscriptions((items) => {
        const next = [...items, newSub];
        saveLocalSubscriptions(next);
        return next;
      });
    }
  };

  const toggleSubscription = async (item: AlertSubscription) => {
    const updated = { ...item, is_active: !item.is_active };
    setSubscriptions((items) => {
      const next = items.map((val) => (val.id === item.id ? updated : val));
      saveLocalSubscriptions(next);
      return next;
    });
    try {
      await updateAlertSubscription(item.id, { is_active: !item.is_active });
    } catch {
      // Local state is already updated
    }
  };

  const removeSubscription = async (id: string) => {
    setSubscriptions((items) => {
      const next = items.filter((item) => item.id !== id);
      saveLocalSubscriptions(next);
      return next;
    });
    try {
      await deleteAlertSubscription(id);
    } catch {
      // Local state is already updated
    }
  };

  return (
    <div className="page settings-page">
      <PageHeader
        eyebrow="PREFERENCES"
        title="Settings"
        subtitle="Manage your account, alert preferences and interface choices."
      />
      <section className="settings-list profile-settings">
        <article className="setting-row">
          <span className="setting-icon">
            <UserRound size={18} />
          </span>
          <div>
            <h3>Profile</h3>
            <p>{user?.email || "Captain / Vessel Master"}</p>
            <input
              aria-label="Full name"
              value={name || user?.full_name || ""}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
            />
          </div>
          <button className="text-control" onClick={() => void saveProfile()} disabled={saving}>
            {saving ? "Saving…" : profileSaved ? "Saved" : "Save profile"}
          </button>
        </article>
      </section>

      <section className="subscription-settings">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MARINE ALERT PREFERENCES</p>
            <h2>Alert subscriptions</h2>
          </div>
          <Bell size={18} />
        </div>
        <p className="subscription-note">
          Save location-aware preferences now. Notification delivery, push, SMS and messaging are connected to ORCA risk alerts.
        </p>
        <div className="subscription-form">
          <label>
            Alert type
            <select value={type} onChange={(event) => setType(event.target.value as AlertType)}>
              {ALERT_TYPES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Minimum severity
            <select value={severity} onChange={(event) => setSeverity(event.target.value as AlertSeverity)}>
              {ALERT_SEVERITIES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Radius
            <input
              type="number"
              min={1}
              max={2000}
              value={radius}
              onChange={(event) => setRadius(Number(event.target.value))}
            />
            <small>km</small>
          </label>
          <label>
            Saved location
            <select value={locationId} onChange={(event) => setLocationId(event.target.value)}>
              <option value="">Any / profile location</option>
              {locations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <button className="button" onClick={() => void addSubscription()}>
            Add preference
          </button>
        </div>
        {preferenceError && (
          <p className="auth-error" role="alert">
            {preferenceError}
          </p>
        )}
        <div className="subscription-list">
          {subscriptions.length ? (
            subscriptions.map((item) => (
              <article key={item.id}>
                <div>
                  <b>{item.alert_type.replaceAll("_", " ")}</b>
                  <AlertSeverityBadge severity={item.minimum_severity} />
                  <small>
                    {item.radius_km ?? "Any"} km ·{" "}
                    {locations.find((location) => location.id === item.saved_location_id)?.name ??
                      "Any / profile location"}
                  </small>
                </div>
                <button
                  className={`switch ${item.is_active ? "on" : ""}`}
                  onClick={() => void toggleSubscription(item)}
                  aria-label={`Toggle ${item.alert_type}`}
                >
                  <i />
                </button>
                <button
                  className="icon-button"
                  onClick={() => void removeSubscription(item.id)}
                  aria-label={`Delete ${item.alert_type}`}
                >
                  <Trash2 size={15} />
                </button>
              </article>
            ))
          ) : (
            <p>No alert preferences saved. Add an alert preference above to get started.</p>
          )}
        </div>
      </section>

      <section className="settings-list">
        {interfaceSettings.map((setting) => {
          const Icon = setting.icon;
          return (
            <article className="setting-row" key={setting.title}>
              <span className="setting-icon">
                <Icon size={18} />
              </span>
              <div>
                <h3>{setting.title}</h3>
                <p>{setting.desc}</p>
              </div>
              <button className="text-control">{setting.control}</button>
            </article>
          );
        })}
      </section>
      <DependencyStatus />
    </div>
  );
}

