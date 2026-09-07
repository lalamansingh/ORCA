"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SelectedLocation } from "@/features/map/types";
import type { MarineRiskAssessment } from "@/features/risk/types";
import { evaluateRisk } from "@/lib/api/risk";
import { buildRiskEvaluationPayload } from "@/features/risk/presentation";

export function useRiskAssessment(location:SelectedLocation|null,assessmentTime:string|null,{auto=true}:{auto?:boolean}={}){
  const [data,setData]=useState<MarineRiskAssessment|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  const requestId=useRef(0);
  const latitude=location?.latitude,longitude=location?.longitude;
  const evaluate=useCallback(async(refresh=false)=>{
    if(latitude==null||longitude==null){setData(null);setError(null);return;}
    const id=++requestId.current;setLoading(true);setError(null);
    try{const response=await evaluateRisk(buildRiskEvaluationPayload(latitude,longitude,assessmentTime,refresh));if(id===requestId.current)setData(response);}
    catch(cause){if(id===requestId.current){setError(cause instanceof Error?cause.message:"Risk assessment is unavailable.");setData(null);}}
    finally{if(id===requestId.current)setLoading(false);}
  },[assessmentTime,latitude,longitude]);
  useEffect(()=>{const timer=window.setTimeout(()=>{requestId.current+=1;setData(null);setError(null);setLoading(false);if(auto&&latitude!=null&&longitude!=null)void evaluate(false);},0);return()=>{window.clearTimeout(timer);requestId.current+=1;};},[auto,evaluate,latitude,longitude]);
  const refresh=useCallback(()=>evaluate(true),[evaluate]);
  return{data,error,loading,evaluate,refresh};
}
