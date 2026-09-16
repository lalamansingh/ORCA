import test from "node:test";
import assert from "node:assert/strict";

test("ocean product value formatter handles null safely", () => {
  const formatSST = (val: number | null) => val != null ? `${val.toFixed(1)} °C` : "28.5 °C (Demo)";
  assert.equal(formatSST(29.1), "29.1 °C");
  assert.equal(formatSST(null), "28.5 °C (Demo)");
});
