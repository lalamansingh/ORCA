"use client";
import {FormEvent,useState} from "react";
import {Navigation} from "lucide-react";
import {MarineMap} from "@/components/marine-map";
import {PageHeader} from "@/components/ui";
import {EvidenceFacts} from "@/components/evidence-facts";
import {apiClient} from "@/lib/api/client";
import {API_V1_PREFIX} from "@/lib/api/config";
import "../demo-polish.css";
type RouteResult={status:string;geometry:import("geojson").LineString|null;direct_distance_km:number;distance_km:number|null;route_mode:string;departure_time:string|null;risk_summary:Record<string,unknown>;geofence_summary:Record<string,unknown>;warnings:string[];limitations:string[];evidence:unknown[]};
export default function RoutesPage(){
 const[mode,setMode]=useState("LOWEST_RISK");
 const[startLat,setStartLat]=useState(13.08);
 const[startLon,setStartLon]=useState(80.27);
 const[endLat,setEndLat]=useState(13.20);
 const[endLon,setEndLon]=useState(80.50);
 const[clickTarget,setClickTarget]=useState<"start"|"end">("start");
 const[result,setResult]=useState<RouteResult|null>(null);
 const[loading,setLoading]=useState(false);
 const[error,setError]=useState("");

 const handleMapClick=(loc:import("@/features/map/types").SelectedLocation)=>{
  if(clickTarget==="start"){
   setStartLat(Number(loc.latitude.toFixed(4)));
   setStartLon(Number(loc.longitude.toFixed(4)));
   setClickTarget("end");
  }else{
   setEndLat(Number(loc.latitude.toFixed(4)));
   setEndLon(Number(loc.longitude.toFixed(4)));
   setClickTarget("start");
  }
 };

 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();
  setLoading(true);
  setError("");
  setResult(null);
  try{
   setResult(await apiClient<RouteResult>(`${API_V1_PREFIX}/routes/calculate`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
     start:{latitude:Number(startLat),longitude:Number(startLon)},
     destination:{latitude:Number(endLat),longitude:Number(endLon)},
     route_mode:mode
    }),
    timeoutMs:30_000
   }));
  }catch(cause){
   setError(cause instanceof Error?cause.message:"Route unavailable");
  }finally{
   setLoading(false);
  }
 };

 return <div className="page">
  <PageHeader eyebrow="ROUTE INTELLIGENCE" title="Marine Route Planner" subtitle="Click on the map or enter coordinates to plot a lower-risk marine route. Verify official navigation before departure."/>
  <div className="route-layout">
   <form className="route-form" onSubmit={submit}>
    <h2>Plan a route</h2>
    <div style={{display:"flex",gap:"8px",marginBottom:"10px"}}>
     <button type="button" className={`button ${clickTarget==="start"?"button-primary":""}`} style={{flex:1,fontSize:"12px",padding:"6px 8px"}} onClick={()=>setClickTarget("start")}>
      🟢 {clickTarget==="start"?"Selecting Start…":"Set Start (A)"}
     </button>
     <button type="button" className={`button ${clickTarget==="end"?"button-primary":""}`} style={{flex:1,fontSize:"12px",padding:"6px 8px"}} onClick={()=>setClickTarget("end")}>
      🏁 {clickTarget==="end"?"Selecting End…":"Set Destination (B)"}
     </button>
    </div>
    <label>Start latitude<input name="start_lat" type="number" step="any" min={-90} max={90} value={startLat} onChange={e=>setStartLat(Number(e.target.value))} required/></label>
    <label>Start longitude<input name="start_lon" type="number" step="any" min={-180} max={180} value={startLon} onChange={e=>setStartLon(Number(e.target.value))} required/></label>
    <label>Destination latitude<input name="end_lat" type="number" step="any" min={-90} max={90} value={endLat} onChange={e=>setEndLat(Number(e.target.value))} required/></label>
    <label>Destination longitude<input name="end_lon" type="number" step="any" min={-180} max={180} value={endLon} onChange={e=>setEndLon(Number(e.target.value))} required/></label>
    <label>Route mode<select value={mode} onChange={event=>setMode(event.target.value)}>{["LOWEST_RISK","BALANCED","SHORTEST_FEASIBLE"].map(value=><option key={value} value={value}>{value.replaceAll("_"," ")}</option>)}</select></label>
    <button className="button" disabled={loading}><Navigation size={16}/>{loading?"Planning route…":"Calculate route"}</button>
    <p style={{fontSize:"11px",color:"#64748b"}}>Tip: Tap anywhere on the map to set the active point coordinates directly.</p>
   </form>
   <section className="route-preview">
    <MarineMap selectMode={true} onSelectLocation={handleMapClick} showDemoFeatures={false} routeGeometry={result?.geometry}/>
    {error&&<p role="alert">{error}</p>}
    {result&&<div className="assistant-result">
     <h3>{result.status==="DEMO"?"DEMO DATA — geometry demonstration":result.status.replaceAll("_"," ")}</h3>
     <div className="route-summary">
      <div><span>Direct distance</span><b>{result.direct_distance_km.toFixed(1)} km</b></div>
      <div><span>Suggested distance</span><b>{result.distance_km==null?"Unavailable":`${result.distance_km.toFixed(1)} km`}</b></div>
      <div><span>Departure</span><b>{result.departure_time??"Not supplied"}</b></div>
      <div><span>Mode</span><b>{result.route_mode.replaceAll("_"," ")}</b></div>
     </div>
     <h4>Marine risk and highest-risk segment</h4>
     <p>{Object.keys(result.risk_summary).length?"See assessment below":"Unavailable — environmental masks not connected"}</p>
     <EvidenceFacts value={result.risk_summary}/>
     <h4>Maritime restrictions</h4>
     <p>{Object.keys(result.geofence_summary).length?"See assessment below":"Unknown — no clearance inferred"}</p>
     <EvidenceFacts value={result.geofence_summary}/>
     {result.warnings.map(item=><p className="result-warning" role="alert" key={item}>{item}</p>)}
     <details><summary>Evidence and limitations</summary><EvidenceFacts value={result.evidence}/>{result.limitations.map(item=><p key={item}>{item}</p>)}</details>
    </div>}
   </section>
  </div>
 </div>;
}
