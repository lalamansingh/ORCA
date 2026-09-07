"use client";
import { useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/marine-components";
import { PageHeader } from "@/components/ui";
import { ConditionsPanel } from "@/components/conditions-panel";
import { useAuth } from "@/components/auth-provider";
import { useConditions } from "@/features/conditions/hooks/use-conditions";
import { forecastTime } from "@/features/conditions/format";
import { useSharedSelectedLocation } from "@/features/map/location-store";
import type { SelectedLocation } from "@/features/map/types";

const charts=[{title:"Sea Surface Temperature",key:"sst",unit:"°C",color:"#e27841"},{title:"Wave Height Forecast",key:"waves",unit:"m",color:"#117ea6"},{title:"Wind Speed Forecast",key:"wind",unit:"km/h",color:"#16a085"},{title:"Ocean Current Forecast",key:"current",unit:"m/s",color:"#6b7dc4"},{title:"Visibility Forecast",key:"visibility",unit:"km",color:"#7f8ea3"}] as const;

export default function AnalyticsPage(){
  const [hours,setHours]=useState<24|48>(24);
  const {user}=useAuth();
  const shared=useSharedSelectedLocation();
  const profile:SelectedLocation|null=user?.default_latitude!=null&&user.default_longitude!=null?{latitude:user.default_latitude,longitude:user.default_longitude,source:"default",label:"Profile Default Location"}:null;
  const location=shared??profile;
  const conditions=useConditions(location);
  const chartData=useMemo(()=>{
    const weather=conditions.data?.weather,marine=conditions.data?.marine;
    const length=Math.min(hours,Math.max(weather?.hourly.length??0,marine?.hourly.length??0));
    return Array.from({length},(_,index)=>{const weatherPoint=weather?.hourly[index],marinePoint=marine?.hourly[index],time=weatherPoint?.observed_at??marinePoint?.observed_at;return{name:time?forecastTime(time,weather?.timezone??marine?.timezone??"auto"):String(index),sst:marinePoint?.sea_surface_temperature?.value??null,waves:marinePoint?.wave_height?.value??null,wind:weatherPoint?.wind_speed?.value??null,current:marinePoint?.ocean_current_speed?.value??null,visibility:weatherPoint?.visibility?.value??null};});
  },[conditions.data,hours]);
  return <div className="page">
    <PageHeader eyebrow="OCEAN ANALYTICS" title="Conditions & Forecast" subtitle="Provider-backed model forecast for the selected location." action={<button className="map-control" onClick={conditions.refresh} disabled={!location||conditions.loading}>{conditions.loading?"Refreshing…":"Refresh Forecast"}</button>}/>
    <div className="analytics-toolbar"><div className="location-select">{location?.label??"No location selected"} <span>{location?`${location.latitude.toFixed(4)}°, ${location.longitude.toFixed(4)}°`:"Choose a location on the map"}</span></div><div className="range-tabs">{([24,48] as const).map(value=><button onClick={()=>setHours(value)} className={hours===value?"active":""} key={value}>{value}H</button>)}</div></div>
    <ConditionsPanel compact conditions={conditions.data} loading={conditions.loading} error={conditions.error} onRefresh={conditions.refresh}/>
    <div className="chart-grid">{charts.map(chart=><ChartCard title={`${chart.title} · ${hours}H`} status="CURRENT" key={chart.key}><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id={chart.key} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={chart.color} stopOpacity={.28}/><stop offset="100%" stopColor={chart.color} stopOpacity={.01}/></linearGradient></defs><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10,fill:"#627d98"}}/><YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:"#627d98"}} width={34}/><Tooltip/><Area connectNulls={false} dataKey={chart.key} stroke={chart.color} strokeWidth={2} fill={`url(#${chart.key})`}/></AreaChart></ResponsiveContainer></div><p className="chart-footer">Model forecast · units: {chart.unit}. Missing provider values are shown as gaps.</p></ChartCard>)}</div>
  </div>;
}
