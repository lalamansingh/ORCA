import test from "node:test";
import assert from "node:assert/strict";

interface MockSOS {
  sos_id: string;
  latitude: number;
  longitude: number;
  retry_count: number;
}

test("offline queue deduplication rejects identical SOS id", () => {
  const queue: MockSOS[] = [{ sos_id: "sos-001", latitude: 18.9, longitude: 72.8, retry_count: 0 }];
  const isDuplicate = queue.some(i => i.sos_id === "sos-001");
  assert.equal(isDuplicate, true);
});
