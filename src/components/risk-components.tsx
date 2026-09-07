"use client";
import Link from "next/link";
import { AlertTriangle, BarChart3, CheckCircle2, ChevronDown, Clock3, ExternalLink, Info, RefreshCw, ShieldAlert } from "lucide-react";
import { useState } from "react";
import type { SelectedLocation } from "@/features/map/types";
import type { MarineRiskAssessment, RiskTimePreset } from "@/features/risk/types";
import { assessmentTimeLabel, calculatedTimeLabel, localDateTimeValue, resolveRiskPreset, riskFactorValue, riskLevelLabel, riskUiState, topRiskFactors } from "@/features/risk/presentation";

const riskIcon=(level:MarineRiskAssessment["level"])=>level==="LOW"?<CheckCircle2/>:level==="UNAVAILABLE"?<Info/>:<ShieldAlert/>;

export function RiskTimeSelector({value,onChange,compact=false}:{value:string|null;onChange:(value:string|null)=>void;compact?:boolean}){
  const setPreset=(preset:RiskTimePreset)=>onChange(resolveRiskPreset(preset));
  return <div className={`risk-time-selector ${compact?"compact":""}`} aria-label="Assessment time">
    <span><Clock3 size={13}/>Assessment time</span>
    <div>{(["now","3h","6h","12h"] as const).map(preset=><button type="button" className={(preset==="now"&&!value)?"active":""} onClick={()=>setPreset(preset)} key={preset}>{preset==="now"?"Now":`+${preset}`}</button>)}</div>
    <label>Custom<input type="datetime-local" value={localDateTimeValue(value)} min={localDateTimeValue(new Date().toISOString())} onChange={event=>onChange(event.target.value?new Date(event.target.value).toISOString():null)}/></label>
  </div>;
}

export function RiskAssessmentCard({location,assessment,loading,error,onRefresh,assessmentTime,onAssessmentTimeChange}:{location:SelectedLocation|null;assessment:MarineRiskAssessment|null;loading:boolean;error:string|null;onRefresh:()=>void;assessmentTime:string|null;onAssessmentTimeChange:(value:string|null)=>void}){
  const [whyOpen,setWhyOpen]=useState(false);const state=riskUiState(loading,error,assessment);const score=assessment?.score??0;const top=topRiskFactors(assessment);
  if(!location)return <section className="risk-card risk-empty"><Info/><div><p className="card-label">MARINE OPERATIONAL RISK</p><h2>Select a location to assess risk</h2><p className="risk-copy">Choose a coastal point on the map or configure a profile default. Missing location is never treated as low risk.</p><Link className="button-link" href="/map">Choose location</Link></div></section>;
  return <>
    <section className={`risk-card real-risk ${assessment?.level.toLowerCase()??state}`}>
      <div className="risk-card-main"><p className="card-label">MARINE OPERATIONAL RISK · DETERMINISTIC DECISION SUPPORT</p>
        {state==="loading"?<><h2>CALCULATING…</h2><p className="risk-copy">Collecting normalized weather, marine, and relevant alert evidence.</p></>:state==="error"?<><h2>ASSESSMENT UNAVAILABLE</h2><p className="risk-copy">{error} Missing provider data is not interpreted as low risk.</p></>:assessment?<><div className="risk-level-title">{riskIcon(assessment.level)}<h2>{riskLevelLabel(assessment.level).toUpperCase()}</h2><span>{assessment.score==null?"No responsible score":`${assessment.score} / 100`}</span></div><p className="risk-copy">{assessment.summary}</p><div className="factor-row">{top.length?top.map(factor=><span key={`${factor.type}-${factor.label}`}>{factor.label} · +{factor.score_contribution}</span>):<span>No configured elevated threshold crossed</span>}</div><div className="risk-meta"><span>Quality: {assessment.data_quality}</span><span>{assessment.provenance_mode==="LIVE"?"Live/provider data":assessment.provenance_mode==="MIXED"?"MIXED · DEMO-INFLUENCED":`${assessment.provenance_mode} ASSESSMENT`}</span><span>{assessmentTimeLabel(assessment)}</span></div></>:<><h2>READY TO ASSESS</h2><p className="risk-copy">Run the deterministic model for {location.label??"the selected location"}.</p></>}
        <div className="risk-actions"><button onClick={()=>setWhyOpen(value=>!value)} disabled={!assessment}>Why? <ChevronDown size={14}/></button><button onClick={onRefresh} disabled={loading}><RefreshCw size={14}/>{loading?"Calculating…":"Refresh Assessment"}</button></div>
      </div>
      <div className="risk-card-side"><div className="risk-gauge" style={{"--risk-score":`${score*3.6}deg`} as React.CSSProperties} role="img" aria-label={assessment?.score==null?"Risk score unavailable":`Risk score ${assessment.score} out of 100`}><div>{riskIcon(assessment?.level??"UNAVAILABLE")}<strong>{assessment?.score??"—"}</strong><small>/ 100</small></div></div><RiskTimeSelector value={assessmentTime} onChange={onAssessmentTimeChange}/></div>
    </section>
    {whyOpen&&assessment&&<RiskExplanationPanel assessment={assessment}/>} 
  </>;
}

