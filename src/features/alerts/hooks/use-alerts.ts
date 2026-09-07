"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { SelectedLocation } from "@/features/map/types";
import type { AlertListResponse } from "@/features/alerts/types";
import { getAlerts } from "@/lib/api/alerts";

export function useAlerts(location:SelectedLocation|null,radiusKm=100,active=false){
  const [data,setData]=useState<AlertListResponse|null>(null);const [loading,setLoading]=useState(false);const [error,setError]=useState<string|null>(null);const [refreshToken,setRefreshToken]=useState(0);const forceRefresh=useRef(false);const latitude=location?.latitude;const longitude=location?.longitude;
  const refresh=useCallback(()=>{forceRefresh.current=true;setRefreshToken(value=>value+1);},[]);
  useEffect(()=>{if(latitude==null||longitude==null)return;let mounted=true;const timer=window.setTimeout(async()=>{setLoading(true);setError(null);const forced=forceRefresh.current;forceRefresh.current=false;try{const result=await getAlerts({latitude,longitude,radiusKm,active,refresh:forced});if(mounted)setData(result);}catch{if(mounted){setData(null);setError("Unable to check marine alerts.");}}finally{if(mounted)setLoading(false);}},0);return()=>{mounted=false;window.clearTimeout(timer);};},[active,latitude,longitude,radiusKm,refreshToken]);
  return{data,loading,error,refresh};
}
