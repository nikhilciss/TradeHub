import { createId } from "../utils/id.js";
export const syncDefinitions = [
  ["Products", "Odoo → Portal", "products"],
  ["Product Categories", "Odoo → Portal", "categories"],
  ["Customers", "Odoo → Portal", "companies"],
  ["Customer-Specific Prices", "Odoo → Portal", "companies"],
  ["Stock", "Odoo → Portal", "products"],
  ["Orders", "Portal → Odoo", "orders"],
  ["Order Status", "Odoo → Portal", "orders"],
  ["Delivery Status", "Odoo → Portal", "orders"],
  ["Invoices", "Odoo → Portal", "invoices"],
];
export const defaultMappings = [
  [
    "Products",
    "product.template / product.product",
    "name → name; sku → default_code; price → list_price",
  ],
  [
    "Product Categories",
    "product.category",
    "name → name; parentId → parent_id",
  ],
  ["Customers", "res.partner", "name → name; code → ref"],
  [
    "Orders",
    "sale.order",
    "reference → client_order_ref; companyId → partner_id",
  ],
  [
    "Order Lines",
    "sale.order.line",
    "productId → product_id; qty → product_uom_qty; unitPrice → price_unit",
  ],
  ["Invoices", "account.move", "number → name; companyId → partner_id"],
  [
    "Prices",
    "product.pricelist",
    "companyId → partner relation (TBC); currency → currency_id",
  ],
  [
    "Stock",
    "stock.quant",
    "productId → product_id; stock → quantity (availability rules TBC)",
  ],
].map(([entity, model, fields], i) => ({
  id: `mapping-${i}`,
  entity,
  model,
  fields,
  enabled: true,
}));
export const defaultConnection = {
  name: "TradeHub Odoo demo",
  version: "17.0",
  url: "https://odoo-demo.example.invalid",
  database: "tradehub_demo",
  authMethod: "username_api_key",
  user: "portal_demo",
  environment: "Development",
  timeout: 30,
  enabled: true,
  connectionStatus: "disconnected",
};
export function safeConnection(input) {
  const result = Object.fromEntries(
    Object.keys(defaultConnection)
      .filter((k) => k !== "connectionStatus")
      .map((k) => [k, input[k] ?? defaultConnection[k]]),
  );
  if (!result.name.trim() || !result.database.trim() || !result.user.trim())
    throw Error("Complete the required connection fields.");
  let url;
  try {
    url = new URL(result.url);
  } catch {
    throw Error("Enter a valid demonstration URL.");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !url.hostname.endsWith(".invalid")
  )
    throw Error(
      "Use a non-sensitive .invalid demo URL without credentials or query parameters.",
    );
  if (
    !Number.isInteger(result.timeout) ||
    result.timeout < 1 ||
    result.timeout > 120
  )
    throw Error("Timeout must be between 1 and 120 seconds.");
  if (
    result.version !== "17.0" ||
    !["username_api_key", "username_password_demo"].includes(
      result.authMethod,
    ) ||
    !["Development", "Staging", "Production"].includes(result.environment) ||
    typeof result.enabled !== "boolean"
  )
    throw Error("Invalid connection settings.");
  return result;
}
export function logEntry(
  entity,
  status,
  count = 0,
  details = "",
  orderId = null,
) {
  const now = new Date().toISOString();
  return {
    id: createId(),
    entity,
    direction: entity === "Orders" ? "Portal → Odoo" : "Odoo → Portal",
    date: now,
    startedAt: now,
    completedAt: status === "queued" ? null : now,
    recordsProcessed: count,
    successCount: status === "success" ? count : 0,
    failedCount: status === "error" ? Math.max(1, count) : 0,
    status,
    details,
    orderId,
  };
}
export function queueOrder(state, order) {
  if (
    order.status !== "submitted" ||
    state.syncLogs.some((l) => l.orderId === order.id && l.status === "queued")
  )
    return state;
  return {
    ...state,
    syncLogs: [
      logEntry(
        "Orders",
        "queued",
        0,
        "Accepted demo order queued locally. No external request.",
        order.id,
      ),
      ...state.syncLogs,
    ],
  };
}
export function runSync(state, entity, fail = false) {
  const entities =
    entity === "Full sync"
      ? syncDefinitions
          .filter(([name]) => state.odoo.syncSettings[name]?.enabled)
          .map(([name]) => name)
      : [entity];
  let next = state;
  for (const name of entities) {
    const config = next.odoo.syncSettings[name];
    if (!config || !config.enabled || !next.odoo.enabled) continue;
    const now = new Date().toISOString();
    let count = 0;
    const eligible = next.orders.filter(
      (o) => o.status === "submitted" && o.erpStatus === "pending",
    );
    const collection = syncDefinitions.find(([n]) => n === name)?.[2];
    count = name === "Orders" ? eligible.length : next[collection]?.length || 0;
    let orders = next.orders,
      logs = next.syncLogs;
    if (!fail && name === "Orders") {
      orders = orders.map((o) =>
        eligible.some((e) => e.id === o.id)
          ? { ...o, status: "processing", erpStatus: "synced" }
          : o,
      );
      logs = logs.map((l) =>
        l.status === "queued" && eligible.some((o) => o.id === l.orderId)
          ? {
              ...l,
              status: "success",
              completedAt: now,
              recordsProcessed: 1,
              successCount: 1,
              details: "Local outbound queue processed by demo sync.",
            }
          : l,
      );
    }
    const status = fail ? "error" : "success";
    const details = fail
      ? "Simulated failure for demonstration. Retry when ready; no ERP request was made."
      : "Local simulation complete. No external ERP request; master records retained. Accepted order states updated only on outbound sync.";
    next = {
      ...next,
      orders,
      odoo: {
        ...next.odoo,
        lastSync: fail ? next.odoo.lastSync : now,
        syncSettings: {
          ...next.odoo.syncSettings,
          [name]: {
            ...config,
            lastSync: fail ? config.lastSync : now,
            status,
            records: fail ? config.records || 0 : count,
          },
        },
      },
      syncLogs: [logEntry(name, status, count, details), ...logs],
    };
  }
  return next;
}
