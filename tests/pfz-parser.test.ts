import test from "node:test";
import assert from "node:assert/strict";

function parseDistanceKm(distStr: string): number {
  const match = distStr.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 15.0;
}

test("pfz distance string parses accurately", () => {
  assert.equal(parseDistanceKm("18.5 km from coast"), 18.5);
  assert.equal(parseDistanceKm("24 km"), 24);
  assert.equal(parseDistanceKm("invalid"), 15.0);
});
