import { apiClient } from "@/lib/api/client";
import { API_V1_PREFIX } from "@/lib/api/config";
import type { PFZGeoJSON, PFZResponse, PotentialFishingZone } from "@/features/pfz/types";
export const getNearestPFZ=(latitude:number,longitude:number,radiusKm=500)=>apiClient<PFZResponse>(`${API_V1_PREFIX}/pfz/nearest?${new URLSearchParams({latitude:String(latitude),longitude:String(longitude),radius_km:String(radiusKm)})}`);
export const getPFZGeoJSON=()=>apiClient<PFZGeoJSON>(`${API_V1_PREFIX}/pfz/geojson`);
export const getPFZ=(id:string)=>apiClient<PotentialFishingZone>(`${API_V1_PREFIX}/pfz/${id}`);
