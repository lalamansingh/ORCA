/**
 * ORCA Outbound Hazard Alert Module - Data Types
 * ISRO PS 26176 / SIH 2026
 */

export type HazardType = 
  | "CYCLONE" 
  | "HIGH_WAVES" 
  | "LIGHTNING" 
  | "EXTREME_WIND" 
  | "GEOFENCE_BREACH"
  | "TSUNAMI_SURGE";

export type HazardSeverity = "advisory" | "warning" | "severe" | "critical";

export interface GeoPolygon {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
}

export interface HazardZone {
  zone_id: string;
  hazard_type: HazardType;
  severity: HazardSeverity;
  center_lat: number;
  center_lon: number;
  radius_km?: number;
  boundary?: GeoPolygon;
  safety_buffer_km: number;
}

export interface Hazard {
  hazard_id: string;
  type: HazardType;
  title: string;
  severity: HazardSeverity;
  headline: string;
  description: string;
  recommended_action: string;
  affected_zone: HazardZone;
  issued_at: string;
  expires_at: string;
  source_provider: string; // "INCOIS" | "IMD" | "ISRO_BHUVAN" | "ORCA_RISK_AGENT"
  is_active: boolean;
  metrics?: {
    wave_height_m?: number;
    wind_speed_kmh?: number;
    gust_kmh?: number;
    distance_to_boundary_km?: number;
  };
}

export interface UserLocationRecord {
  user_id: string;
  device_id?: string;
  user_name?: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  updated_at: string;
  is_stale: boolean;
}

export interface GeofenceMatchResult {
  is_inside: boolean;
  distance_km: number;
  is_within_buffer: boolean;
  hazard_id: string;
}

export interface HazardAlertDelivery {
  alert_id: string;
  hazard_id: string;
  user_id: string;
  sent_at: string;
  delivered_at?: string;
  opened_at?: string;
  response?: "SAFE" | "NEED_HELP" | "VIEWED_ROUTE" | "DISMISSED";
  response_at?: string;
  status: "sent" | "delivered" | "acknowledged" | "failed";
}
