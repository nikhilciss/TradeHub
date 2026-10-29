import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createCompany } from "../src/services/companyService.js";
import { validateSnapshot } from "../src/services/domain.js";
const seed = JSON.parse(fs.readFileSync("src/data/seed.json"));
const admin = seed.users.find((u) => u.role === "admin");
const record = {
  id: "new-company",
  name: "New company",
  code: " de-2001 ",
  tier: "Silver",
  discount: 5,
  approvalThreshold: 1000,
  creditLimit: 5000,
  city: "Berlin",
  country: "DE",
  active: true,
  billingAddress: { street: "Demo street 1", postalCode: "10115" },
};
test("company creation initializes isolated data and valid checkout addresses", () => {
  const s = createCompany(seed, admin, record);
  const c = s.companies.at(-1);
  assert.equal(c.code, "DE-2001");
  assert.deepEqual(s.carts[c.id], []);
  assert.deepEqual(s.favorites[c.id], []);
  assert.equal(c.addresses[0].city, "Berlin");
  assert.equal(c.billingAddress.country, "DE");
  assert.equal(
    validateSnapshot(JSON.parse(JSON.stringify(s))).companies.length,
    seed.companies.length + 1,
  );
  assert.deepEqual(s.carts.c1, seed.carts.c1);
  assert.throws(
    () => createCompany(s, admin, { ...record, id: "another" }),
    /code already/,
  );
});
test("company creation rejects invalid fields and unauthorized users", () => {
  assert.throws(() => createCompany(seed, seed.users[0], record), /permission/);
  for (const invalid of [
    { name: "" },
    { discount: 101 },
    { creditLimit: -1 },
    { billingAddress: {} },
    { country: "unknown" },
  ])
    assert.throws(() => createCompany(seed, admin, { ...record, ...invalid }));
});
