import { apiClient } from "@/lib/api/client";
import { API_V1_PREFIX } from "@/lib/api/config";
import type { CombinedConditions, MarineResponse, WeatherResponse } from "@/features/conditions/types";

type Query = { latitude:number; longitude:number; timezone?:string; date?:string; refresh?:boolean };
const queryString=({latitude,longitude,timezone="auto",date,refresh}:Query)=>new URLSearchParams({latitude:String(latitude),longitude:String(longitude),timezone,...(date?{date}:{}),...(refresh?{refresh:"true"}:{})}).toString();
export const getWeatherConditions=(query:Query)=>apiClient<WeatherResponse>(`${API_V1_PREFIX}/weather?${queryString(query)}`,{timeoutMs:15_000});
export const getMarineConditions=(query:Query)=>apiClient<MarineResponse>(`${API_V1_PREFIX}/marine?${queryString(query)}`,{timeoutMs:15_000});
export const getCombinedConditions=(query:Query)=>apiClient<CombinedConditions>(`${API_V1_PREFIX}/conditions?${queryString(query)}`,{timeoutMs:20_000});
