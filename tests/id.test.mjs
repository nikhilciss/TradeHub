import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { createId } from "../src/utils/id.js";
test("uses native UUID generation when available", () => {
  assert.equal(createId({ randomUUID: () => "native-id" }), "native-id");
});
test("LAN HTTP fallback generates distinct valid UUID v4 identifiers without randomUUID", () => {
  const lanCrypto = {
    getRandomValues: (bytes) => webcrypto.getRandomValues(bytes),
  };
  const ids = Array.from({ length: 1000 }, () => createId(lanCrypto));
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids)
    assert.match(
      id,
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
});
