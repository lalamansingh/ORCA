import { apiClient } from "@/lib/api/client";
import { API_V1_PREFIX } from "@/lib/api/config";
import type { AlertListResponse, AlertSeverity, AlertStatus, AlertSubscription, AlertSubscriptionInput, AlertType, MarineAlert } from "@/features/alerts/types";

type AlertQuery={latitude:number;longitude:number;radiusKm?:number;status?:AlertStatus;type?:AlertType;severity?:AlertSeverity;active?:boolean;refresh?:boolean};
export function getAlerts(query:AlertQuery):Promise<AlertListResponse>{const params=new URLSearchParams({latitude:String(query.latitude),longitude:String(query.longitude),radius_km:String(query.radiusKm??100)});if(query.status)params.set("status",query.status);if(query.type)params.set("type",query.type);if(query.severity)params.set("severity",query.severity);if(query.refresh)params.set("refresh","true");return apiClient<AlertListResponse>(`${API_V1_PREFIX}/alerts${query.active?"/active":""}?${params}`,{timeoutMs:15_000});}
export function getAlert(id:string,latitude?:number,longitude?:number):Promise<MarineAlert>{const params=new URLSearchParams();if(latitude!=null&&longitude!=null){params.set("latitude",String(latitude));params.set("longitude",String(longitude));}return apiClient<MarineAlert>(`${API_V1_PREFIX}/alerts/${encodeURIComponent(id)}${params.size?`?${params}`:""}`,{timeoutMs:10_000});}
const subscriptionBase=`${API_V1_PREFIX}/alert-subscriptions`;
export const getAlertSubscriptions=()=>apiClient<AlertSubscription[]>(subscriptionBase);
export const createAlertSubscription=(input:AlertSubscriptionInput)=>apiClient<AlertSubscription>(subscriptionBase,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
export const updateAlertSubscription=(id:string,input:Partial<AlertSubscriptionInput>)=>apiClient<AlertSubscription>(`${subscriptionBase}/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(input)});
export const deleteAlertSubscription=(id:string)=>apiClient<void>(`${subscriptionBase}/${id}`,{method:"DELETE"});