export function RiskExplanationPanel({assessment,compact=false}:{assessment:MarineRiskAssessment;compact?:boolean}){
  return <section className={`risk-explanation ${compact?"compact":""}`}><div className="risk-explanation-head"><div><p className="eyebrow">WHY THIS RISK?</p><h2>{riskLevelLabel(assessment.level)} — {assessment.score==null?"score unavailable":`${assessment.score}/100`}</h2></div><span>{assessment.risk_model_version}</span></div>
    <p>{assessment.recommendation}</p><div className="risk-factor-list">{assessment.factors.filter(factor=>factor.score_contribution>0).map(factor=><article key={`${factor.type}-${factor.label}-${factor.alert_id??"model"}`}><span className={`risk-factor-icon ${factor.severity.toLowerCase()}`}><AlertTriangle size={15}/></span><div><strong>{factor.label}</strong><small>{factor.reason}</small><em>{factor.source}</em>{factor.alert_id&&<Link href={`/alerts/${factor.alert_id}`}>View Alert</Link>}{factor.source_url&&<a href={factor.source_url} target="_blank" rel="noreferrer">Source <ExternalLink size={11}/></a>}</div><div><b>+{factor.score_contribution}</b><span>{riskFactorValue(factor)}</span></div></article>)}</div>
    <div className="risk-evidence-grid"><div><h3>Assessment</h3><span>Forecast time <b>{assessmentTimeLabel(assessment)}</b></span><span>Calculated <b>{calculatedTimeLabel(assessment)} IST</b></span><span>Data quality <b>{assessment.data_quality}</b></span><span>Provenance <b>{assessment.provenance_mode}</b></span></div><div><h3>Sources</h3>{assessment.sources.map(source=><span key={`${source.provider}-${source.dataset}-${source.source_type??"data"}`}>{source.provider}<b>{source.dataset}</b></span>)}</div></div>
    {!!assessment.limitations.length&&<div className="risk-limitations"><h3>Limitations</h3><ul>{assessment.limitations.map(item=><li key={item}>{item}</li>)}</ul></div>}
  </section>;
}

export function MapRiskPanel({location,assessment,loading,error,onAssess,assessmentTime,onAssessmentTimeChange}:{location:SelectedLocation|null;assessment:MarineRiskAssessment|null;loading:boolean;error:string|null;onAssess:()=>void;assessmentTime:string|null;onAssessmentTimeChange:(value:string|null)=>void}){
  const [open,setOpen]=useState(false);return <div className="map-risk-panel"><p className="eyebrow">MARINE OPERATIONAL RISK</p><RiskTimeSelector compact value={assessmentTime} onChange={onAssessmentTimeChange}/><button className="button map-risk-button" disabled={!location||loading} onClick={onAssess}><BarChart3 size={14}/>{loading?"Assessing…":"Assess Marine Risk"}</button>{error&&<p className="risk-inline-error">{error}</p>}{assessment&&<div className={`map-risk-result ${assessment.level.toLowerCase()}`}><span>{riskIcon(assessment.level)}</span><div><strong>{riskLevelLabel(assessment.level)}</strong><small>{assessment.score==null?"Score unavailable":`${assessment.score}/100`} · {assessment.data_quality}</small></div><button onClick={()=>setOpen(value=>!value)}>Why?</button></div>}{open&&assessment&&<div className="map-risk-why">{topRiskFactors(assessment).map(factor=><span key={factor.label}><b>+{factor.score_contribution}</b>{factor.label}</span>)}<small>{assessment.risk_model_version} · {assessment.provenance_mode}</small></div>}</div>;
}
