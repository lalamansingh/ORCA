import type { DataFreshness, EvidenceItem } from "@/features/conditions/types";

export type MarineRiskLevel="LOW"|"MODERATE"|"HIGH"|"EXTREME"|"UNAVAILABLE";
export type RiskDataQuality="EXCELLENT"|"GOOD"|"LIMITED"|"POOR"|"INSUFFICIENT";
export type RiskProvenanceMode="LIVE"|"DEMO"|"MIXED"|"UNAVAILABLE";
export type RiskFactorSeverity="LOW"|"MODERATE"|"HIGH"|"EXTREME";
export type RiskCategory="SEA_STATE"|"WIND"|"VISIBILITY_WEATHER"|"OCEAN_CURRENT"|"OFFICIAL_ALERTS";
export type RiskFactorType="WAVE_HEIGHT"|"SWELL"|"WIND"|"WIND_GUST"|"VISIBILITY"|"PRECIPITATION"|"LIGHTNING"|"CYCLONE"|"HIGH_WAVE_ALERT"|"STORM_SURGE"|"OCEAN_CURRENT"|"DATA_QUALITY"|"OTHER";

export interface RiskSourceMetadata{provider:string;dataset:string;source_url:string|null;status:string|null;retrieved_at:string|null;source_type:string|null}
export interface RiskFactor{type:RiskFactorType;category:RiskCategory;label:string;observed_value:number|string|null;unit:string|null;severity:RiskFactorSeverity;score_contribution:number;reason:string;source:string;source_url:string|null;observed_at:string|null;alert_id:string|null}
export interface MarineRiskAssessment{score:number|null;level:MarineRiskLevel;assessment_time:string;location:{latitude:number;longitude:number};recommendation:string;summary:string;factors:RiskFactor[];critical_factors:RiskFactor[];data_quality:RiskDataQuality;missing_inputs:string[];evidence:EvidenceItem[];sources:RiskSourceMetadata[];provenance_mode:RiskProvenanceMode;risk_model_version:string;calculated_at:string;limitations:string[]}
export interface RiskTimelinePoint{assessment_time:string;score:number|null;level:MarineRiskLevel;data_quality:RiskDataQuality;critical_factors:string[]}
export interface RiskTimelineResponse{location:{latitude:number;longitude:number};generated_at:string;hours:number;interval_hours:number;risk_model_version:string;points:RiskTimelinePoint[];limitations:string[]}
export interface RiskEvaluationPayload{latitude:number;longitude:number;assessment_time:string|null;refresh?:boolean;persist?:boolean}
export type RiskLoadState="idle"|"loading"|"ready"|"unavailable"|"error";
export type RiskTimePreset="now"|"3h"|"6h"|"12h";
export interface RiskFreshnessSummary{weather:DataFreshness;marine:DataFreshness;alerts:DataFreshness}
