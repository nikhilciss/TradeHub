import fs from "node:fs";
import assert from "node:assert/strict";
import { validateSnapshot } from "../src/services/domain.js";
const seed = validateSnapshot(
  JSON.parse(fs.readFileSync("src/data/seed.json")),
);
assert.deepEqual(seed, JSON.parse(fs.readFileSync("public/seed.json")));
const source = fs.readFileSync("src/App.jsx", "utf8");
for (const path of [
  "/login",
  "/admin/login",
  "/admin/categories",
  "/store/checkout",
  "/store/account",
  "/store",
  "/store/catalog",
  "/store/cart",
  "/store/orders",
  "/store/approvals",
  "/store/invoices",
  "/store/templates",
  "/admin",
  "/admin/orders",
  "/admin/products",
  "/admin/customers",
  "/admin/users",
  "/admin/odoo",
  "/admin/settings",
  "/sales",
])
  assert.ok(source.includes(`path="${path}"`), path);
for (const user of seed.users)
  assert.ok(seed.companies.some((c) => c.id === user.companyId));
for (const inv of seed.invoices)
  assert.ok(
    seed.orders.some((o) => o.id === inv.orderId && o.invoiceId === inv.id),
  );
console.log(
  "Seed relationships, shipped seed copy and required routes verified.",
);
