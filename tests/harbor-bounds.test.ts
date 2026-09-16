import test from "node:test";
import assert from "node:assert/strict";

const HARBORS = [
  { name: "Chennai", lat: 13.08, lon: 80.27 },
  { name: "Mumbai", lat: 18.92, lon: 72.83 },
  { name: "Kochi", lat: 9.93, lon: 76.26 },
];

test("harbor coordinates fall within Indian territorial waters", () => {
  for (const h of HARBORS) {
    assert.ok(h.lat >= 8 && h.lat <= 24, `${h.name} lat invalid`);
    assert.ok(h.lon >= 68 && h.lon <= 90, `${h.name} lon invalid`);
  }
});
