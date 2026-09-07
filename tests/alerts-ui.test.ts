import assert from "node:assert/strict";
import test from "node:test";
import { alertUiState, filterAlerts, selectUrgentAlert } from "../src/features/alerts/presentation.ts";
import type { MarineAlert } from "../src/features/alerts/types.ts";

const base={id:"1",external_id:"x",type:"HIGH_WAVES",severity:"WARNING",title:"Alert",summary:null,description:null,affected_area:null,geometry:null,latitude:null,longitude:null,radius_km:null,forecast_track:null,forecast_points:[],valid_from:null,valid_until:null,issued_at:null,updated_at:null,retrieved_at:"2026-09-07T00:00:00Z",source:"Authority",source_url:null,provider:"IMD CAP",status:"ACTIVE",source_type:"OFFICIAL_ADVISORY",instructions:[],evidence:{source:"Authority",bulletin:null,issued_at:null,valid_from:null,valid_until:null,retrieved_at:"2026-09-07T00:00:00Z",provider_url:null},metadata:{},cyclone:null,created_at:null,distance_km:null,is_inside:null,nearest_point:null,freshness:"CURRENT"} satisfies MarineAlert;

test("no-alert and unavailable UI states remain distinct",()=>{assert.equal(alertUiState("complete",false,0),"no_active");assert.equal(alertUiState("unavailable",false,0),"unavailable");assert.equal(alertUiState(null,true,0),"unavailable");});
test("alert filters separate active and expired records",()=>{const expired={...base,id:"2",status:"EXPIRED" as const};assert.deepEqual(filterAlerts([base,expired],"ACTIVE","ALL","ALL","ALL").map(item=>item.id),["1"]);assert.deepEqual(filterAlerts([base,expired],"RECENT","ALL","ALL","ALL").map(item=>item.id),["2"]);});
test("critical current alert wins the notification banner",()=>{const severe={...base,id:"2",severity:"SEVERE" as const};const critical={...base,id:"3",severity:"CRITICAL" as const};assert.equal(selectUrgentAlert([severe,critical])?.id,"3");assert.equal(selectUrgentAlert([base]),null);});
