import test from "node:test";
import assert from "node:assert/strict";

function pointInPolygon(point: [number, number], vs: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

test("ray casting identifies point inside restricted box", () => {
  const poly: [number, number][] = [[0,0], [10,0], [10,10], [0,10]];
  assert.equal(pointInPolygon([5,5], poly), true);
  assert.equal(pointInPolygon([15,15], poly), false);
});
