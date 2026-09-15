/**
 * SOS State Machine & Incident Store
 * Manages lifecycle transitions, GPS capture, battery telemetry, and local state.
 */

import { SOSReport, SOSStatus, DeliveryPath, SOSEventPayload } from "./types";
import { OfflineSOSQueue } from "./offline-queue";
import { PeerRelayService } from "./peer-relay-service";

export type SOSWorkflowState =
  | "IDLE"
  | "ARMED"
  | "CAPTURING"
  | "TRANSCRIBING"
  | "REPORT_READY"
  | "SENDING"
  | "SENT"
  | "ACKNOWLEDGED"
  | "RESPONDING"
  | "RESOLVED"
  | "QUEUED_OFFLINE"
  | "FAILED";

export interface SOSStoreState {
  workflowState: SOSWorkflowState;
  activeReport: SOSReport | null;
  countdownSeconds: number;
  transcript: string;
  errorMessage: string | null;
}

type Listener = (state: SOSStoreState) => void;

class SOSStoreManager {
  private state: SOSStoreState = {
    workflowState: "IDLE",
    activeReport: null,
    countdownSeconds: 5,
    transcript: "",
    errorMessage: null,
  };

  private listeners: Set<Listener> = new Set();
  private countdownTimer: NodeJS.Timeout | null = null;

  public getState(): SOSStoreState {
    return { ...this.state };
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const currentState = this.getState();
    this.listeners.forEach((l) => l(currentState));
  }

  /**
   * Arm the SOS workflow (5-second countdown started)
   */
  public armSOS(): void {
    if (this.state.workflowState === "ARMED" || this.state.workflowState === "CAPTURING") return;

    if (this.countdownTimer) clearInterval(this.countdownTimer);

    this.state = {
      ...this.state,
      workflowState: "ARMED",
      countdownSeconds: 5,
      errorMessage: null,
    };
    this.notify();

    console.log(`[SOS] state=ARMED countdown=5s`);

    this.countdownTimer = setInterval(() => {
      if (this.state.countdownSeconds <= 1) {
        if (this.countdownTimer) clearInterval(this.countdownTimer);
        this.startVoiceCapture();
      } else {
        this.state.countdownSeconds -= 1;
        this.notify();
      }
    }, 1000);
  }

  /**
   * Cancel armed SOS within the 5-second safety window
   */
  public cancelSOS(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    console.log(`[SOS] state=CANCELLED by user`);
    this.state = {
      workflowState: "IDLE",
      activeReport: null,
      countdownSeconds: 5,
      transcript: "",
      errorMessage: null,
    };
    this.notify();
  }

  /**
   * Move from armed directly to voice capturing
   */
  public startVoiceCapture(): void {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.state = {
      ...this.state,
      workflowState: "CAPTURING",
    };
    this.notify();
    console.log(`[SOS] state=CAPTURING`);
  }

  /**
   * Update live speech transcript
   */
  public updateTranscript(text: string): void {
    this.state.transcript = text;
    this.notify();
  }

