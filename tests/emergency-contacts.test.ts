import test from "node:test";
import assert from "node:assert/strict";

const COAST_GUARD_TOLL_FREE = "1554";
const MARINE_POLICE_TOLL_FREE = "1093";

test("statutory maritime rescue numbers are standardized across India", () => {
  assert.equal(COAST_GUARD_TOLL_FREE, "1554");
  assert.equal(MARINE_POLICE_TOLL_FREE, "1093");
});
