import { defaultRoleProfiles } from "./roleService.js";
import { defaultAIConfig } from "./aiConfigService.js";
import { slugify } from "./catalogService.js";
import {
  defaultConnection,
  defaultMappings,
  syncDefinitions,
} from "./odooService.js";
const names = [
  ["Electrical Components", "Elektrokomponenten", "Electrical"],
  ["Industrial Automation", "Industrieautomation", "Electrical"],
  ["Mechanical Components", "Mechanische Komponenten", "Power transmission"],
  ["Tools & Equipment", "Werkzeuge & Ausrüstung", "Tools"],
  ["Safety & Protective Equipment", "Arbeitsschutz", "Safety"],
  ["Cables & Connectors", "Kabel & Steckverbinder", "Electrical"],
  ["Sensors & Control Systems", "Sensorik & Steuerung", "Electrical"],
  ["Pneumatics & Hydraulics", "Pneumatik & Hydraulik", "Pneumatics"],
  ["Fasteners & Hardware", "Befestigungstechnik", "Fasteners"],
  ["Maintenance Supplies", "Wartungsbedarf", "Tools"],
];
export function migrateState(input) {
  if (!input || ![1, 2, 3, 4].includes(input.version))
    throw Error("Unsupported snapshot version");
  const s = structuredClone(input);
  if (s.version === 4) return s;
  if (s.version === 3) return addAdminConfig(s);
  if (s.version === 2) return addMemberships(s);
  s.categories = names.map(([name, nameDe, illustration], i) => ({
    id: `cat-${i + 1}`,
    name,
    nameDe,
    slug: slugify(name),
    description: `Professional ${name.toLowerCase()} for industrial production and maintenance.`,
    parentId: null,
    image: "",
    icon: "Package",
    illustration,
    displayOrder: i,
    active: true,
    featured: true,
  }));
  s.categories.push(
    ...[
      ["Switches", "Schalter"],
      ["Relays", "Relais"],
      ["Circuit Breakers", "Leitungsschutzschalter"],
      ["Connectors", "Steckverbinder"],
    ].map(([name, nameDe], i) => ({
      id: `sub-${i + 1}`,
      name,
      nameDe,
      slug: slugify(name),
      parentId: "cat-1",
      description: `Industrial ${name.toLowerCase()}.`,
      image: "",
      icon: "Zap",
      illustration: "Electrical",
      displayOrder: i,
      active: true,
      featured: false,
    })),
  );
  const categoryMap = {
    Pneumatics: "cat-8",
    Fasteners: "cat-9",
    "Power transmission": "cat-3",
    Electrical: "cat-1",
    Tools: "cat-4",
    Safety: "cat-5",
  };
  s.products = s.products.map((p, i) => {
    let categoryId = categoryMap[p.category] || "cat-10";
    if (p.category === "Electrical")
      categoryId = [
        "cat-7",
        "sub-2",
        "sub-3",
        "cat-6",
        "sub-4",
        "cat-6",
        "cat-2",
        "sub-1",
        "cat-2",
      ][i % 9];
    if (p.name === "Deburring tool") categoryId = "cat-10";
    return {
      ...p,
      categoryId,
      category: s.categories.find((c) => c.id === categoryId).name,
      illustration: p.category,
      nameDe: p.name,
      shortDescription:
        "Reliable industrial quality for professional purchasing.",
      images: [],
      discount: 0,
      taxRate: 19,
      pricingRules: [],
      minOrderQty: 1,
      stockStatus: p.stock ? "in_stock" : "backorder",
      manufacturer: p.brand,
      manufacturerPartNumber: p.sku,
      datasheetUrl: "",
      specifications: {
        Material:
          p.category === "Safety" ? "Industrial composite" : "Industrial alloy",
        Application: "Industrial maintenance",
        Series: `TH-${3200 + i}`,
        Origin: "Illustrative DACH sample",
      },
      showOnStorefront: true,
      deleted: false,
      createdAt: `2026-10-${String(1 + (i % 27)).padStart(2, "0")}T09:00:00Z`,
    };
  });
  s.companies = s.companies.map((c, i) => ({
    ...c,
    addresses: [
      {
        id: `address-${c.id}`,
        label: "Head office",
        street: `Industriestraße ${12 + i}`,
        postalCode: ["70173", "8001", "80331", "1010", "20095", "8010"][i % 6],
        city: c.city,
        country: c.country,
      },
    ],
    billingAddress: {
      street: `Industriestraße ${12 + i}`,
      postalCode: ["70173", "8001", "80331", "1010", "20095", "8010"][i % 6],
      city: c.city,
      country: c.country,
    },
  }));
  s.recentlyViewed = {};
  s.odoo = {
    ...defaultConnection,
    ...s.odoo,
    connectionStatus: "disconnected",
    mapping: structuredClone(defaultMappings),
    syncSettings: Object.fromEntries(
      syncDefinitions.map(([name, direction]) => [
        name,
        {
          enabled: true,
          direction,
          frequency: name === "Orders" ? 1 : 60,
          lastSync: null,
          status: "idle",
          records: 0,
        },
      ]),
    ),
  };
  s.syncLogs = s.syncLogs.map((l) => ({
    ...l,
    startedAt: l.date,
    completedAt: l.date,
    recordsProcessed: 0,
    successCount: 0,
    failedCount: l.status === "error" ? 1 : 0,
  }));
  s.version = 2;
  return addMemberships(s);
}

function addMemberships(s) {
  s.users = s.users.map((u) => ({
    ...u,
    memberships: ["buyer", "customer_admin"].includes(u.role)
      ? [{ companyId: u.companyId, role: u.role, active: true }]
      : [],
  }));
  s.version = 3;
  return addAdminConfig(s);
}

function addAdminConfig(s) {
  s.roleProfiles = structuredClone(defaultRoleProfiles);
  s.aiConfig = structuredClone(defaultAIConfig);
  s.aiLogs = [];
  s.users = s.users.map((u) => ({
    ...u,
    ...(["admin", "inside_sales", "field_sales"].includes(u.role)
      ? {
          staffRoleId: {
            admin: "system-admin",
            inside_sales: "inside-sales",
            field_sales: "field-sales",
          }[u.role],
        }
      : {}),
  }));
  // One-time upgrade of the known public sample buyer only; preserve all other customers and demo edits.
  const buyer = s.users.find(
    (u) => u.id === "u1" && u.email.toLowerCase() === "buyer@demo.tradehub",
  );
  if (
    buyer &&
    s.companies.some((c) => c.id === "c1") &&
    s.companies.some((c) => c.id === "c2")
  ) {
    const old = buyer.memberships || [];
    buyer.memberships = ["c1", "c2"].map((companyId) => ({
      ...old.find((m) => m.companyId === companyId),
      companyId,
      role: "buyer",
      active: true,
    }));
    s.companies = s.companies.map((c) =>
      ["c1", "c2"].includes(c.id) ? { ...c, active: true } : c,
    );
  }
  s.version = 4;
  return s;
}
