import test from "node:test";
import assert from "node:assert/strict";

function calculateFuelLitres(distKm: number, ratePerKm = 0.55): number {
  return parseFloat((distKm * ratePerKm).toFixed(1));
}

test("fuel calculation produces deterministic values", () => {
  assert.equal(calculateFuelLitres(20), 11.0);
  assert.equal(calculateFuelLitres(50), 27.5);
});
