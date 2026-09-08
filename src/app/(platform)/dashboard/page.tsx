/* eslint-disable @next/next/no-html-link-for-pages */
"use client";
import { useState } from "react";
import { Activity, ArrowUpRight, Droplets, Eye, Gauge, Wind, Waves } from "lucide-react";
import { AssistantInput, MarineMetricCard, PFZCard, QuickPrompt } from "@/components/marine-components";
import { AlertSafetyNote, MarineAlertCard } from "@/components/alert-components";
import { StateBox } from "@/components/ui";
import { MarineMap } from "@/components/marine-map";
import { ConditionsPanel } from "@/components/conditions-panel";
import { PageHeader } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { publishSelectedLocation, useSharedSelectedLocation } from "@/features/map/location-store";
import { useConditions } from "@/features/conditions/hooks/use-conditions";
import { degreesToCompass, formatMeasurement, updatedAgo } from "@/features/conditions/format";
import type { SelectedLocation } from "@/features/map/types";
import { useAlerts } from "@/features/alerts/hooks/use-alerts";
import { RiskAssessmentCard } from "@/components/risk-components";
import { useRiskAssessment } from "@/features/risk/hooks/use-risk-assessment";
import { usePFZ } from "@/features/pfz/hooks/use-pfz";
import { useOceanProducts } from "@/features/ocean-products/hooks/use-ocean-products";
import { OceanProductivityCard } from "@/components/ocean-productivity-card";

const COASTAL_SECTORS = [
  { name: "📍 Mumbai Coast", latitude: 18.92, longitude: 72.83 },
  { name: "📍 Chennai Port", latitude: 13.08, longitude: 80.27 },
  { name: "📍 Kochi / Cochin", latitude: 9.93, longitude: 76.26 },
  { name: "📍 Porbandar (Gujarat)", latitude: 21.64, longitude: 69.60 },
  { name: "📍 Visakhapatnam", latitude: 17.68, longitude: 83.21 },
  { name: "📍 Goa Coast", latitude: 15.49, longitude: 73.82 },
];

