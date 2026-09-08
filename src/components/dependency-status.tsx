"use client";
import {useEffect,useState} from "react";
import {apiClient} from "@/lib/api/client";
import {API_V1_PREFIX} from "@/lib/api/config";
import {EvidenceFacts} from "@/components/evidence-facts";
export function DependencyStatus(){
 const[data,setData]=useState<unknown>(null);const[error,setError]=useState("");
 useEffect(()=>{let active=true;Promise.all([apiClient(`${API_V1_PREFIX}/health`),apiClient(`${API_V1_PREFIX}/system/data-sources`),apiClient(`${API_V1_PREFIX}/system/capabilities`)]).then(([health,providers,capabilities])=>{if(active)setData({health,providers,capabilities});}).catch(()=>{if(active)setError("Backend status unavailable. Check the API connection.");});return()=>{active=false;};},[]);
 return <section className="subscription-settings"><h2>System status</h2><p>Configured capabilities and last observed provider state. These are not fresh provider probes.</p>{error?<p role="alert">{error}</p>:data?<EvidenceFacts value={data}/>:<p>Checking backend status…</p>}</section>;
}
