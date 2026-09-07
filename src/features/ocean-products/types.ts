export type OceanStatus="CURRENT"|"RECENT"|"STALE"|"EXPIRED"|"UNAVAILABLE"|"NOT_CONNECTED"|"DEMO";
export interface OceanMetadata {product:"SEA_SURFACE_TEMPERATURE"|"CHLOROPHYLL_A";status:OceanStatus;provider:string;dataset:string;units:string;valid_time:string|null;retrieved_at:string;spatial_resolution:string|null;quality_notes:string|null;map_access:{kind?:string;opacity_default?:number;log_scale?:boolean};}
export interface OceanSample {product:string;value:number|null;unit:string;status:OceanStatus;quality:string;valid_time:string|null;retrieved_at:string;provider:string;sample_method:string;}
export interface OceanSampleResponse {location:{latitude:number;longitude:number};samples:Record<string,OceanSample>}
