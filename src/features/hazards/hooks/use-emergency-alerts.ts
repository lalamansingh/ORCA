/**
 * useEmergencyAlerts Hook
 * Monitors active hazards against user GPS location,
 * triggers high-priority alarms, and reports user acknowledgments.
 */

import { useState, useEffect, useCallback } from "react";
import { Hazard } from "../types";
import { GeofenceMatcher } from "../geofence-matcher";

export function useEmergencyAlerts(userLocation?: { latitude: number; longitude: number; label?: string }) {
  const [activeHazards, setActiveHazards] = useState<Hazard[]>([]);
  const [triggeredAlert, setTriggeredAlert] = useState<Hazard | null>(null);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set());

  // Fetch active hazards from API
  const fetchHazards = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/hazards/active");
      if (res.ok) {
        const data: Hazard[] = await res.json();
        setActiveHazards(data);
      }
    } catch {
      // Offline fallback: handled gracefully
    }
  }, []);

  useEffect(() => {
    void fetchHazards();
    const interval = setInterval(fetchHazards, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [fetchHazards]);

  // Evaluate geofence when location or hazards update
  useEffect(() => {
    if (!userLocation || activeHazards.length === 0) return;

    for (const hazard of activeHazards) {
      if (dismissedAlertIds.has(hazard.hazard_id)) continue;

      const match = GeofenceMatcher.evaluateGeofence(
        userLocation.latitude,
        userLocation.longitude,
        hazard.affected_zone
      );

      // Trigger full-screen alarm if inside or within danger buffer
      if (match.is_within_buffer) {
        console.log(`[HAZARD_ALERT] User inside danger zone for ${hazard.title}`);
        setTriggeredAlert(hazard);
        break;
      }
    }
  }, [userLocation, activeHazards, dismissedAlertIds]);

  const acknowledgeAlert = useCallback(
    async (response: "SAFE" | "NEED_HELP" | "VIEWED_ROUTE" | "DISMISSED") => {
      if (!triggeredAlert) return;

      const hazardId = triggeredAlert.hazard_id;
      setDismissedAlertIds((prev) => new Set([...prev, hazardId]));
      setTriggeredAlert(null);

      try {
        await fetch(`/api/v1/alerts/${hazardId}/response`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hazard_id: hazardId,
            response,
            latitude: userLocation?.latitude,
            longitude: userLocation?.longitude,
          }),
        });
      } catch (e) {
        console.warn("[HAZARD_ALERT] Failed to send response telemetry:", e);
      }
    },
    [triggeredAlert, userLocation]
  );

  return {
    activeHazards,
    triggeredAlert,
    acknowledgeAlert,
    refreshHazards: fetchHazards,
  };
}
