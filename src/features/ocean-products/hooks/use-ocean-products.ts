"use client";
import {useEffect,useState} from "react";
import type {SelectedLocation} from "@/features/map/types";
import type {OceanSampleResponse} from "@/features/ocean-products/types";
import {getOceanSamples} from "@/lib/api/ocean-products";
export function useOceanProducts(location:SelectedLocation|null){const[data,setData]=useState<OceanSampleResponse|null>(null),[error,setError]=useState<string|null>(null);useEffect(()=>{const timer=setTimeout(()=>{if(!location){setData(null);return;}void getOceanSamples(location.latitude,location.longitude).then(setData,error=>setError(error instanceof Error?error.message:"Ocean products unavailable."));},0);return()=>clearTimeout(timer);},[location]);return{data,error};}
