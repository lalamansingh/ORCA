/**
 * Server-Side In-Memory & Shared Store for SOS Incidents & Hazards
 */

import { SOSReport, SOSStatus } from "./types";
import { Hazard } from "../hazards/types";
import { HazardAlertBroadcaster } from "../hazards/alert-broadcaster";

// Global singleton to persist incidents across Next.js API requests in dev/runtime
declare global {
  // eslint-disable-next-line no-var
  var __ORCA_SOS_REPORTS__: Map<string, SOSReport> | undefined;
}

if (!global.__ORCA_SOS_REPORTS__) {
  global.__ORCA_SOS_REPORTS__ = new Map<string, SOSReport>();

  // Add initial realistic demo incident for authority command center
  const sampleIncident: SOSReport = {
    sos_id: "sos-demo-mumbai-01",
    reporter_id: "boat-vessel-sagar-99",
    reporter_name: "Trawler Matsya Kanya (Reg: MH-04-1182)",
    device_id: "dev-sagar-99",
    transcript: "Hamari boat ka engine band ho gaya hai aur waves bahut tez hain. Paani aa raha hai, please help!",
    language: "hi",
    latitude: 18.914,
    longitude: 72.782,
    accuracy_meters: 12,
    location_source: "gps_live",
    captured_at: new Date(Date.now() - 1200000).toISOString(),
    linked_hazard_id: "haz-mumbai-high-waves",
    delivery_path: "direct",
    network_status: "online",
    status: "NEW",
    battery_percentage: 42,
    timeline: [
      {
        status: "NEW",
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        note: "SOS distress signal triggered from vessel (Triple Volume-Down).",
      },
    ],
  };

  global.__ORCA_SOS_REPORTS__.set(sampleIncident.sos_id, sampleIncident);
}

export class ServerSOSStore {
  public static getAllReports(): SOSReport[] {
    const list = Array.from(global.__ORCA_SOS_REPORTS__!.values());
    return list.sort((a, b) => new Date(b.captured_at).getTime() - new Date(a.captured_at).getTime());
  }

  public static getReportById(sos_id: string): SOSReport | undefined {
    return global.__ORCA_SOS_REPORTS__!.get(sos_id);
  }

  public static saveReport(report: SOSReport): SOSReport {
    global.__ORCA_SOS_REPORTS__!.set(report.sos_id, report);
    console.log(`[SERVER_SOS] Saved distress report ${report.sos_id} from ${report.reporter_name}`);
    return report;
  }

  public static updateStatus(sos_id: string, status: SOSStatus, actor?: string, note?: string): SOSReport | null {
    const report = global.__ORCA_SOS_REPORTS__!.get(sos_id);
    if (!report) return null;

    report.status = status;
    report.timeline.push({
      status,
      timestamp: new Date().toISOString(),
      actor: actor || "Marine Coast Guard Officer",
      note: note || `Incident status updated to ${status}`,
    });

    global.__ORCA_SOS_REPORTS__!.set(sos_id, report);
    console.log(`[SERVER_SOS] Status updated for ${sos_id} -> ${status}`);
    return report;
  }
}
