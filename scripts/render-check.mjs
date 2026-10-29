import { build } from "esbuild";
import fs from "node:fs";
import assert from "node:assert/strict";
const seed = JSON.parse(fs.readFileSync("src/data/seed.json", "utf8"));
fs.mkdirSync("node_modules/.cache", { recursive: true });
await build({
  entryPoints: ["tests/render-harness.jsx"],
  outfile: "node_modules/.cache/render-check.mjs",
  bundle: true,
  format: "esm",
  platform: "node",
  jsx: "transform",
  external: [
    "react",
    "react-dom",
    "react-dom/server",
    "react-router-dom",
    "jspdf",
    "lucide-react",
  ],
  logLevel: "silent",
});
const { renderRoute } = await import("../node_modules/.cache/render-check.mjs");
let records = {};
globalThis.localStorage = {
  getItem: (key) => records[key] || null,
  setItem: (key, value) => {
    records[key] = value;
  },
};
const session = (user = "", lang = "en", state = seed) => {
  records = {
    "tradehub-demo-v2": JSON.stringify(state),
    "tradehub-user": user,
    "tradehub-lang": lang,
  };
};
let count = 0;
function check(path, user = "", lang = "en", state = seed) {
  session(user, lang, state);
  const html = renderRoute(path);
  assert.ok(html.length > 100, `${path} should render`);
  assert.ok(!html.includes("NaN"), `${path}: no NaN`);
  count++;
  return html;
}
for (const route of [
  "/store",
  "/store/catalog",
  "/store/catalog?category=cat-1",
  "/store/products/p1",
]) {
  const html = check(route);
  assert.ok(!html.includes("€"), `${route}: guest price leakage`);
  assert.ok(
    !html.includes("Add to cart"),
    `${route}: guest purchasing control`,
  );
  assert.ok(html.includes("Log in to see prices"), `${route}: login CTA`);
  assert.ok(!html.includes("sidebar"), `${route}: no admin sidebar`);
}
let html = check("/store/products/p1");
assert.ok(html.includes("/login?next=%2Fstore%2Fproducts%2Fp1"));
html = check("/login?next=%2Fstore%2Fproducts%2Fp1");
assert.ok(html.includes("Business customer login"));
assert.ok(!html.includes("admin@demo.tradehub"));
html = check("/admin/login");
assert.ok(html.includes("Admin login"));
assert.ok(html.includes("admin@demo.tradehub"));
assert.ok(!html.includes("buyer@demo.tradehub"));
for (const route of [
  "/store",
  "/store/catalog",
  "/store/products/p1",
  "/store/quick-order",
  "/store/account",
  "/store/account/company",
  "/store/account/addresses",
  "/store/orders",
  "/store/orders/o1",
  "/store/invoices",
  "/store/templates",
  "/store/favorites",
  "/store/support",
  "/store/ai-preview",
])
  check(route, "u1");
const cartState = structuredClone(seed);
cartState.carts.c1 = [{ productId: "p1", qty: 2 }];
for (const route of ["/store/cart", "/store/checkout"]) {
  html = check(route, "u1", "en", cartState);
  assert.ok(html.includes("€"));
}
for (const route of ["/store/approvals", "/store/account/users"])
  check(route, "u2");
for (const route of [
  "/admin",
  "/admin/products",
  "/admin/categories",
  "/admin/customers",
  "/admin/users",
  "/admin/orders",
  "/admin/orders/o1",
  "/admin/settings",
  "/admin/odoo",
])
  check(route, "u3");
check("/sales", "u4");
html = check("/store/catalog", "u1", "de");
assert.ok(html.includes("In den Warenkorb"));
assert.ok(html.includes("Pneumatik"));
html = check("/store/checkout", "u1", "de", cartState);
assert.ok(html.includes("Demo-Bestellung absenden"));
assert.ok(html.includes("Lieferadresse"));
html = check("/admin/categories", "u3", "de");
assert.ok(html.includes("Kategorieverwaltung"));
html = check("/admin/products", "u3", "de");
assert.ok(html.includes("Produktverwaltung"));
html = check("/admin/odoo", "u3", "de");
assert.ok(html.includes("ERP-Konfigurationskonsole"));
console.log(
  `${count} route renders verified: guest pricing gates, role layouts, populated checkout and German labels. No browser interaction or visual QA is claimed.`,
);
