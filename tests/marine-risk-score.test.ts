import test from "node:test";
import assert from "node:assert/strict";

function evaluateRisk(waveHeightM: number, windSpeedKmh: number): "LOW" | "MODERATE" | "HIGH" {
  if (waveHeightM > 2.5 || windSpeedKmh > 45) return "HIGH";
  if (waveHeightM > 1.4 || windSpeedKmh > 25) return "MODERATE";
  return "LOW";
}

test("marine risk thresholds categorize sea states safely", () => {
  assert.equal(evaluateRisk(0.8, 14), "LOW");
  assert.equal(evaluateRisk(1.6, 28), "MODERATE");
  assert.equal(evaluateRisk(3.0, 50), "HIGH");
});
