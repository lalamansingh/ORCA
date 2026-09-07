"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Anchor, Bell, Bot, ChartNoAxesCombined, ChevronDown, Clock3, History, LayoutDashboard, Map, Menu, Navigation, Route, Settings, ShieldAlert, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { DataFreshnessBadge } from "@/components/ui";
import { SystemStatusIndicator } from "@/components/system-status-indicator";
import { useAuth } from "@/components/auth-provider";
import { useSharedSelectedLocation } from "@/features/map/location-store";
import { formatCoordinate } from "@/features/map/coordinates";
import { useAlerts } from "@/features/alerts/hooks/use-alerts";
import { selectUrgentAlert } from "@/features/alerts/presentation";

const navigation=[
  {href:"/dashboard",label:"Overview",icon:LayoutDashboard},
  {href:"/assistant",label:"AI Assistant",icon:Bot},
  {href:"/map",label:"Marine Map",icon:Map},
  {href:"/alerts",label:"Safety Alerts",icon:ShieldAlert},
  {href:"/routes",label:"Route Planner",icon:Route},
  {href:"/analytics",label:"Ocean Analytics",icon:ChartNoAxesCombined},
  {href:"/history",label:"History",icon:History},
  {href:"/settings",label:"Settings",icon:Settings},
];

function UserProfile(){
  const {user,logout,isLoading}=useAuth();
  const initials=(user?.full_name||user?.email||"OR").split(" ").map(value=>value[0]).join("").slice(0,2).toUpperCase();
  return <div className="profile"><span>{initials}</span><div><strong>{user?.full_name||"ORCA User"}</strong><small>{user?.email||"Checking session…"}</small></div><button onClick={()=>void logout()} disabled={isLoading} aria-label="Log out" title="Log out"><ChevronDown size={15}/></button></div>;
}

function Sidebar({onClose,alertCount=0}:{onClose?:()=>void;alertCount?:number}){
  const path=usePathname();
  return <aside className="app-sidebar"><div className="side-top"><Link href="/dashboard" className="brand"><span className="brand-mark"><Anchor size={18}/></span>ORCA</Link><button className="mobile-only icon-button" onClick={onClose} aria-label="Close navigation"><X size={19}/></button></div><p className="sidebar-caption">MARINE INTELLIGENCE</p><nav>{navigation.map(item=>{const Icon=item.icon;const active=path===item.href||path.startsWith(`${item.href}/`);return <Link onClick={onClose} className={`side-link ${active?"active":""}`} href={item.href} key={item.href}><Icon size={18}/><span>{item.label}</span>{item.label==="Safety Alerts"&&alertCount>0&&<i className="alert-count">{alertCount}</i>}</Link>;})}</nav><div className="sidebar-bottom"><SystemStatusIndicator/><UserProfile/></div></aside>;
}

export function AppShell({children}:{children:ReactNode}){
  const [open,setOpen]=useState(false);
  const [dismissed,setDismissed]=useState<Set<string>>(()=>new Set());
  const {user}=useAuth();
  const shared=useSharedSelectedLocation();
  const location=shared??(user?.default_latitude!=null&&user.default_longitude!=null?{latitude:user.default_latitude,longitude:user.default_longitude,source:"default" as const,label:"Profile Default Location"}:null);
  const alertData=useAlerts(location,100,true);
  const urgent=useMemo(()=>selectUrgentAlert(alertData.data?.alerts??[]),[alertData.data]);
  const storedDismissal=urgent&&typeof window!=="undefined"?window.localStorage.getItem(`orca-alert-dismissed:${urgent.id}`):null;
  const dismiss=()=>{if(!urgent)return;window.localStorage.setItem(`orca-alert-dismissed:${urgent.id}`,urgent.id);setDismissed(current=>new Set(current).add(urgent.id));};
  const showBanner=urgent&&!dismissed.has(urgent.id)&&storedDismissal!==urgent.id;
  return <div className="app-shell"><div className={`drawer-overlay ${open?"visible":""}`} onClick={()=>setOpen(false)}/><div className={`drawer ${open?"open":""}`}><Sidebar alertCount={alertData.data?.alerts.length} onClose={()=>setOpen(false)}/></div><div className="desktop-sidebar"><Sidebar alertCount={alertData.data?.alerts.length}/></div><main className="app-main"><header className="app-header"><div className="header-location"><button className="mobile-only icon-button" onClick={()=>setOpen(true)} aria-label="Open navigation"><Menu size={20}/></button><span className="location-icon"><Navigation size={15}/></span><div><strong>{location?.label??"No location selected"}</strong><small>{location?`${formatCoordinate(location.latitude,"latitude")} · ${formatCoordinate(location.longitude,"longitude")}`:"Use Map or set a profile default"}</small></div></div><div className="header-tools"><DataFreshnessBadge><Clock3 size={12}/>{location?`Location: ${location.source}`:"Forecast idle"}</DataFreshnessBadge><button className="language">EN <ChevronDown size={13}/></button><button className="icon-button" aria-label="Notifications"><Bell size={18}/>{!!alertData.data?.alerts.length&&<i/>}</button><span className="avatar">LM</span></div></header>{showBanner&&<div className="alert-banner"><ShieldAlert size={17}/><strong>{urgent.source_type==="DEMO"?"DEMO DATA — ":""}{urgent.type.replaceAll("_"," ")} advisory active</strong><span>{urgent.affected_area??"See official advisory details."}</span><Link href={`/alerts/${urgent.id}`}>View alert</Link>{urgent.geometry&&<Link href={`/map?alert=${urgent.id}`}>View on map</Link>}<button onClick={dismiss}>Dismiss</button></div>}{children}</main></div>;
}
