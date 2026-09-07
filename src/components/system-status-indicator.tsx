"use client";
import { useEffect, useState } from "react";
import { CloudOff, LoaderCircle, Radio } from "lucide-react";
import { getDataSources, getHealth, type ProviderHealth } from "@/lib/api/health";

type BackendStatus="checking"|"operational"|"degraded"|"offline";
type DependencyStatus="checking"|"operational"|"partial"|"offline"|"not_checked";
const providerLabel=(provider:ProviderHealth|undefined):DependencyStatus=>provider?.status==="operational"?"operational":provider?.status==="unavailable"?"offline":"not_checked";
const statusText=(status:DependencyStatus)=>status==="operational"?"Operational":status==="partial"?"Partial":status==="offline"?"Unavailable":status==="checking"?"Checking":"Not checked";

export function SystemStatusIndicator(){
  const [status,setStatus]=useState<BackendStatus>("checking");
  const [database,setDatabase]=useState<DependencyStatus>("checking");
  const [postgis,setPostgis]=useState<DependencyStatus>("checking");
  const [weather,setWeather]=useState<DependencyStatus>("checking");
  const [marine,setMarine]=useState<DependencyStatus>("checking");
  const [alerts,setAlerts]=useState<DependencyStatus>("checking");
  useEffect(()=>{let mounted=true;void Promise.all([getHealth(),getDataSources()]).then(([health,sources])=>{if(!mounted)return;setStatus(health.status==="healthy"?"operational":"degraded");setDatabase(health.dependencies.database.status==="healthy"?"operational":"offline");setPostgis(health.dependencies.database.postgis===true?"operational":"not_checked");setWeather(providerLabel(health.dependencies.weather_provider));setMarine(providerLabel(health.dependencies.marine_provider));const values=sources.alerts.map(item=>item.status);setAlerts(values.some(value=>value==="operational"||value==="demo")?(values.some(value=>!["operational","demo","not_configured"].includes(value))?"partial":"operational"):values.some(value=>value==="not_checked")?"not_checked":"offline");},()=>{if(mounted){setStatus("offline");setDatabase("offline");setPostgis("not_checked");setWeather("offline");setMarine("offline");setAlerts("offline");}});return()=>{mounted=false};},[]);
  const Icon=status==="checking"?LoaderCircle:status==="offline"?CloudOff:Radio;
  return <div className={`system-status ${status}`}><div className="system-status-title"><Icon size={13}/><span>System Status</span></div><small>API <b>{status==="operational"||status==="degraded"?"Operational":status==="checking"?"Checking":"Unavailable"}</b></small><small>Database <b>{statusText(database)}</b></small><small>PostGIS <b>{statusText(postgis)}</b></small><small>Weather <b>{statusText(weather)}</b></small><small>Marine <b>{statusText(marine)}</b></small><small>Alerts <b>{statusText(alerts)}</b></small></div>;
}
