import test from "node:test";
import assert from "node:assert/strict";

function degreesToCompass16(deg: number): string {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  const val = Math.round(((deg % 360) / 22.5));
  return dirs[(val % 16 + 16) % 16];
}

test("bearing converts correctly to 16 cardinal directions", () => {
  assert.equal(degreesToCompass16(0), "N");
  assert.equal(degreesToCompass16(90), "E");
  assert.equal(degreesToCompass16(180), "S");
  assert.equal(degreesToCompass16(270), "W");
  assert.equal(degreesToCompass16(225), "SW");
});
