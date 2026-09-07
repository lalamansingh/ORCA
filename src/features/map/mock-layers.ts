import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import type { MarineMapLayer } from "@/features/map/types";
export const marineLayers:MarineMapLayer[]=[
{id:"pfz",name:"Potential Fishing Zones",description:"Development polygon for map interaction.",category:"Fishing",enabled:true,available:true,dataStatus:"DEMO",legend:"Demo PFZ",source:"ORCA development fixture",color:"#16a085"},
{id:"sst",name:"Sea Surface Temperature",description:"Provider integration pending.",category:"Ocean",enabled:false,available:false,dataStatus:"NOT_CONNECTED",legend:"",source:"Not connected",color:"#e27841"},
{id:"chlorophyll",name:"Chlorophyll",description:"Provider integration pending.",category:"Ocean",enabled:false,available:false,dataStatus:"NOT_CONNECTED",legend:"",source:"Not connected",color:"#79a951"},
{id:"waves",name:"Wave Conditions",description:"Provider integration pending.",category:"Ocean",enabled:false,available:false,dataStatus:"NOT_CONNECTED",legend:"",source:"Not connected",color:"#22b8cf"},
{id:"currents",name:"Ocean Currents",description:"Provider integration pending.",category:"Ocean",enabled:false,available:false,dataStatus:"NOT_CONNECTED",legend:"",source:"Not connected",color:"#6b7dc4"},
{id:"weather",name:"Weather",description:"Provider integration pending.",category:"Weather & Safety",enabled:false,available:false,dataStatus:"NOT_CONNECTED",legend:"",source:"Not connected",color:"#6495bd"},
{id:"alerts",name:"Marine Alerts",description:"Development hazard area.",category:"Weather & Safety",enabled:true,available:true,dataStatus:"DEMO",legend:"Demo alert",source:"ORCA development fixture",color:"#d95d16"},
{id:"boundaries",name:"International Boundaries",description:"No authoritative provider connected.",category:"Boundaries",enabled:false,available:false,dataStatus:"NOT_CONNECTED",legend:"",source:"Not connected",color:"#8c7ac5"},
{id:"restricted",name:"Restricted Waters",description:"Development polygon only.",category:"Boundaries",enabled:true,available:true,dataStatus:"DEMO",legend:"Demo restricted area",source:"ORCA development fixture",color:"#c53030"},
{id:"protected",name:"Marine Protected Areas",description:"No provider connected.",category:"Boundaries",enabled:false,available:false,dataStatus:"NOT_CONNECTED",legend:"",source:"Not connected",color:"#3a9b78"},
{id:"route",name:"Demo Route",description:"Illustrative route; no optimization applied.",category:"Navigation",enabled:true,available:true,dataStatus:"DEMO",legend:"Demo route",source:"ORCA development fixture",color:"#f6c452"},
{id:"saved",name:"Saved Locations",description:"Your explicitly saved locations.",category:"Navigation",enabled:true,available:true,dataStatus:"DEMO",legend:"Saved location",source:"Your ORCA account",color:"#117ea6"},];
export const demoFeatures:FeatureCollection<Geometry,GeoJsonProperties>={type:"FeatureCollection",features:[
{type:"Feature",properties:{id:"demo-pfz-01",layer:"pfz",title:"Demo Potential Fishing Zone",type:"Potential Fishing Zone",status:"Demo Data",confidence:"High",source:"ORCA development fixture",updated:"Development fixture"},geometry:{type:"Polygon",coordinates:[[[80.34,13],[80.38,13],[80.38,13.04],[80.34,13.04],[80.34,13]]]}},
{type:"Feature",properties:{id:"demo-alert-01",layer:"alerts",title:"Demo High-Wave Area",type:"Marine alert",status:"Demo Data",severity:"Moderate",source:"ORCA development fixture",updated:"Development fixture"},geometry:{type:"Polygon",coordinates:[[[80.29,13.05],[80.33,13.05],[80.33,13.09],[80.29,13.09],[80.29,13.05]]]}},
{type:"Feature",properties:{id:"demo-restricted-01",layer:"restricted",title:"Demo Restricted Area",type:"Restricted water",status:"Demo Data",source:"ORCA development fixture",updated:"Development fixture"},geometry:{type:"Polygon",coordinates:[[[80.22,13.02],[80.26,13.02],[80.26,13.06],[80.22,13.06],[80.22,13.02]]]}},
{type:"Feature",properties:{id:"demo-route-01",layer:"route",title:"Demo Route",type:"Route",status:"Demo Data",distance:"22.6 km",source:"ORCA development fixture",updated:"Development fixture"},geometry:{type:"LineString",coordinates:[[80.27,13.08],[80.31,13.06],[80.36,13.02]]}},
]};
