import { apiClient } from "@/lib/api/client";
import { API_V1_PREFIX } from "@/lib/api/config";
import type { MarineRiskAssessment, RiskEvaluationPayload, RiskTimelineResponse } from "@/features/risk/types";

export const getQuickRisk = (payload: RiskEvaluationPayload) => {
  const query = new URLSearchParams({
    latitude: String(payload.latitude),
    longitude: String(payload.longitude),
    ...(payload.assessment_time ? { assessment_time: payload.assessment_time } : {}),
    ...(payload.refresh ? { refresh: "true" } : {}),
  });
  return apiClient<MarineRiskAssessment>(`${API_V1_PREFIX}/risk?${query}`, { timeoutMs: 45_000 });
};

export const evaluateRisk = async (payload: RiskEvaluationPayload): Promise<MarineRiskAssessment> => {
  if (!payload.persist) {
    return getQuickRisk(payload);
  }
  try {
    return await apiClient<MarineRiskAssessment>(`${API_V1_PREFIX}/risk/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      timeoutMs: 45_000,
    });
  } catch {
    return getQuickRisk(payload);
  }
};

export const getRiskTimeline=(latitude:number,longitude:number,hours=24,intervalHours=3,refresh=false)=>{
  const query=new URLSearchParams({latitude:String(latitude),longitude:String(longitude),hours:String(hours),interval_hours:String(intervalHours),...(refresh?{refresh:"true"}:{})});
  return apiClient<RiskTimelineResponse>(`${API_V1_PREFIX}/risk/timeline?${query}`,{timeoutMs:45_000});
};
