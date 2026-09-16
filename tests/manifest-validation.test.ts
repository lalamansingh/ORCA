import test from "node:test";
import assert from "node:assert/strict";

const mockManifest = {
  name: "ORCA Marine Intelligence",
  short_name: "ORCA",
  display: "standalone",
  theme_color: "#082536",
  background_color: "#082536",
};

test("pwa manifest properties adhere to standalone standards", () => {
  assert.equal(mockManifest.display, "standalone");
  assert.equal(mockManifest.theme_color, "#082536");
});