  /**
   * Build complete distress report payload with live GPS
   */
  public async buildReport(
    payload: SOSEventPayload,
    fallbackLocation?: { latitude: number; longitude: number; label?: string }
  ): Promise<SOSReport> {
    this.state.workflowState = "TRANSCRIBING";
    this.notify();

    let lat = payload.latitude || fallbackLocation?.latitude || 18.92;
    let lon = payload.longitude || fallbackLocation?.longitude || 72.83;
    let accuracy = payload.accuracy_meters || 15;
    let locationSource: "gps_live" | "last_known" = payload.location_source || "last_known";

    // Attempt to grab live high-accuracy GPS fix if available in browser
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 4000,
            maximumAge: 10000,
          });
        });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        accuracy = Math.round(pos.coords.accuracy);
        locationSource = "gps_live";
        console.log(`[SOS] gps=true lat=${lat.toFixed(4)} lon=${lon.toFixed(4)} accuracy=${accuracy}m`);
      } catch (err) {
        console.warn("[SOS] Live GPS lock timed out, utilizing fallback location:", err);
      }
    }

    // Battery telemetry
    let batteryLevel: number | undefined = undefined;
    if (typeof navigator !== "undefined" && "getBattery" in navigator) {
      try {
        const battery: any = await (navigator as any).getBattery();
        batteryLevel = Math.round(battery.level * 100);
      } catch (e) {
        console.warn("[SOS] Battery API not accessible:", e);
      }
    }

    const deviceId = payload.device_id || PeerRelayService.getDeviceId();
    const sosId = payload.sos_id || `sos-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const nowIso = new Date().toISOString();
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    const report: SOSReport = {
      sos_id: sosId,
      reporter_id: deviceId,
      reporter_name: payload.reporter_name || "Vessel Master / Fisherman",
      device_id: deviceId,
      transcript: payload.transcript || this.state.transcript || "Immediate distress assistance requested at sea.",
      language: payload.language || "hi",
      latitude: lat,
      longitude: lon,
      accuracy_meters: accuracy,
      location_source: locationSource,
      captured_at: nowIso,
      linked_hazard_id: payload.linked_hazard_id || null,
      delivery_path: isOnline ? "direct" : "offline_queued",
      network_status: isOnline ? "online" : "offline",
      status: "NEW",
      battery_percentage: batteryLevel,
      timeline: [
        {
          status: "NEW",
          timestamp: nowIso,
          note: "SOS distress signal triggered from vessel.",
        },
      ],
    };

    this.state = {
      ...this.state,
      workflowState: "REPORT_READY",
      activeReport: report,
      transcript: report.transcript,
    };
    this.notify();

    return report;
  }

  /**
   * Finalize voice capture and immediately submit
   */
  public async finishVoiceCapture(transcript: string): Promise<SOSReport> {
    const report = await this.buildReport({ transcript });
    await this.submitReport(report);
    return report;
  }

  /**
   * Submit SOS to API or queue offline
   */
  public async submitReport(
    reportOrPayload?: SOSReport | Partial<SOSEventPayload>
  ): Promise<{ success: boolean; offlineQueued?: boolean }> {
    let report: SOSReport;
    if (!reportOrPayload || !("sos_id" in reportOrPayload)) {
      report = await this.buildReport({
        transcript: (reportOrPayload as Partial<SOSEventPayload>)?.transcript || this.state.transcript,
      });
    } else {
      report = reportOrPayload as SOSReport;
    }

    // Duplicate suppression check
    if (OfflineSOSQueue.isDuplicateSuppressed(report.latitude, report.longitude)) {
      console.warn(`[SOS] Duplicate SOS suppressed under cooldown policy.`);
      this.state.workflowState = "SENT";
      this.notify();
      return { success: true };
    }

    this.state.workflowState = "SENDING";
    this.notify();

    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

    if (!isOnline) {
      console.log(`[SOS] Device offline. Enqueuing distress report.`);
      OfflineSOSQueue.enqueue(report);
      OfflineSOSQueue.recordSubmission(report.latitude, report.longitude);
      void PeerRelayService.broadcastToNearbyPeers(report);

      this.state = {
        ...this.state,
        workflowState: "QUEUED_OFFLINE",
        activeReport: report,
      };
      this.notify();
      return { success: true, offlineQueued: true };
    }

    try {
      const res = await fetch("/api/v1/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });

      if (res.ok) {
        OfflineSOSQueue.recordSubmission(report.latitude, report.longitude);
        console.log(`[SOS] Distress report delivered to Authority Dashboard successfully.`);
        this.state = {
          ...this.state,
          workflowState: "SENT",
          activeReport: report,
        };
        this.notify();
        return { success: true };
      } else {
        throw new Error(`SOS API response non-200: ${res.status}`);
      }
    } catch (err) {
      console.warn(`[SOS] Direct transmission failed, adding to offline queue:`, err);
      OfflineSOSQueue.enqueue(report);
      this.state = {
        ...this.state,
        workflowState: "QUEUED_OFFLINE",
        activeReport: report,
      };
      this.notify();
      return { success: true, offlineQueued: true };
    }
  }

  /**
   * Update active report status upon authority acknowledgement
   */
  public setReportStatus(status: SOSStatus, note?: string): void {
    if (!this.state.activeReport) return;
    this.state.activeReport.status = status;
    this.state.activeReport.timeline.push({
      status,
      timestamp: new Date().toISOString(),
      note,
    });
    this.state.workflowState = status === "ACKNOWLEDGED" ? "ACKNOWLEDGED" : status === "RESOLVED" ? "RESOLVED" : "RESPONDING";
    this.notify();
  }

  public reset(): void {
    this.state = {
      workflowState: "IDLE",
      activeReport: null,
      countdownSeconds: 5,
      transcript: "",
      errorMessage: null,
    };
    this.notify();
  }
}

export const SOSStore = new SOSStoreManager();

import { useState, useEffect } from "react";

export function useSOSStore() {
  const [storeState, setStoreState] = useState<SOSStoreState>(SOSStore.getState());

  useEffect(() => {
    return SOSStore.subscribe((next) => {
      setStoreState(next);
    });
  }, []);

  return {
    ...storeState,
    state: storeState.workflowState,
    pendingQueueCount: OfflineSOSQueue.getQueueLength(),
    lastSentReport: storeState.activeReport,
    activeDeviceProfile: {
      id: storeState.activeReport?.reporter_id || "IND_VESSEL_8821",
      vesselName: storeState.activeReport?.reporter_name || "Matsya Sagar - AP 09 V 8821",
      registrationNumber: "IND-AP-09-V-8821",
    },
    triggerDistress: (method?: string) => {
      SOSStore.armSOS();
    },
    manualCancel: () => {
      SOSStore.cancelSOS();
    },
    armSOS: () => SOSStore.armSOS(),
    cancelSOS: () => SOSStore.cancelSOS(),
    startVoiceCapture: () => SOSStore.startVoiceCapture(),
    finishVoiceCapture: (transcript: string) => SOSStore.finishVoiceCapture(transcript),
    submitReport: (payload?: Partial<SOSEventPayload>) => SOSStore.submitReport(payload),
    setReportStatus: (status: SOSStatus, note?: string) => SOSStore.setReportStatus(status, note),
    reset: () => SOSStore.reset(),
  };
}
