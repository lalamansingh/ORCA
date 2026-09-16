import test from "node:test";
import assert from "node:assert/strict";

function estimateVoyageMinutes(distKm: number, speedKnots: number = 12): number {
  const speedKmh = speedKnots * 1.852;
  return Math.max(5, Math.round((distKm / speedKmh) * 60));
}

test("voyage duration estimation is reasonable for 20km", () => {
  const duration = estimateVoyageMinutes(22.22, 12);
  assert.equal(duration, 60);
});
