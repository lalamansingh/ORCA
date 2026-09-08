import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("assistant uses authenticated conversation service and real completed activity",()=>{const page=readFileSync("src/app/(platform)/assistant/page.tsx","utf8");assert.match(page,/sendMessage/);assert.match(page,/step_results/);assert.match(page,/Source evidence/);assert.doesNotMatch(page,/dangerouslySetInnerHTML|setInterval/);});
