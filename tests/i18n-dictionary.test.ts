import test from "node:test";
import assert from "node:assert/strict";

const testMap: Record<string, Record<string, string>> = {
  hi: { routeTab: "रूट", statusTab: "स्थिति" },
  en: { routeTab: "Route", statusTab: "Status" },
};

test("i18n dictionary provides fallback on missing key", () => {
  const getTrans = (lang: string, key: string) => testMap[lang]?.[key] ?? testMap["en"]?.[key] ?? key;
  assert.equal(getTrans("hi", "routeTab"), "रूट");
  assert.equal(getTrans("fr", "routeTab"), "Route");
});
