import test from "node:test";
import assert from "node:assert/strict";
import {
  translate,
  defaultLanguage,
  supportedLanguages,
} from "../src/utils/i18n.js";
test("German is the default with English as the alternative", () => {
  assert.equal(defaultLanguage, "de");
  assert.deepEqual(supportedLanguages, ["en", "de"]);
  for (const key of [
    "Business customer login",
    "Quick order",
    "Choose your company",
    "Add to cart",
    "Save user & assignments",
    "Category management",
    "Requested quantity exceeds available stock.",
  ])
    assert.notEqual(translate("de", key), key);
  assert.equal(translate("en", "Quick order"), "Quick order");
  assert.equal(translate("de", "Quick order"), "Schnellbestellung");
  assert.equal(translate("nl", "Customer GmbH"), "Customer GmbH");
});
