/**
 * ORCA SOS Distress & Hazard Alert Module - Data Types
 * ISRO PS 26176 / SIH 2026
 */

export type SOSStatus = "NEW" | "ACKNOWLEDGED" | "RESPONDING" | "RESOLVED" | "CANCELLED";

export type DeliveryPath = "direct" | "relay" | "offline_queued";

export type NetworkStatus = "online" | "offline" | "relay_available";

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

export interface SOSStatusHistoryItem {
  status: SOSStatus;
  timestamp: string;
  actor?: string;
  note?: string;
}

export interface DistressResolution {
  resolvedAt: string;
  resolvedBy: string;
  outcome: "safe" | "assisted" | "false_alarm" | "other";
  summary: string;
}

export interface SOSReport {
  sos_id: string;
  reporter_id: string;
  reporter_name?: string;
  device_id: string;
  transcript: string;
  language: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  location_source: "gps_live" | "last_known";
  captured_at: string;
  linked_hazard_id: string | null;
  delivery_path: DeliveryPath;
  network_status: NetworkStatus;
  status: SOSStatus;
  battery_percentage?: number;
  relay_hops?: number;
  forwarded_by_device_id?: string;
  timeline: SOSStatusHistoryItem[];
  resolution?: DistressResolution;
}

export interface OfflineQueueItem {
  id: string;
  sos_id: string;
  payload: SOSReport;
  created_at: string;
  retry_count: number;
  last_attempt?: string;
  delivery_status: "pending" | "sending" | "failed" | "delivered";
}

export interface RelayPacket {
  packet_id: string;
  sos_id: string;
  origin_device_id: string;
  relay_device_id: string;
  hop_count: number;
  checksum: string;
  encrypted_payload: SOSReport;
  received_at: string;
}

export interface SOSFilter {
  status?: SOSStatus | "ALL";
  delivery_path?: DeliveryPath | "ALL";
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface SOSEventPayload {
  sos_id?: string;
  transcript: string;
  language?: string;
  latitude?: number;
  longitude?: number;
  accuracy_meters?: number;
  location_source?: "gps_live" | "last_known";
  linked_hazard_id?: string | null;
  battery_percentage?: number;
  device_id?: string;
  reporter_name?: string;
}
