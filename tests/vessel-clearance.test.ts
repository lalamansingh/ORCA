import test from "node:test";
import assert from "node:assert/strict";

function hasSafeUnderKeelClearance(chartDepthM: number, vesselDraftM: number, minMarginM = 1.0): boolean {
  return (chartDepthM - vesselDraftM) >= minMarginM;
}

test("under keel clearance ensures navigation safety", () => {
  assert.equal(hasSafeUnderKeelClearance(4.5, 2.0), true);
  assert.equal(hasSafeUnderKeelClearance(2.5, 2.0), false);
});
