"use client";
import { useState } from "react";
import { Filter } from "lucide-react";
import { alerts } from "@/data/mock";
import { AlertCard } from "@/components/marine-components";
import { DemoDataBadge, PageHeader } from "@/components/ui";
export default function AlertsPage(){const [filter,setFilter]=useState("all");const visible=alerts.filter(a=>filter==="all"||filter==="resolved"?filter==="all"||a.status==="resolved":a.severity===filter);return <div className="page"><PageHeader eyebrow="SAFETY INTELLIGENCE" title="Marine Safety Alerts" subtitle="Mock advisory information organized by status and severity." action={<DemoDataBadge/>}/><div className="filter-bar"><Filter size={16}/>{["all","critical","high","moderate","safe","resolved"].map(x=><button onClick={()=>setFilter(x)} className={filter===x?"selected":""} key={x}>{x==="all"?"All alerts":x}</button>)}</div><section className="alert-list"><div className="section-heading"><div><p className="eyebrow">CURRENT DEMONSTRATION FEED</p><h2>{filter==="resolved"?"Resolved":"Active Marine Alerts"}</h2></div><span>{visible.length} shown</span></div>{visible.map(alert=><AlertCard alert={alert} key={alert.id}/>)}</section></div>}
