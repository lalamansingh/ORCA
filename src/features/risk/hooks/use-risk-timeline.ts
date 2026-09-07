"use client";
import { useCallback, useEffect, useState } from "react";
import type { SelectedLocation } from "@/features/map/types";
import type { RiskTimelineResponse } from "@/features/risk/types";
import { getRiskTimeline } from "@/lib/api/risk";

export function useRiskTimeline(location:SelectedLocation|null,hours:number,intervalHours=3){
  const [data,setData]=useState<RiskTimelineResponse|null>(null),[error,setError]=useState<string|null>(null),[loading,setLoading]=useState(false),[token,setToken]=useState(0);
  const refresh=useCallback(()=>setToken(value=>value+1),[]);
  const latitude=location?.latitude,longitude=location?.longitude;
  useEffect(()=>{let active=true;const timer=window.setTimeout(async()=>{if(latitude==null||longitude==null){setData(null);setError(null);return;}setLoading(true);setError(null);try{const response=await getRiskTimeline(latitude,longitude,hours,intervalHours,token>0);if(active)setData(response);}catch(cause){if(active){setError(cause instanceof Error?cause.message:"Risk timeline is unavailable.");setData(null);}}finally{if(active)setLoading(false);}},0);return()=>{active=false;window.clearTimeout(timer);};},[hours,intervalHours,latitude,longitude,token]);
  return{data,error,loading,refresh};
}
