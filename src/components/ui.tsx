import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, CircleAlert, Database, WifiOff } from "lucide-react";
import type { Evidence, RiskLevel } from "@/types";

export function DemoDataBadge({ label = "Demo Data" }: { label?: string }) { return <span className="demo-badge">{label}</span>; }
export function RiskBadge({ level }: { level: RiskLevel }) { const labels: Record<RiskLevel,string>={safe:"Low Risk",moderate:"Moderate Risk",high:"High Risk",critical:"Critical"}; return <span className={`risk-badge ${level}`}>{labels[level]}</span>; }
export function DataFreshnessBadge({ children = "Updated 5 min ago" }: { children?: ReactNode }) { return <span className="freshness"><Database size={12}/>{children}</span>; }
export function SourceBadge({ children }: { children: ReactNode }) { return <span className="source-badge">{children}</span>; }
export function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow?: string; title:string; subtitle?:string; action?:ReactNode }) { return <header className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</header>; }
export function StateBox({ kind = "empty", title, detail }: { kind?:"empty"|"loading"|"error"|"unavailable"; title:string; detail:string }) { const Icon=kind==="error"?CircleAlert:kind==="unavailable"?WifiOff:kind==="loading"?Database:CheckCircle2;return <div className="state-box"><Icon size={21}/><strong>{title}</strong><span>{detail}</span></div>; }
export function EvidenceItem({ item }: { item: Evidence }) { return <div className="evidence-item"><div><strong>{item.parameter}</strong><span>{item.value}</span></div><div><SourceBadge>{item.source}</SourceBadge><small>{item.updated}</small></div></div>; }
export function EvidencePanel({ items }: { items: Evidence[] }) { return <details className="evidence-panel"><summary><span><AlertTriangle size={16}/>Why this recommendation?</span><span className="summary-hint">Evidence & freshness</span></summary><div>{items.map(item=><EvidenceItem item={item} key={item.parameter}/>)}</div></details>; }
