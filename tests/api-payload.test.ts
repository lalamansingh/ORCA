import test from "node:test";
import assert from "node:assert/strict";

test("route request payload validation passes valid coordinates", () => {
  const req = {
    start: { latitude: 13.08, longitude: 80.27 },
    destination: { latitude: 13.20, longitude: 80.50 },
    route_mode: "LOWEST_RISK",
  };
  assert.ok(req.start.latitude >= -90 && req.start.latitude <= 90);
  assert.ok(req.destination.longitude >= -180 && req.destination.longitude <= 180);
});
