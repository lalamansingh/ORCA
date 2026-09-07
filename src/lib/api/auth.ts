import { apiClient } from "@/lib/api/client";
import { API_V1_PREFIX } from "@/lib/api/config";
export interface AuthUser { id:string; email:string; full_name:string|null; preferred_language:string; preferred_units:string; default_latitude:number|null; default_longitude:number|null; is_active:boolean; created_at:string; }
export interface RegisterInput { email:string; password:string; full_name:string; }
export interface LoginInput { email:string; password:string; }
export interface ProfileUpdate { full_name?:string; preferred_language?:string; preferred_units?:"metric"|"nautical"; default_latitude?:number|null; default_longitude?:number|null; }
export const register=(input:RegisterInput)=>apiClient<AuthUser>(`${API_V1_PREFIX}/auth/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
export const login=(input:LoginInput)=>apiClient<AuthUser>(`${API_V1_PREFIX}/auth/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
export const logout=()=>apiClient<void>(`${API_V1_PREFIX}/auth/logout`,{method:"POST"});
export const getCurrentUser=()=>apiClient<AuthUser>(`${API_V1_PREFIX}/auth/me`);
export const refreshSession=()=>apiClient<AuthUser>(`${API_V1_PREFIX}/auth/refresh`,{method:"POST"});
export const updateProfile=(input:ProfileUpdate)=>apiClient<AuthUser>(`${API_V1_PREFIX}/users/me`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
