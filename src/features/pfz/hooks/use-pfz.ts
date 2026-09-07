"use client";
import { useCallback, useEffect, useState } from "react";
import type { SelectedLocation } from "@/features/map/types";
import type { PFZResponse } from "@/features/pfz/types";
import { getNearestPFZ } from "@/lib/api/pfz";
export function usePFZ(location:SelectedLocation|null){const [data,setData]=useState<PFZResponse|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState<string|null>(null);const refresh=useCallback(async()=>{if(!location){setData(null);return;}setLoading(true);setError(null);try{setData(await getNearestPFZ(location.latitude,location.longitude));}catch(cause){setError(cause instanceof Error?cause.message:"PFZ service unavailable.");setData(null);}finally{setLoading(false);}},[location]);useEffect(()=>{const timer=window.setTimeout(()=>{void refresh();},0);return()=>window.clearTimeout(timer);},[refresh]);return{data,loading,error,refresh};}
