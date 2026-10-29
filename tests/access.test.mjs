import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  companiesForUser,
  resolveCompany,
  authenticateDemo,
  enterCompany,
  updateMembership,
  safeStoreDestination,
  saveCustomerAccount,
} from "../src/services/accessService.js";
import {
  placeOrder,
  priceFor,
  validateSnapshot,
} from "../src/services/domain.js";
import {
  suggestOrderLines,
  searchByDescription,
} from "../src/services/assistedOrderService.js";
const seed = JSON.parse(fs.readFileSync("src/data/seed.json"));
const fresh = () => structuredClone(seed);
test("customer login resolves email case-insensitively and excludes internal credentials", () => {
  assert.equal(
    authenticateDemo(seed, "BUYER@DEMO.TRADEHUB", "Demo@123").id,
    "u1",
  );
  assert.throws(() =>
    authenticateDemo(seed, "admin@demo.tradehub", "Admin@123"),
  );
  assert.throws(() =>
    authenticateDemo(seed, "buyer@demo.tradehub", "Demo@123", true),
  );
  assert.equal(
    authenticateDemo(seed, "admin@demo.tradehub", "Admin@123", true).id,
    "u3",
  );
});
test("only associated active companies are available and there is no fallback selection", () => {
  const s = fresh(),
    buyer = s.users.find((u) => u.id === "u1");
  assert.deepEqual(
    companiesForUser(s, buyer).map((m) => m.company.id),
    ["c1", "c2"],
  );
  assert.equal(resolveCompany(s, buyer, ""), null);
  assert.throws(() => enterCompany(s, buyer, "c5"));
  s.companies.find((c) => c.id === "c2").active = false;
  assert.deepEqual(
    companiesForUser(s, buyer).map((m) => m.company.id),
    ["c1"],
  );
});
test("company roles and disabling membership do not affect another company", () => {
  let s = fresh();
  const manager = s.users.find((u) => u.id === "u2");
  assert.equal(resolveCompany(s, manager, "c1").role, "customer_admin");
  assert.equal(resolveCompany(s, manager, "c2").role, "buyer");
  s = updateMembership(s, "u2", "c1", { active: false });
  assert.equal(
    resolveCompany(
      s,
      s.users.find((u) => u.id === "u2"),
      "c1",
    ),
    null,
  );
  assert.equal(
    resolveCompany(
      s,
      s.users.find((u) => u.id === "u2"),
      "c2",
    ).role,
    "buyer",
  );
});
test("checkout is company-scoped and preserves the other company cart", () => {
  let s = fresh();
  s.carts.c1 = [{ productId: "p1", qty: 2 }];
  s.carts.c2 = [{ productId: "p1", qty: 3 }];
  s = placeOrder(s, "c2", "u1", "PO-c2", "");
  assert.equal(s.orders[0].companyId, "c2");
  assert.equal(
    s.orders[0].items[0].unitPrice,
    priceFor(s.products[0], s.companies[1]),
  );
  assert.equal(s.carts.c2.length, 0);
  assert.equal(s.carts.c1[0].qty, 2);
  s.carts.c5 = [{ productId: "p1", qty: 1 }];
  assert.throws(() => placeOrder(s, "c5", "u1", "", ""), /access/);
});
test("snapshot validates company assignments and retains them through export/import", () => {
  assert.deepEqual(
    validateSnapshot(seed).users[0].memberships,
    seed.users[0].memberships,
  );
  const s = fresh();
  s.users[0].memberships.push({
    companyId: "unknown",
    role: "buyer",
    active: true,
  });
  assert.throws(() => validateSnapshot(s), /membership/);
});
test("return destination cannot bypass storefront or point to an external site", () => {
  assert.equal(
    safeStoreDestination("/store/products/p1"),
    "/store/products/p1",
  );
  for (const path of [
    "https://example.com",
    "//example.com",
    "/admin",
    "/store/../admin",
  ])
    assert.equal(safeStoreDestination(path), "/store");
});
test("assisted order suggestions combine matches and report unknown or missing quantities", () => {
  const result = suggestOrderLines(
    "PNE-3201 x 3 and PNE-3201 qty 2; FAS-3201,4; UNKNOWN-999 x 1; ELE-3201",
    seed.products,
  );
  assert.equal(result.items.find((i) => i.productId === "p1").qty, 5);
  assert.equal(result.items.find((i) => i.productId === "p10").qty, 4);
  assert.equal(result.warnings.length, 2);
  assert.equal(
    suggestOrderLines("PNE-3201 x 1.5", seed.products).items.length,
    0,
  );
});
test("description search uses actual products and returns no invented items", () => {
  const found = searchByDescription("I need a torque wrench", seed.products);
  assert.ok(found.some((p) => p.name === "Torque wrench"));
  assert.equal(searchByDescription("zzzzunknown", seed.products).length, 0);
});

test("admin creates customer with multiple memberships and company-specific roles", () => {
  const actor = seed.users.find((u) => u.role === "admin");
  const record = {
    id: "new-buyer",
    name: " New buyer ",
    email: " NEW@DEMO.TRADEHUB ",
    password: "Demo@123",
    active: true,
    memberships: [
      { companyId: "c1", role: "buyer", active: true },
      { companyId: "c2", role: "customer_admin", active: true },
    ],
  };
  let s = saveCustomerAccount(seed, actor, record);
  let u = s.users.find((u) => u.id === record.id);
  assert.equal(u.email, "new@demo.tradehub");
  assert.equal(companiesForUser(s, u).length, 2);
  assert.equal(resolveCompany(s, u, "c2").role, "customer_admin");
  assert.deepEqual(
    validateSnapshot(s).users.find((x) => x.id === u.id).memberships,
    u.memberships,
  );
  s = saveCustomerAccount(s, actor, {
    ...u,
    memberships: [{ companyId: "c2", role: "buyer", active: true }],
  });
  u = s.users.find((x) => x.id === u.id);
  assert.equal(u.companyId, "c2");
  assert.equal(resolveCompany(s, u, "c1"), null);
  assert.throws(
    () => saveCustomerAccount(s, actor, { ...record, id: "duplicate" }),
    /Email already exists/,
  );
  assert.throws(
    () => saveCustomerAccount(seed, actor, { ...record, memberships: [] }),
    /at least one/,
  );
  assert.throws(
    () => saveCustomerAccount(seed, seed.users[0], record),
    /permission/,
  );
  assert.throws(
    () =>
      saveCustomerAccount(seed, actor, {
        ...record,
        memberships: [{ companyId: "missing", role: "buyer", active: true }],
      }),
    /Invalid/,
  );
});
