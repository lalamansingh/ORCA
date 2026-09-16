import test from "node:test";
import assert from "node:assert/strict";

function formatTideLevel(levelM: number): string {
  return `${levelM.toFixed(1)} m`;
}

test("tide level formats cleanly with single decimal", () => {
  assert.equal(formatTideLevel(0.62), "0.6 m");
  assert.equal(formatTideLevel(1.48), "1.5 m");
});
