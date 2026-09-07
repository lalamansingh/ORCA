import { apiClient } from "@/lib/api/client";
import { API_V1_PREFIX } from "@/lib/api/config";
export type SavedLocationType="HOME_HARBOUR"|"FISHING_HARBOUR"|"FISHING_SPOT"|"CUSTOM";
export interface SavedLocation{id:string;name:string;location_type:SavedLocationType;latitude:number;longitude:number;created_at:string;updated_at:string}
export type SavedLocationInput=Pick<SavedLocation,"name"|"location_type"|"latitude"|"longitude">;
const base=`${API_V1_PREFIX}/saved-locations`;
export const getSavedLocations=()=>apiClient<SavedLocation[]>(base);
export const createSavedLocation=(input:SavedLocationInput)=>apiClient<SavedLocation>(base,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
export const updateSavedLocation=(id:string,input:SavedLocationInput)=>apiClient<SavedLocation>(`${base}/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
export const deleteSavedLocation=(id:string)=>apiClient<void>(`${base}/${id}`,{method:"DELETE"});
