import type { SelectedLocation } from "@/features/map/types";
export const validCoordinates=(latitude:number,longitude:number)=>Number.isFinite(latitude)&&Number.isFinite(longitude)&&latitude>=-90&&latitude<=90&&longitude>=-180&&longitude<=180;
export const formatCoordinate=(value:number,axis:"latitude"|"longitude")=>`${Math.abs(value).toFixed(4)}° ${axis==="latitude"?(value>=0?"N":"S"):(value>=0?"E":"W")}`;
export const locationLabel=(location:SelectedLocation)=>location.label??(location.source==="gps"?"Your Location":location.source==="map"?"Selected Location":location.source==="saved"?"Saved Location":"Default Location");
