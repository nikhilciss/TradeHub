import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  priceFor,
  parseCSV,
  mergeItems,
  placeOrder,
  validateSnapshot,
} from "../src/services/domain.js";
import { migrateState } from "../src/services/migration.js";
import {
  saveCategory,
  removeCategory,
  categoryIds,
  categoryVisible,
  saveProduct,
  removeProduct,
  productVisible,
  quantityIssue,
} from "../src/services/catalogService.js";
import {
  runSync,
  queueOrder,
  safeConnection,
} from "../src/services/odooService.js";
const seed = JSON.parse(
  fs.readFileSync(new URL("../src/data/seed.json", import.meta.url)),
);
const legacy = JSON.parse(
  fs.readFileSync(new URL("./fixtures/seed-v1.json", import.meta.url)),
);
const fresh = () => structuredClone(seed);

test("version 2 seed validates relationships and representative dataset", () => {
  const s = validateSnapshot(fresh());
  assert.equal(s.products.length, 54);
  assert.equal(s.companies.length, 6);
  assert.equal(s.categories.length, 14);
});
test("legacy migration preserves IDs, carts, order prices, discounts and templates", () => {
  const old = structuredClone(legacy);
  old.carts.c1 = [{ productId: "p1", qty: 3 }];
  old.companies[0].discount = 33;
  const s = validateSnapshot(old);
  assert.equal(s.version, 2);
  assert.deepEqual(s.orders, old.orders);
  assert.deepEqual(s.carts, old.carts);
  assert.equal(s.companies[0].discount, 33);
  assert.deepEqual(s.templates, old.templates);
  assert.ok(
    s.products.every((p) => s.categories.some((c) => c.id === p.categoryId)),
  );
});
test("CSV combines duplicates and rejects unknown or malformed values", () => {
  const r = parseCSV(
    "SKU,quantity\nPNE-3201,2\nPNE-3201,3\nBAD,2\nFAS-3201,-1\nFAS-3201,1.5",
    seed.products,
  );
  assert.deepEqual(r.items, [{ productId: "p1", qty: 5 }]);
  assert.equal(r.errors.length, 3);
});
test("category CRUD validates hierarchy, propagates names and safely reassigns children", () => {
  let s = fresh();
  const c = {
    ...s.categories[0],
    id: "new-category",
    name: "New category",
    slug: "new-category",
    parentId: null,
  };
  s = saveCategory(s, c);
  assert.ok(categoryVisible(s.categories, c.id));
  assert.throws(
    () => saveCategory(s, { ...c, id: "duplicate" }),
    /slug already/,
  );
  assert.throws(() => saveCategory(s, { ...c, parentId: c.id }), /ancestor/);
  const child = { ...c, id: "new-child", slug: "new-child", parentId: c.id };
  s = saveCategory(s, child);
  assert.throws(
    () => saveCategory(s, { ...c, parentId: child.id }),
    /ancestor/,
  );
  assert.throws(() => removeCategory(s, c.id), /replacement/);
  s = removeCategory(s, c.id, "cat-1");
  assert.equal(s.categories.find((x) => x.id === child.id).parentId, "cat-1");
  s = saveCategory(s, {
    ...s.categories.find((x) => x.id === "cat-8"),
    name: "Updated pneumatics",
  });
  assert.equal(s.products[0].category, "Updated pneumatics");
  assert.ok(categoryIds(s.categories, "cat-1").has("sub-1"));
});
test("inactive ancestors hide descendant products from the storefront", () => {
  const s = fresh();
  s.categories.find((c) => c.id === "cat-1").active = false;
  const p = s.products.find((p) => p.categoryId === "sub-1");
  assert.equal(productVisible(s, p), false);
});
test("product creation, unique SKU, company override and safe archive", () => {
  let s = fresh();
  const p = {
    ...s.products[0],
    id: "new-product",
    sku: "NEW-001",
    name: "New product",
    pricingRules: [{ companyId: "c1", price: 5 }],
  };
  s = saveProduct(s, p);
  assert.equal(priceFor(p, s.companies[0]), 5);
  assert.ok(productVisible(s, p));
  assert.throws(() => saveProduct(s, { ...p, id: "duplicate" }), /SKU/);
  s.carts.c1 = [{ productId: p.id, qty: 2 }];
  s = placeOrder(s, "c1", "u1", "PO-new", "");
  const order = s.orders[0];
  s = removeProduct(s, p.id);
  assert.equal(s.orders[0].items[0].unitPrice, 5);
  assert.equal(s.orders[0].id, order.id);
  assert.ok(s.products.find((x) => x.id === p.id).deleted);
  assert.equal(
    productVisible(
      s,
      s.products.find((x) => x.id === p.id),
    ),
    false,
  );
  validateSnapshot(s);
});
test("checkout enforces stock and minimum quantities and allows explicit backorder", () => {
  let s = fresh();
  s.carts.c1 = [{ productId: "p1", qty: 100 }];
  assert.throws(() => placeOrder(s, "c1", "u1", "", ""), /stock/);
  s.products[0].stockStatus = "backorder";
  s = placeOrder(s, "c1", "u1", "", "");
  assert.equal(s.orders[0].status, "pending_approval");
  assert.equal(
    quantityIssue({ ...seed.products[0], minOrderQty: 5 }, 2),
    "Quantity must meet the minimum order quantity.",
  );
});
test("checkout captures price/address, clears cart and queues only accepted orders", () => {
  let s = fresh();
  s.carts.c1 = [{ productId: "p1", qty: 1 }];
  s = placeOrder(s, "c1", "u1", "PO-test", "note", {
    deliveryAddress: { street: "Test address" },
  });
  const order = s.orders[0],
    price = order.items[0].unitPrice;
  assert.equal(order.status, "submitted");
  assert.equal(order.deliveryAddress.street, "Test address");
  assert.equal(s.carts.c1.length, 0);
  assert.equal(s.syncLogs[0].orderId, order.id);
  assert.equal(s.syncLogs[0].status, "queued");
  s.companies[0].discount = 50;
  assert.notEqual(priceFor(s.products[0], s.companies[0]), price);
  assert.equal(order.items[0].unitPrice, price);
});
test("approval gates ERP push, events deduplicate and retry follows a failure", () => {
  let s = fresh();
  s.products[0].stockStatus = "backorder";
  s.carts.c1 = [{ productId: "p1", qty: 100 }];
  s = placeOrder(s, "c1", "u1", "", "");
  const order = s.orders[0];
  assert.equal(
    s.syncLogs.some((l) => l.orderId === order.id),
    false,
  );
  s = runSync(s, "Orders");
  assert.equal(s.orders.find((o) => o.id === order.id).erpStatus, "pending");
  s.orders = s.orders.map((o) =>
    o.id === order.id ? { ...o, status: "submitted" } : o,
  );
  s = queueOrder(
    s,
    s.orders.find((o) => o.id === order.id),
  );
  s = queueOrder(
    s,
    s.orders.find((o) => o.id === order.id),
  );
  assert.equal(s.syncLogs.filter((l) => l.orderId === order.id).length, 1);
  s = runSync(s, "Orders", true);
  assert.equal(s.orders.find((o) => o.id === order.id).erpStatus, "pending");
  assert.equal(s.syncLogs[0].status, "error");
  s = runSync(s, "Orders");
  assert.equal(s.orders.find((o) => o.id === order.id).status, "processing");
  assert.equal(s.orders.find((o) => o.id === order.id).erpStatus, "synced");
  const count = s.orders.filter((o) => o.erpStatus === "synced").length;
  assert.equal(
    runSync(s, "Orders").orders.filter((o) => o.erpStatus === "synced").length,
    count,
  );
});
test("disabled synchronization does not alter entities or logs", () => {
  const s = fresh();
  s.odoo.syncSettings.Orders.enabled = false;
  assert.deepEqual(runSync(s, "Orders"), s);
  s.odoo.enabled = false;
  assert.deepEqual(runSync(s, "Products"), s);
});
test("connection whitelist removes secrets and rejects credential-bearing URLs", () => {
  const s = fresh();
  const config = safeConnection({
    ...s.odoo,
    apiKey: "private",
    password: "private",
  });
  assert.equal(config.apiKey, undefined);
  assert.equal(config.password, undefined);
  assert.throws(() =>
    safeConnection({
      ...s.odoo,
      url: "https://user:password@demo.example.invalid",
    }),
  );
  assert.throws(() =>
    safeConnection({ ...s.odoo, url: "https://real.example.com?key=private" }),
  );
});
test("snapshot round trip validates new relationships and strips secret properties", () => {
  const s = fresh();
  s.odoo.apiKey = "do-not-store";
  const result = validateSnapshot(JSON.parse(JSON.stringify(s)));
  assert.equal(result.odoo.apiKey, undefined);
  assert.equal(result.products.length, 54);
  s.carts.c1 = [{ productId: "missing", qty: 1 }];
  assert.throws(() => validateSnapshot(s));
  const t = fresh();
  t.orders[0].total = -1;
  assert.throws(() => validateSnapshot(t));
  const u = fresh();
  u.categories[0].parentId = "sub-1";
  assert.throws(() => validateSnapshot(u));
});
test("bulk updates preserve one line per product", () =>
  assert.deepEqual(
    mergeItems(
      [{ productId: "p1", qty: 2 }],
      [
        { productId: "p1", qty: 4 },
        { productId: "p2", qty: 3 },
      ],
    ),
    [
      { productId: "p1", qty: 6 },
      { productId: "p2", qty: 3 },
    ],
  ));
