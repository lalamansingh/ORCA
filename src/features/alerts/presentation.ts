import type { AlertSeverity, AlertStatus, AlertType, MarineAlert } from "@/features/alerts/types";

export type AlertSection="ACTIVE"|"UPCOMING"|"RECENT";

export function filterAlerts(alerts:MarineAlert[],section:AlertSection,type:AlertType|"ALL",severity:AlertSeverity|"ALL",source:string):MarineAlert[]{
  const statuses:AlertStatus[]=section==="ACTIVE"?["ACTIVE"]:section==="UPCOMING"?["UPCOMING"]:["EXPIRED","CANCELLED"];
  return alerts.filter(alert=>statuses.includes(alert.status)&&(type==="ALL"||alert.type===type)&&(severity==="ALL"||alert.severity===severity)&&(source==="ALL"||alert.provider===source));
}

export function selectUrgentAlert(alerts:MarineAlert[]):MarineAlert|null{
  const priority:Record<AlertSeverity,number>={INFO:0,WATCH:1,WARNING:2,SEVERE:3,CRITICAL:4};
  return alerts.filter(alert=>alert.status==="ACTIVE"&&priority[alert.severity]>=priority.SEVERE).sort((left,right)=>priority[right.severity]-priority[left.severity])[0]??null;
}

export function alertUiState(status:"complete"|"partial"|"unavailable"|null,error:boolean,activeCount:number):"active"|"no_active"|"partial"|"unavailable"{
  if(error||status==="unavailable")return "unavailable";
  if(activeCount>0)return status==="partial"?"partial":"active";
  return "no_active";
}
