import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("assistant exposes structured planning without tool execution",()=>{const page=readFileSync("src/app/(platform)/assistant/page.tsx","utf8");assert.match(page,/Validated extraction and execution plan/);assert.match(page,/No tools executed/);assert.match(page,/NODE_ENV!=="production"/);assert.doesNotMatch(page,/chain-of-thought/i);});
