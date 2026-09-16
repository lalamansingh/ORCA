import test from "node:test";
import assert from "node:assert/strict";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

test("haversine distance calculates accurate marine baseline", () => {
  const dist = haversineKm(18.92, 72.83, 18.98, 72.95);
  assert.ok(dist > 12 && dist < 16, `Expected distance ~14km, got ${dist}`);
});
