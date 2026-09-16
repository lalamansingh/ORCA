import test from "node:test";
import assert from "node:assert/strict";

function isSSTFavorableForTuna(sstDegC: number): boolean {
  return sstDegC >= 27.0 && sstDegC <= 29.8;
}

test("optimal SST band validates pelagic fishing suitability", () => {
  assert.equal(isSSTFavorableForTuna(28.5), true);
  assert.equal(isSSTFavorableForTuna(24.0), false);
  assert.equal(isSSTFavorableForTuna(31.5), false);
});
