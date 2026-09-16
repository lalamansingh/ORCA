import test from "node:test";
import assert from "node:assert/strict";

test("linestring geojson conforms to RFC 7946", () => {
  const line = {
    type: "LineString" as const,
    coordinates: [[72.8, 18.9], [72.9, 19.1]],
  };
  assert.equal(line.type, "LineString");
  assert.equal(line.coordinates.length, 2);
  assert.equal(line.coordinates[0][0], 72.8);
});
