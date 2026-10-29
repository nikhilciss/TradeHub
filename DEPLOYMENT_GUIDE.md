# Nordwerk TradeHub — Static B2B Ordering & Odoo 17 Concept

An enterprise-style interactive **static demo** based on the German project brief *Projektkonzept: B2B-Bestell- und Serviceportal mit ERP-Anbindung* (21 October 2026). "Nordwerk Industrial Supply" is a **fictional sample brand**, not the name of the actual client.

The application demonstrates a **MERN-oriented future architecture** without running a MERN backend. It uses React, Vite, client-side routing, seed JSON files and browser localStorage. MongoDB, Express and Node business APIs are **not active** in the static preview; they are the proposed production backend layer.

## Run locally

Requirements: Node.js 20+ and npm with internet access for dependency installation.

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

To build for Vercel:

```bash
npm test
npm run build
npm run preview
```

The output directory is `dist/`.

## Deploy on Vercel

1. Extract this ZIP and push the folder to a new GitHub repository (with `package.json` at the repo root).
2. Import that repository into Vercel.
3. Framework: **Vite**; build command `npm run build`; output directory `dist`.
4. No environment variables are needed. `vercel.json` provides the SPA deep-link rewrite.
5. Deploy. All pages resolve through the same React single-page application.

Vercel can install the app's dependencies during deployment. This archive intentionally excludes `node_modules` and compiled output.

## Demo logins (autofilled)

| Persona | Sign-in email | Password | Workspace |
|---|---|---|---|
| B2B buyer | buyer@demo.tradehub | Demo@123 | `/store` |
| Customer admin | manager@demo.tradehub | Demo@123 | `/store/approvals` |
| System admin | admin@demo.tradehub | Admin@123 | `/admin` |
| Field sales | sales@demo.tradehub | Sales@123 | `/sales` |
| Inside sales | support@demo.tradehub | Support@123 | `/admin` |

The login screen autofills both fields when you select a persona. The profile menu allows one-click switching between demo roles.

**Security note:** These are publicly documented DEMO credentials and not real authentication. They must never be reused as production secrets.

## Included modules

**Customer storefront:** buyer landing/dashboard, searchable catalog with filters and product detail, customer-specific discounts, favorites, quick SKU order via CSV/text, persistent cart, checkout, purchasing approvals, order history/tracking, repeat-order templates, downloadable **watermarked demo PDF** invoices, and optional rules-based AI-preview ordering screen.

**Internal admin portal:** management dashboard, product/stock editing (demo-only), fulfillment statuses, customer accounts and negotiated discounts, account approvals, users/roles, portal settings, JSON import/export/reset, and Odoo integration center.

**Odoo integration center:** conceptual architecture, 17.0 instance/configuration fields, field mappings for products, customers, pricelists, stock, orders and invoices, configurable demo module toggles, hourly master-data interval and near-real-time order goals, mock connection test, simulated sync actions, and shared sync logs.

**Field-sales Phase 2 preview:** select customer, inspect their purchasing context, enter SKU lines and simulate a temporary offline queue that can be reconnected to the current browser's cart. This is **not** a native mobile app or real offline sync.

**Language UI:** EN/DE switch for common navigation and operations terms. Full production copy, translations, product localization and accessibility certification require a later implementation phase.

## Shared data: JSON seed → repository → browser storage

**Startup:** `src/data/seed.json` initializes the application on first visit; a readable copy is at `public/seed.json`.

**Runtime:** `src/context/DemoContext.jsx` defines a centralized state store and getter/setter-like methods. React pages subscribe to the same state. Mutations are saved to **localStorage**, survive navigation and page refreshes, and are visible after switching personas **in the same browser/profile**.

**Import/export:** Admin → Settings → Export/Import JSON serializes the full current browser state to a local JSON file (or reads a user-selected snapshot back in). Reset restores shipped seed JSON.

**Important limitation:** Vercel's static filesystem is not a writable shared runtime database. The application does **not** persist changes back into its source JSON files and does **not** synchronize browsers, users or devices. Browser-local changes are not a substitute for a backend. If a cross-browser shared dataset is required, use a real service or backend.

### Seed relationships

- `company.id` ↔ `users.companyId`, `orders.companyId`, `invoices.companyId`, `templates.companyId`
- `products.id` ↔ `order.items[].productId`, `cart[].productId`, `templates.items[].productId`, favorite IDs
- `orders.id` ↔ `invoices.orderId`
- `orders.erpStatus` ↔ Odoo sync queue and status UI
- `odoo.mapping` ↔ mock integration mapping table; `syncLogs` ↔ recorded mock actions

All sample product/catalog, customer, order, pricing and invoice figures are illustrative. The requirements specify **~25,000 items and ~1,200 business customers** in the future production system; the demo ships **54 representative products and six customers** for performance and readability.

## Key demo walkthrough

1. Login as **buyer**. Search `PNE-3201` in Catalog, add multiple items and place an order.
2. If the subtotal exceeds the approval threshold, switch to **Customer Admin** and approve it.
3. Switch to **System Admin** and open Orders to see the same order.
4. Go to **Odoo Integration → Run full demo sync** to mark accepted orders as processed and add a sync log entry.
5. Switch back to **Buyer**. The new order appears with updated status. You can also reorder it into the current cart.
6. In Admin → Customers, change Müller Maschinenbau's discount; return to Buyer Catalog to see updated customer pricing.
7. Export a demo state snapshot as JSON and use it again in another browser by manual import.

## Explicit production boundaries

- No live Odoo credentials, Odoo API calls, stock reservations, payment processing or real order placement.
- No MongoDB/Express/Node server in the static build.
- No real security boundary: permissions are purely UI demonstration; data is visible in bundled JSON and browser storage.
- Sample invoices are **not fiscal documents**; real PDF invoices must originate from ERP.
- No native iOS/Android packaging, real barcode-camera scanner, persistent offline sync, email ingestion, PDF OCR or generative AI model.
- No actual WordPress changes, hosting procurement or ERP integration configuration outside this demo.
- VAT, shipping, tax rules, currency conversion, DACH legal compliance and DSGVO production controls are out of demo scope.

## Proposed future production transition

Add MongoDB for portal-specific state and an Express/Node API service for authentication, tenant-aware authorization, order orchestration, idempotency, security trimming, audit logs, Odoo adapter and background sync jobs; place server-side credentials in a secret manager; use Odoo 17 as the master for products, pricing, stock, orders and invoice documents; deploy the backend in an EU region (Germany preferred) and complete GDPR/DSGVO controls, security testing and joint ERP sandbox UAT.

## Source ownership

- `src/context/DemoContext.jsx` — shared state and getter/setter operations
- `src/pages/StorePages.jsx` — all B2B storefront and ordering screens
- `src/pages/AdminPages.jsx` — admin, Odoo simulation, sales preview
- `src/components/UI.jsx` — shell, navigation, product cards and reusable UI
- `src/data/seed.json` — initial sample data
- `src/utils/invoice.js` — demo PDF generator
- `src/utils/i18n.js` — English/German UI labels
- `vercel.json` — Vercel static SPA rewrite
- `scripts/verify-demo.mjs` — data and route integrity checks

See `DEVELOPMENT_PROMPT.md` for a complete build specification to reuse with Codex or a code-generation agent.
