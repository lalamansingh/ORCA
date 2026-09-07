import type { MarineRiskAssessment, MarineRiskLevel, RiskFactor, RiskLoadState, RiskTimePreset } from "@/features/risk/types";

export const riskLevelLabel=(level:MarineRiskLevel)=>level==="LOW"?"Low":level==="MODERATE"?"Moderate":level==="HIGH"?"High":level==="EXTREME"?"Extreme":"Unavailable";
export const riskUiState=(loading:boolean,error:string|null,assessment:MarineRiskAssessment|null):RiskLoadState=>loading?"loading":error?"error":!assessment?"idle":assessment.level==="UNAVAILABLE"?"unavailable":"ready";
export const topRiskFactors=(assessment:MarineRiskAssessment|null,limit=3)=>assessment?.critical_factors.filter(factor=>factor.score_contribution>0).slice(0,limit)??[];
export const riskFactorValue=(factor:RiskFactor)=>factor.observed_value==null?"Provider advisory":`${factor.observed_value}${factor.unit?` ${factor.unit}`:""}`;
export const buildRiskEvaluationPayload=(latitude:number,longitude:number,assessmentTime:string|null,refresh=false)=>({latitude,longitude,assessment_time:assessmentTime,refresh,persist:false} as const);

export function resolveRiskPreset(preset:RiskTimePreset,now=new Date()):string|null{
  if(preset==="now")return null;
  const hours=preset==="3h"?3:preset==="6h"?6:12;
  return new Date(now.getTime()+hours*60*60*1000).toISOString();
}

export function localDateTimeValue(value:string|null):string{
  if(!value)return"";
  const date=new Date(value);
  if(Number.isNaN(date.getTime()))return"";
  const local=new Date(date.getTime()-date.getTimezoneOffset()*60_000);
  return local.toISOString().slice(0,16);
}

export const assessmentTimeLabel=(assessment:MarineRiskAssessment)=>new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(assessment.assessment_time));
export const calculatedTimeLabel=(assessment:MarineRiskAssessment)=>new Intl.DateTimeFormat("en-IN",{timeStyle:"short",timeZone:"Asia/Kolkata"}).format(new Date(assessment.calculated_at));
