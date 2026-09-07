"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SelectedLocation } from "@/features/map/types";
import type { CombinedConditions } from "@/features/conditions/types";
import { getCombinedConditions } from "@/lib/api/conditions";

export function useConditions(location:SelectedLocation|null){
  const [data,setData]=useState<CombinedConditions|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [loading,setLoading]=useState(false);
  const [refreshToken,setRefreshToken]=useState(0);
  const forceRefresh=useRef(false);
  const latitude=location?.latitude;
  const longitude=location?.longitude;
  const refresh=useCallback(()=>{forceRefresh.current=true;setRefreshToken(value=>value+1);},[]);
  useEffect(()=>{
    if(latitude==null||longitude==null)return;
    let active=true;
    const timer=window.setTimeout(async()=>{
      setLoading(true);setError(null);
      const refreshRequested=forceRefresh.current;forceRefresh.current=false;
      try{const response=await getCombinedConditions({latitude,longitude,refresh:refreshRequested});if(active)setData(response);}
      catch(cause){if(active)setError(cause instanceof Error?cause.message:"Conditions are unavailable.");}
      finally{if(active)setLoading(false);}
    },0);
    return()=>{active=false;window.clearTimeout(timer);};
  },[latitude,longitude,refreshToken]);
  return{data,error,loading,refresh};
}
