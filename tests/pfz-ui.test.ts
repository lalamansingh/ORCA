import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
test("PFZ UI uses API-backed data and live map source",()=>{const card=readFileSync("src/components/marine-components.tsx","utf8");const map=readFileSync("src/components/marine-map.tsx","utf8");assert.match(card,/PFZCard\(\{data,loading,error\}/);assert.match(map,/orca-pfz-live/);});
