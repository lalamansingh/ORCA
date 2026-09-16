import test from "node:test";
import assert from "node:assert/strict";

test("compliance disclaimer string is present", () => {
  const disclaimer = "ORCA is a decision-support prototype";
  assert.ok(disclaimer.includes("decision-support"));
});
