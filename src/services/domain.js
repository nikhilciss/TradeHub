import {
  productVisible,
  quantityIssue,
  validateCategory,
  validateProduct,
} from "./catalogService.js";
import { migrateState } from "./migration.js";
import {
  queueOrder,
  runSync,
  safeConnection,
  syncDefinitions,
} from "./odooService.js";
export const money = (n) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    n,
  );
export const priceFor = (p, c) =>
  Math.round(
    (p.pricingRules?.find((r) => r.companyId === c.id)?.price ??
      p.price * (1 - Math.max(c.discount, p.discount || 0) / 100)) * 100,
  ) / 100;
export const totalFor = (items) =>
  Math.round(items.reduce((s, i) => s + i.qty * i.unitPrice, 0) * 100) / 100;
export const id = () => crypto.randomUUID();
export function mergeItems(existing, incoming) {
  const map = new Map(existing.map((i) => [i.productId, { ...i }]));
  for (const i of incoming) {
    if (!Number.isInteger(i.qty) || i.qty < 1 || i.qty > 99999) continue;
    map.set(i.productId, {
      productId: i.productId,
      qty: Math.min(99999, (map.get(i.productId)?.qty || 0) + i.qty),
    });
  }
  return [...map.values()];
}
export function parseCSV(text, products) {
  const items = [],
    errors = [];
  text
    .split(/\r?\n/)
    .filter(Boolean)
    .forEach((line, index) => {
      if (/^\s*sku\s*[,;]/i.test(line)) return;
      const [sku, q] = line.trim().split(/[,;\t]/);
      const p = products.find(
        (p) => p.sku.toLowerCase() === sku?.trim().toLowerCase() && p.active,
      );
      const qty = Number(q);
      if (!p || !Number.isInteger(qty) || qty < 1 || qty > 99999)
        errors.push(
          `Line ${index + 1}: unknown SKU or invalid quantity (${line})`,
        );
      else items.push({ productId: p.id, qty });
    });
  return { items: mergeItems([], items), errors };
}
export function placeOrder(
  state,
  companyId,
  userId,
  reference,
  notes,
  addresses = {},
) {
  const company = state.companies.find((c) => c.id === companyId);
  if (!company.active)
    throw Error("This company account is awaiting approval.");
  const items = state.carts[companyId].map((i) => {
    const p = state.products.find((p) => p.id === i.productId);
    if (state.categories && !productVisible(state, p))
      throw Error("This product is unavailable.");
    const issue = quantityIssue(p, i.qty);
    if (issue) throw Error(issue);
    return { ...i, sku: p.sku, name: p.name, unitPrice: priceFor(p, company) };
  });
  if (!items.length) throw Error("Your cart is empty.");
  const total = totalFor(items);
  const order = {
    id: id(),
    number: `TH-2026-${Math.max(1047, ...state.orders.map((o) => Number(o.number.split("-").at(-1)) || 0)) + 1}`,
    companyId,
    userId,
    items,
    total,
    reference,
    notes,
    status:
      total > (company.approvalThreshold ?? state.settings.approvalThreshold)
        ? "pending_approval"
        : "submitted",
    createdAt: new Date().toISOString(),
    erpStatus: "pending",
    tracking: "",
    invoiceId: null,
    deliveryAddress: addresses.deliveryAddress || company.addresses?.[0],
    billingAddress: addresses.billingAddress || company.billingAddress,
  };
  return queueOrder(
    {
      ...state,
      orders: [order, ...state.orders],
      carts: { ...state.carts, [companyId]: [] },
    },
    order,
  );
}
export const simulateSync = (state, entity) => runSync(state, entity);
export function validateSnapshot(input) {
  const s = migrateState(input);
  for (const k of [
    "companies",
    "products",
    "users",
    "orders",
    "invoices",
    "templates",
    "drafts",
    "support",
    "syncLogs",
  ])
    if (!Array.isArray(s[k])) throw Error(`Invalid ${k}`);
  if (
    !s.carts ||
    !s.favorites ||
    !s.settings ||
    !s.odoo ||
    !Array.isArray(s.odoo.modules) ||
    !Array.isArray(s.odoo.mapping)
  )
    throw Error("Missing settings or collections");
  const cs = new Set(s.companies.map((c) => c.id)),
    ps = new Set(s.products.map((p) => p.id));
  for (const c of s.companies)
    if (
      !c.name ||
      !Number.isFinite(c.discount) ||
      c.discount < 0 ||
      c.discount > 100 ||
      !Number.isFinite(c.approvalThreshold) ||
      c.approvalThreshold < 0
    )
      throw Error("Invalid company");
  for (const p of s.products)
    if (
      !p.name ||
      !p.sku ||
      !Number.isFinite(p.price) ||
      p.price < 0 ||
      !Number.isFinite(p.stock) ||
      p.stock < 0
    )
      throw Error("Invalid product");
  const lines = (items) => {
    if (
      !Array.isArray(items) ||
      items.some(
        (i) =>
          !ps.has(i.productId) ||
          !Number.isInteger(i.qty) ||
          i.qty < 1 ||
          i.qty > 99999,
      )
    )
      throw Error("Invalid item reference or quantity");
  };
  for (const [c, items] of Object.entries(s.carts)) {
    if (!cs.has(c)) throw Error("Unknown cart company");
    lines(items);
  }
  for (const c of s.companies)
    if (!Array.isArray(s.carts[c.id])) throw Error("Missing company cart");
  for (const o of s.orders) {
    if (
      !cs.has(o.companyId) ||
      !Number.isFinite(o.total) ||
      ![
        "pending_approval",
        "submitted",
        "processing",
        "shipped",
        "delivered",
        "canceled",
        "rejected",
      ].includes(o.status)
    )
      throw Error("Invalid order");
    lines(o.items);
    if (
      o.items.some((i) => !Number.isFinite(i.unitPrice) || i.unitPrice < 0) ||
      Math.abs(totalFor(o.items) - o.total) > 0.01
    )
      throw Error("Invalid order total");
  }
  for (const t of s.templates) {
    if (!cs.has(t.companyId)) throw Error("Unknown template company");
    lines(t.items);
  }
  for (const u of s.users)
    if (
      !cs.has(u.companyId) ||
      ![
        "buyer",
        "customer_admin",
        "admin",
        "inside_sales",
        "field_sales",
      ].includes(u.role) ||
      !u.email
    )
      throw Error("Invalid user");
  for (const inv of s.invoices)
    if (
      !s.orders.some(
        (o) => o.id === inv.orderId && o.companyId === inv.companyId,
      ) ||
      !Number.isFinite(inv.amount)
    )
      throw Error("Invalid invoice");
  for (const draft of s.drafts) {
    if (!cs.has(draft.companyId)) throw Error("Unknown draft company");
    lines(draft.items);
  }
  for (const [cid, items] of Object.entries(s.favorites)) {
    if (
      !cs.has(cid) ||
      !Array.isArray(items) ||
      items.some((pid) => !ps.has(pid))
    )
      throw Error("Invalid favorites");
  }
  for (const key of [
    "companies",
    "products",
    "users",
    "orders",
    "invoices",
    "templates",
  ]) {
    const ids = s[key].map((x) => x.id);
    if (
      ids.some((x) => typeof x !== "string") ||
      new Set(ids).size !== ids.length
    )
      throw Error("Invalid or duplicate IDs");
  }
  if (
    !s.companies.length ||
    !s.users.some((u) => u.active && u.role === "admin")
  )
    throw Error("Snapshot requires a company and active admin");
  if (
    !Number.isFinite(s.settings.approvalThreshold) ||
    s.settings.approvalThreshold < 0 ||
    !Number.isFinite(s.odoo.interval) ||
    s.odoo.interval < 1 ||
    s.odoo.interval > 60
  )
    throw Error("Invalid configuration");
  for (const c of s.categories) validateCategory(s.categories, c);
  for (const p of s.products) validateProduct(s, p);
  if (new Set(s.categories.map((c) => c.id)).size !== s.categories.length)
    throw Error("Duplicate category IDs");
  for (const c of s.companies) {
    if (!Array.isArray(c.addresses) || !c.addresses.length || !c.billingAddress)
      throw Error("Missing company addresses");
  }
  if (
    !s.recentlyViewed ||
    Object.values(s.recentlyViewed).some(
      (ids) => !Array.isArray(ids) || ids.some((pid) => !ps.has(pid)),
    )
  )
    throw Error("Invalid recently viewed products");
  safeConnection(s.odoo);
  for (const [name] of syncDefinitions) {
    const cfg = s.odoo.syncSettings?.[name];
    if (
      !cfg ||
      typeof cfg.enabled !== "boolean" ||
      !Number.isFinite(cfg.frequency) ||
      cfg.frequency < 1 ||
      cfg.frequency > 60
    )
      throw Error("Invalid synchronization settings");
  }
  s.odoo = {
    ...safeConnection(s.odoo),
    interval: s.odoo.interval,
    modules: s.odoo.modules,
    mapping: s.odoo.mapping,
    syncSettings: s.odoo.syncSettings,
    lastSync: s.odoo.lastSync,
    connectionStatus:
      s.odoo.connectionStatus === "connected" ? "connected" : "disconnected",
  };
  return s;
}
