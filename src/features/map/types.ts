export type LocationSource="gps"|"map"|"saved"|"default";
export interface SelectedLocation{latitude:number;longitude:number;source:LocationSource;label?:string;accuracy?:number;timestamp?:number}
export type MarineLayerId="pfz"|"sst"|"chlorophyll"|"waves"|"currents"|"weather"|"alerts"|"boundaries"|"restricted"|"protected"|"route"|"saved"|"ais";
export type LayerStatus="LIVE"|"PARTIAL"|"DEMO"|"NOT_CONNECTED"|"UNAVAILABLE";
export interface MarineMapLayer{id:MarineLayerId;name:string;description:string;category:string;enabled:boolean;available:boolean;dataStatus:LayerStatus;legend:string;source:string;color:string}
export type MapAction={type:"focus_location";latitude:number;longitude:number;zoom?:number}|{type:"show_layer";layer:MarineLayerId}|{type:"highlight_feature";featureId:string};
export interface MapFeatureDetails{id:string;title:string;type:string;status:string;source:string;updated:string;coordinates:string;properties:Record<string,string>}
