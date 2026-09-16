import test from "node:test";
import assert from "node:assert/strict";

interface Alert { id: string; severity: "RED" | "ORANGE" | "YELLOW"; }

function pickTopAlert(alerts: Alert[]): Alert | null {
  const order = { RED: 3, ORANGE: 2, YELLOW: 1 };
  return [...alerts].sort((a, b) => order[b.severity] - order[a.severity])[0] || null;
}

test("red alert takes priority over yellow alert", () => {
  const top = pickTopAlert([{ id: "1", severity: "YELLOW" }, { id: "2", severity: "RED" }]);
  assert.equal(top?.id, "2");
});