export default function DashboardPage(){
  const {user}=useAuth();
  const sharedLocation=useSharedSelectedLocation();
  const profileLocation:SelectedLocation|null=user?.default_latitude!=null&&user.default_longitude!=null?{latitude:user.default_latitude,longitude:user.default_longitude,source:"default",label:"Profile Default Location"}:null;
  const defaultCoastalLocation:SelectedLocation = { latitude: COASTAL_SECTORS[0].latitude, longitude: COASTAL_SECTORS[0].longitude, source: "default", label: COASTAL_SECTORS[0].name };
  const location=sharedLocation??profileLocation??defaultCoastalLocation;
  const conditions=useConditions(location);
  const alertData=useAlerts(location,100,true);
  const [assessmentTime,setAssessmentTime]=useState<string|null>(null);
  const risk=useRiskAssessment(location,assessmentTime);
  const pfz=usePFZ(location);
  const oceanProducts=useOceanProducts(location);
  const weather=conditions.data?.weather?.current,marine=conditions.data?.marine?.current;
  const sourceDetail=conditions.data?.sources.map(source=>source.provider).join(" · ")||"Provider unavailable";
  const status=(value:unknown):"CURRENT"|"UNAVAILABLE"=>value?"CURRENT":"UNAVAILABLE";
  return <div className="page dashboard-page">
    <PageHeader eyebrow="COMMAND CENTER" title="Marine Intelligence Overview" subtitle="Current live model forecasts and satellite intelligence for your selected coastal sector." action={<div className="header-actions"><button className="map-control" onClick={conditions.refresh} disabled={!location||conditions.loading}>{conditions.loading?"Refreshing…":"Refresh Conditions"}</button><span>{conditions.data?updatedAgo(conditions.data.retrieved_at):"Awaiting location"}</span></div>}/>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px", alignItems: "center" }}>
      <span style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8" }}>Quick Sector:</span>
      {COASTAL_SECTORS.map((sector) => (
        <button
          key={sector.name}
          className="map-control"
          style={{
            fontSize: "12px",
            padding: "4px 10px",
            background: location?.latitude === sector.latitude && location?.longitude === sector.longitude ? "rgba(56, 189, 248, 0.2)" : undefined,
            borderColor: location?.latitude === sector.latitude && location?.longitude === sector.longitude ? "#38bdf8" : undefined,
            color: location?.latitude === sector.latitude && location?.longitude === sector.longitude ? "#38bdf8" : undefined,
          }}
          onClick={() => publishSelectedLocation({ latitude: sector.latitude, longitude: sector.longitude, source: "default", label: sector.name })}
        >
          {sector.name}
        </button>
      ))}
    </div>
    <RiskAssessmentCard location={location} assessment={risk.data} loading={risk.loading} error={risk.error} onRefresh={risk.refresh} assessmentTime={assessmentTime} onAssessmentTimeChange={setAssessmentTime}/>
    <section className="metric-grid">
      <MarineMetricCard icon={<Waves/>} label="Wave Height" value={formatMeasurement(marine?.wave_height)} detail={sourceDetail} status={status(marine?.wave_height)}/>
      <MarineMetricCard icon={<Wind/>} label="Wind Speed" value={formatMeasurement(weather?.wind_speed)} detail={weather?.wind_direction?`${Math.round(weather.wind_direction.value)}° ${degreesToCompass(weather.wind_direction.value)} · ${sourceDetail}`:sourceDetail} status={status(weather?.wind_speed)}/>
      <MarineMetricCard icon={<Gauge/>} label="Sea Surface Temperature" value={formatMeasurement(marine?.sea_surface_temperature)} detail={sourceDetail} status={status(marine?.sea_surface_temperature)}/>
      <MarineMetricCard icon={<Activity/>} label="Ocean Current" value={formatMeasurement(marine?.ocean_current_speed)} detail={marine?.ocean_current_direction?`Toward ${Math.round(marine.ocean_current_direction.value)}° ${degreesToCompass(marine.ocean_current_direction.value)} · ${sourceDetail}`:sourceDetail} status={status(marine?.ocean_current_speed)}/>
      <MarineMetricCard icon={<Eye/>} label="Visibility" value={formatMeasurement(weather?.visibility)} detail={sourceDetail} status={status(weather?.visibility)}/>
      <MarineMetricCard icon={<Droplets/>} label="Sea Level Height" value={formatMeasurement(marine?.sea_level_height)} detail="Model value relative to mean sea level" status={status(marine?.sea_level_height)}/>
    </section>
    <ConditionsPanel compact conditions={conditions.data} loading={conditions.loading} error={conditions.error} onRefresh={conditions.refresh}/>
    <OceanProductivityCard data={oceanProducts.data} error={oceanProducts.error}/>
    <section className="dashboard-columns"><div className="stack"><div className="section-heading"><div><p className="eyebrow">SAFETY · CONFIGURED PROVIDERS</p><h2>Active Marine Alerts</h2></div><a href="/alerts">View all <ArrowUpRight size={15}/></a></div><AlertSafetyNote/>{!location?<StateBox kind="empty" title="Location required" detail="Select a location to check relevant alerts."/>:alertData.error||alertData.data?.status==="unavailable"?<StateBox kind="unavailable" title="Alert service unavailable" detail="ORCA could not check configured sources. This is not a no-alert result."/>:alertData.data?.alerts.length?<><div className="nearby-hazard-card"><p className="eyebrow">NEARBY HAZARD</p><h3>{alertData.data.alerts[0].type.replaceAll("_"," ")}</h3><p>{alertData.data.alerts[0].distance_km==null?"Proximity unavailable":alertData.data.alerts[0].is_inside?"Selected location inside advisory geometry":`${alertData.data.alerts[0].distance_km.toFixed(1)} km from selected location`} · Highest severity {alertData.data.summary.highest_severity??"—"}</p></div>{alertData.data.alerts.slice(0,2).map(alert=><MarineAlertCard compact alert={alert} key={alert.id}/>)}</>:<StateBox kind="empty" title="No active alerts found." detail="Available configured providers were checked. Continue to follow official authority channels."/>}</div><PFZCard data={pfz.data} loading={pfz.loading} error={pfz.error}/></section>
    <section className="ask-card"><div><p className="eyebrow">ORCA MARINE ASSISTANT</p><h2>Ask ORCA</h2><p>Ask about marine conditions and inspect the evidence returned by ORCA services.</p></div><div><AssistantInput/><div className="prompt-row"><QuickPrompt>Show forecast conditions</QuickPrompt><QuickPrompt>Find nearest PFZ</QuickPrompt><QuickPrompt>Show weather evidence</QuickPrompt></div></div></section>
    <section className="dashboard-map"><div className="section-heading"><div><p className="eyebrow">SPATIAL INTELLIGENCE</p><h2>Marine Operations Map</h2></div></div><MarineMap selectedLocation={location} alerts={alertData.data?.alerts??[]} riskLevel={risk.data?.level}/></section>
  </div>;
}
