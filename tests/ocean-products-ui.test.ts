import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("ocean layers and product card are explicitly demo-labelled",()=>{const layers=readFileSync("src/features/map/mock-layers.ts","utf8");const card=readFileSync("src/components/ocean-productivity-card.tsx","utf8");assert.match(layers,/DEMO SST grid/);assert.match(layers,/Chlorophyll-a/);assert.match(card,/not a fish-availability prediction/);});
