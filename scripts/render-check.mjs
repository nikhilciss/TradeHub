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
const session = (user = "", lang = "en", state = seed, companyId = "c1") => {
  records = {
    "tradehub-demo-v4": JSON.stringify(state),
    "tradehub-session-v3": JSON.stringify({ userId: user, companyId }),
    "tradehub-user": user,
    "tradehub-language-v4": lang,
  };
};
let count = 0;
function check(path, user = "", lang = "en", state = seed, companyId = "c1") {
  session(user, lang, state, companyId);
  const html = renderRoute(path);
  assert.ok(html.length > 100, `${path} should render`);
  assert.ok(!html.includes("NaN"), `${path}: no NaN`);
  assert.ok(
    !html.includes("Switch demo persona"),
    `${path}: no role switching dropdown`,
  );
  count++;
  return html;
}
for (const route of [
  "/store",
  "/store/catalog",
  "/store/products/p1",
  "/store/cart",
  "/store/quick-order",
  "/store/ai-preview",
]) {
  session();
  let html = renderRoute(route);
  assert.ok(
    !html.includes("Compact cylinder") &&
      !html.includes("shop-header") &&
      !html.includes("€"),
    `${route}: anonymous catalog blocked`,
  );
  count++;
  session("u1", "en", seed, "");
  html = renderRoute(route);
  assert.ok(
    !html.includes("shop-header"),
    `${route}: company selection required`,
  );
  count++;
}
let html = check("/");
assert.ok(html.includes("Business customer login"));
assert.ok(!html.includes("admin@demo.tradehub"));
assert.ok(html.includes('href="/admin/login"'));
assert.ok(!html.includes("Switch demo persona"));
assert.ok(!html.includes("Field sales"));
html = check("/login");
assert.ok(html.includes("Business customer login"));
assert.ok(!html.includes("admin@demo.tradehub"));
html = check("/admin/login");
assert.ok(html.includes("admin@demo.tradehub"));
assert.ok(!html.includes("buyer@demo.tradehub"));
assert.ok(html.includes("Back to B2B customer login"));
assert.ok(html.includes('href="/login"'));
assert.ok(html.includes("Inside sales"));
assert.ok(html.includes("Field sales"));
assert.ok(!html.includes("Switch demo persona"));
html = check("/companies", "u1", "en", seed, "");
assert.ok(html.includes("Müller Maschinenbau"));
assert.ok(html.includes("Alpen Technik"));
assert.ok(!html.includes("Kraft Anlagenbau"));
assert.ok(!html.includes("Nordwerk Engineering"));
assert.ok(!html.includes("shop-header"));
html = check("/store", "u1", "en", seed, "c2");
assert.ok(html.includes("Alpen Technik"));
assert.ok(html.includes("AI-assisted ordering"));
assert.ok(html.includes("Quick order"));
session("u1", "en", seed, "c5");
assert.ok(
  !renderRoute("/store").includes("shop-header"),
  "Unassigned company blocked",
);
count++;
session("u2", "en", seed, "c2");
assert.ok(
  !renderRoute("/store/approvals").includes("Purchasing approvals"),
  "Per-company buyer role cannot approve",
);
count++;
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

check("/admin/roles", "u3");
check("/admin/ai", "u3");
const inside = seed.users.find((u) => u.role === "inside_sales");
for (const route of ["/admin/roles", "/admin/ai", "/admin/products"])
  assert.ok(check(route, inside.id).includes("You do not have permission"));
assert.ok(!check("/admin", inside.id).includes('href="/admin/ai"'));
const disabledAI = structuredClone(seed);
disabledAI.aiConfig.enabled = false;
assert.ok(
  check("/store/ai-preview", "u1", "en", disabledAI).includes(
    "AI assistance is disabled",
  ),
);
const limitedAI = structuredClone(seed);
limitedAI.aiConfig.textOrders = false;
assert.ok(
  !check("/store/ai-preview", "u1", "en", limitedAI).includes(
    "Paste email or PDF order text",
  ),
);

console.log(
  `${count} route renders verified: login-first guards, company membership isolation, role layouts, populated checkout and German labels. No browser interaction or visual QA is claimed.`,
);
