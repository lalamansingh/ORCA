"use client";
import { Activity, ArrowUpRight, Droplets, Eye, Gauge, Wind, Waves } from "lucide-react";
import { alerts, riskAssessment } from "@/data/mock";
import { AlertCard, AssistantInput, MarineMetricCard, PFZCard, QuickPrompt, RiskCard } from "@/components/marine-components";
import { MarineMap } from "@/components/marine-map";
import { ConditionsPanel } from "@/components/conditions-panel";
import { PageHeader } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { useSharedSelectedLocation } from "@/features/map/location-store";
import { useConditions } from "@/features/conditions/hooks/use-conditions";
import { degreesToCompass, formatMeasurement, updatedAgo } from "@/features/conditions/format";
import type { SelectedLocation } from "@/features/map/types";

export default function DashboardPage(){
  const {user}=useAuth();
  const sharedLocation=useSharedSelectedLocation();
  const profileLocation:SelectedLocation|null=user?.default_latitude!=null&&user.default_longitude!=null?{latitude:user.default_latitude,longitude:user.default_longitude,source:"default",label:"Profile Default Location"}:null;
  const location=sharedLocation??profileLocation;
  const conditions=useConditions(location);
  const weather=conditions.data?.weather?.current,marine=conditions.data?.marine?.current;
  const sourceDetail=conditions.data?.sources.map(source=>source.provider).join(" · ")||"Provider unavailable";
  const status=(value:unknown):"CURRENT"|"UNAVAILABLE"=>value?"CURRENT":"UNAVAILABLE";
  return <div className="page dashboard-page">
    <PageHeader eyebrow="COMMAND CENTER" title="Marine Intelligence Overview" subtitle="Current model forecasts for your selected location." action={<div className="header-actions"><button className="map-control" onClick={conditions.refresh} disabled={!location||conditions.loading}>{conditions.loading?"Refreshing…":"Refresh Conditions"}</button><span>{conditions.data?updatedAgo(conditions.data.retrieved_at):"Awaiting location"}</span></div>}/>
    <RiskCard risk={riskAssessment}/>
    <section className="metric-grid">
      <MarineMetricCard icon={<Waves/>} label="Wave Height" value={formatMeasurement(marine?.wave_height)} detail={sourceDetail} status={status(marine?.wave_height)}/>
      <MarineMetricCard icon={<Wind/>} label="Wind Speed" value={formatMeasurement(weather?.wind_speed)} detail={weather?.wind_direction?`${Math.round(weather.wind_direction.value)}° ${degreesToCompass(weather.wind_direction.value)} · ${sourceDetail}`:sourceDetail} status={status(weather?.wind_speed)}/>
      <MarineMetricCard icon={<Gauge/>} label="Sea Surface Temperature" value={formatMeasurement(marine?.sea_surface_temperature)} detail={sourceDetail} status={status(marine?.sea_surface_temperature)}/>
      <MarineMetricCard icon={<Activity/>} label="Ocean Current" value={formatMeasurement(marine?.ocean_current_speed)} detail={marine?.ocean_current_direction?`Toward ${Math.round(marine.ocean_current_direction.value)}° ${degreesToCompass(marine.ocean_current_direction.value)} · ${sourceDetail}`:sourceDetail} status={status(marine?.ocean_current_speed)}/>
      <MarineMetricCard icon={<Eye/>} label="Visibility" value={formatMeasurement(weather?.visibility)} detail={sourceDetail} status={status(weather?.visibility)}/>
      <MarineMetricCard icon={<Droplets/>} label="Sea Level Height" value={formatMeasurement(marine?.sea_level_height)} detail="Model value relative to mean sea level" status={status(marine?.sea_level_height)}/>
    </section>
    <ConditionsPanel compact conditions={conditions.data} loading={conditions.loading} error={conditions.error} onRefresh={conditions.refresh}/>
    <section className="dashboard-columns"><div className="stack"><div className="section-heading"><div><p className="eyebrow">SAFETY · DEMO ADVISORIES</p><h2>Active Marine Alerts</h2></div><a href="/alerts">View all <ArrowUpRight size={15}/></a></div>{alerts.slice(0,2).map(alert=><AlertCard compact alert={alert} key={alert.id}/>)}</div><PFZCard/></section>
    <section className="ask-card"><div><p className="eyebrow">ORCA MARINE ASSISTANT</p><h2>Ask ORCA</h2><p>Conversational analysis is not connected yet. Explore the existing interface preview.</p></div><div><AssistantInput/><div className="prompt-row"><QuickPrompt>Show forecast conditions</QuickPrompt><QuickPrompt>Find nearest PFZ</QuickPrompt><QuickPrompt>Show weather evidence</QuickPrompt></div></div></section>
    <section className="dashboard-map"><div className="section-heading"><div><p className="eyebrow">SPATIAL INTELLIGENCE</p><h2>Marine Operations Map</h2></div></div><MarineMap selectedLocation={location}/></section>
  </div>;
}
