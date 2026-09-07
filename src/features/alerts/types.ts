import type { Geometry } from "geojson";
export type AlertGeometry=Exclude<Geometry,{type:"GeometryCollection"}>;

export type AlertType="CYCLONE"|"STORM_SURGE"|"HIGH_WAVES"|"SWELL_SURGE"|"STRONG_WIND"|"LIGHTNING"|"HEAVY_RAIN"|"LOW_VISIBILITY"|"TSUNAMI"|"MARINE_HEAT_WAVE"|"OTHER";
export type AlertSeverity="INFO"|"WATCH"|"WARNING"|"SEVERE"|"CRITICAL";
export type AlertStatus="ACTIVE"|"UPCOMING"|"EXPIRED"|"CANCELLED"|"UNKNOWN";
export type AlertSourceType="OFFICIAL_ADVISORY"|"FORECAST_RISK"|"INTERNAL_RULE"|"DEMO";
export type AlertFreshness="CURRENT"|"RECENT"|"STALE"|"EXPIRED"|"UNKNOWN";
export type AlertProviderStatus="OPERATIONAL"|"DEGRADED"|"UNAVAILABLE"|"NOT_CONFIGURED"|"NOT_CONNECTED"|"REQUIRES_ACCESS"|"DEMO";

export interface AlertEvidence {source:string;bulletin:string|null;issued_at:string|null;valid_from:string|null;valid_until:string|null;retrieved_at:string;provider_url:string|null}
export interface CycloneDetails {storm_name:string|null;classification:string|null;center_latitude:number|null;center_longitude:number|null;movement_direction:string|null;movement_speed:string|null;maximum_sustained_wind:string|null;central_pressure:string|null}
export interface MarineAlert {
  id:string;external_id:string;type:AlertType;severity:AlertSeverity;title:string;summary:string|null;description:string|null;
  affected_area:string|null;geometry:AlertGeometry|null;latitude:number|null;longitude:number|null;radius_km:number|null;
  forecast_track:Extract<AlertGeometry,{type:"LineString"}>|null;forecast_points:Array<Record<string,unknown>>;valid_from:string|null;
  valid_until:string|null;issued_at:string|null;updated_at:string|null;retrieved_at:string;source:string;source_url:string|null;
  provider:string;status:AlertStatus;source_type:AlertSourceType;instructions:string[];evidence:AlertEvidence;
  metadata:Record<string,unknown>;cyclone:CycloneDetails|null;created_at:string|null;distance_km:number|null;is_inside:boolean|null;
  nearest_point:{latitude:number;longitude:number}|null;freshness:AlertFreshness;
}
export interface AlertProviderSource {provider:string;status:AlertProviderStatus;source_url:string|null;retrieved_at:string;alert_count:number;message:string|null}
export interface AlertSummary {critical:number;severe:number;warning:number;watch:number;info:number;highest_severity:AlertSeverity|null}
export interface AlertListResponse {location:{latitude:number;longitude:number};status:"complete"|"partial"|"unavailable";result_state:"ALERTS_AVAILABLE"|"NO_ACTIVE_ALERTS"|"NO_ALERTS_FOUND"|"PROVIDER_UNAVAILABLE";alerts:MarineAlert[];summary:AlertSummary;sources:AlertProviderSource[];retrieved_at:string;limitations:string[]}
export interface AlertSubscription {id:string;saved_location_id:string|null;alert_type:AlertType;minimum_severity:AlertSeverity;radius_km:number|null;is_active:boolean;created_at:string;updated_at:string}
export type AlertSubscriptionInput=Pick<AlertSubscription,"saved_location_id"|"alert_type"|"minimum_severity"|"radius_km"|"is_active">;

export const ALERT_TYPES:AlertType[]=["CYCLONE","STORM_SURGE","HIGH_WAVES","SWELL_SURGE","STRONG_WIND","LIGHTNING","HEAVY_RAIN","LOW_VISIBILITY","TSUNAMI","MARINE_HEAT_WAVE","OTHER"];
export const ALERT_SEVERITIES:AlertSeverity[]=["INFO","WATCH","WARNING","SEVERE","CRITICAL"];
