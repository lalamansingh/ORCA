import test from "node:test";
import assert from "node:assert/strict";

const VOICE_LOCALES: Record<string, string> = {
  hi: "hi-IN",
  ta: "ta-IN",
  te: "te-IN",
  ml: "ml-IN",
  gu: "gu-IN",
  mr: "mr-IN",
  bn: "bn-IN",
  kn: "kn-IN",
  or: "or-IN",
  en: "en-IN",
};

test("all 10 languages map to valid BCP-47 voice codes", () => {
  assert.equal(VOICE_LOCALES["hi"], "hi-IN");
  assert.equal(VOICE_LOCALES["ta"], "ta-IN");
  assert.equal(VOICE_LOCALES["gu"], "gu-IN");
});
