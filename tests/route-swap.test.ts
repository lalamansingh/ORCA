import test from "node:test";
import assert from "node:assert/strict";

function swapWaypoints<T>(ptA: T, ptB: T): [T, T] {
  return [ptB, ptA];
}

test("route direction swap inverts start and destination correctly", () => {
  const [start, end] = swapWaypoints("Mumbai", "Goa");
  assert.equal(start, "Goa");
  assert.equal(end, "Mumbai");
});
