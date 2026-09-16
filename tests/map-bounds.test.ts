import test from "node:test";
import assert from "node:assert/strict";

function computeBounds(coords: [number, number][]): { minLon: number; maxLon: number; minLat: number; maxLat: number } {
  const lons = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);
  return {
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  };
}

test("bounding box calculation covers all route coordinates", () => {
  const bounds = computeBounds([[72.8, 18.9], [73.2, 19.4]]);
  assert.equal(bounds.minLon, 72.8);
  assert.equal(bounds.maxLat, 19.4);
});
