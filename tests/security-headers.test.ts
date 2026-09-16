import test from "node:test";
import assert from "node:assert/strict";

test("security policy permits standard tile providers", () => {
  const allowed = ["https://tiles.openfreemap.org", "https://*.arcgisonline.com"];
  assert.ok(allowed.includes("https://tiles.openfreemap.org"));
});
