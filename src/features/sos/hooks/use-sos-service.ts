/**
 * useSOSService Hook
 * Connects SOSStore state machine, hardware trigger listeners,
 * offline auto-sync, and authority status polling.
 */

import { useState, useEffect, useCallback } from "react";
import { SOSStore, SOSStoreState } from "../sos-store";
import { VolumeKeyListener } from "../volume-key-listener";
import { OfflineSOSQueue } from "../offline-queue";
import { SOSReport, SOSEventPayload } from "../types";

export function useSOSService(currentLocation?: { latitude: number; longitude: number; label?: string }) {
  const [sosState, setSosState] = useState<SOSStoreState>(SOSStore.getState());
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const unsubscribe = SOSStore.subscribe(setSosState);
    return () => unsubscribe();
  }, []);

  // Monitor network connectivity & auto-process offline queue
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log("[SOS] Connectivity restored. Processing pending offline queue...");
      void OfflineSOSQueue.processQueue(async (report: SOSReport) => {
        try {
          const res = await fetch("/api/v1/sos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(report),
          });
          return res.ok;
        } catch {
          return false;
        }
      });
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Hardware key listener (Triple Volume-Down)
  useEffect(() => {
    const cleanup = VolumeKeyListener.init(() => {
      console.log("[SOS] Triple Volume-Down hardware trigger received!");
      SOSStore.armSOS();
    });

    return () => cleanup();
  }, []);

  // Poll for authority acknowledgement if report was sent
  useEffect(() => {
    if (!sosState.activeReport?.sos_id || sosState.workflowState === "RESOLVED") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/sos/${sosState.activeReport!.sos_id}`);
        if (res.ok) {
          const data: SOSReport = await res.json();
          if (data && data.status !== sosState.activeReport!.status) {
            SOSStore.setReportStatus(data.status, "Status updated by authority.");
          }
        }
      } catch (e) {
        // Polling failure silent
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [sosState.activeReport, sosState.workflowState]);

  const armSOS = useCallback(() => {
    VolumeKeyListener.playConfirmationHaptics();
    SOSStore.armSOS();
  }, []);

  const cancelSOS = useCallback(() => {
    SOSStore.cancelSOS();
  }, []);

  const submitManualSOS = useCallback(
    async (payload: SOSEventPayload) => {
      const report = await SOSStore.buildReport(payload, currentLocation);
      return await SOSStore.submitReport(report);
    },
    [currentLocation]
  );

  const resetSOS = useCallback(() => {
    SOSStore.reset();
  }, []);

  return {
    state: sosState.workflowState,
    activeReport: sosState.activeReport,
    countdownSeconds: sosState.countdownSeconds,
    transcript: sosState.transcript,
    isOnline,
    armSOS,
    cancelSOS,
    submitManualSOS,
    resetSOS,
    updateTranscript: SOSStore.updateTranscript.bind(SOSStore),
  };
}
