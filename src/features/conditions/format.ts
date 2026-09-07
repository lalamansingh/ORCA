import type { Measurement } from "@/features/conditions/types";

export function degreesToCompass(degrees:number|null|undefined):string {
  if(degrees==null||!Number.isFinite(degrees))return "—";
  const labels=["N","NE","E","SE","S","SW","W","NW"];
  return labels[Math.round((((degrees%360)+360)%360)/45)%8];
}
export const formatMeasurement=(measurement:Measurement|null|undefined,digits=1)=>measurement?`${measurement.value.toFixed(digits)} ${measurement.unit}`:"Unavailable";
export function updatedAgo(iso:string):string {const minutes=Math.max(0,Math.floor((Date.now()-new Date(iso).getTime())/60_000));return minutes<1?"Updated just now":minutes===1?"Updated 1 min ago":`Updated ${minutes} min ago`;}
export function forecastTime(iso:string,timezone:string):string {try{return new Intl.DateTimeFormat(undefined,{hour:"2-digit",minute:"2-digit",timeZone:timezone==="auto"?undefined:timezone}).format(new Date(iso));}catch{return new Intl.DateTimeFormat(undefined,{hour:"2-digit",minute:"2-digit"}).format(new Date(iso));}}
