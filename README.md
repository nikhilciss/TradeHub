# TradeHub · Static B2B storefront and operations portal

An existing Vite/React demo upgraded in place for a fictional DACH industrial wholesaler. The buyer storefront, internal operations portal, and Odoo configuration console share one browser-local data store. No backend, database service, live authentication, or external ERP requests are used.

## Run locally

Requires Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:5173. The first page is **B2B customer login**, with no internal administrator credentials. An **Admin login** link below the form opens `/admin/login`.

- `/` and `/login`: B2B buyer/customer-administrator login.
- `/companies`: after login, choose from the active companies associated with that email.
- `/store`, `/store/catalog`, `/store/products/:id`: company-scoped storefront, available only after login and company selection.
- `/store/quick-order`: multiple SKU rows and reviewed CSV import.
- `/store/ai-preview`: optional AI-assisted ordering demonstration with reviewable local text parsing and keyword search.
- `/admin/login`: separate staff login for system administrator, inside sales and field sales.
- `/admin/*`: internal administration, guarded by staff roles.

The customer flow is **login → linked companies → select company → catalog and purchasing**. Direct catalog or cart links redirect unauthenticated visitors to login, then require company selection before restoring the destination. Each company retains its own cart, contract prices, addresses, favorites, templates, order history and invoices. The role for the selected company controls purchasing approvals and company user management. My Account → Switch company opens the chooser again. Signing out clears the selected company.

For a fresh demo, `buyer@demo.tradehub` is associated with Müller Maschinenbau and Alpen Technik. The manager account is a customer administrator at Müller and a buyer at Alpen, demonstrating company-specific permissions. Admin → Users & company access → Edit user & companies manages associations, per-company roles and membership status. Inactive companies or memberships are excluded from selection.

This remains a static, browser-local demonstration, not a production authentication or authorization system. Bundled sample data is inspectable; production must enforce identity, company permissions and pricing server-side.

## Public demo credentials

The B2B form autofills the buyer demo credentials; the separate admin form autofills administrator credentials. Both are email/password forms without a role selector. Other accounts can sign in by entering their respective credentials.

- Buyer: `buyer@demo.tradehub` / `Demo@123`
- Customer administrator: `manager@demo.tradehub` / `Demo@123`
- System administrator: `admin@demo.tradehub` / `Admin@123`
- Inside sales: `support@demo.tradehub` / `Support@123`
- Field sales: `sales@demo.tradehub` / `Sales@123`

Role-switching dropdowns have been removed from both portals. To use another account, sign out and enter its credentials on the appropriate login page. Company switching remains available for companies linked to the current account. These are publicly labeled example passwords, never production credentials.

## Storefront

The buyer experience has a full-width shopping header and category navigation, without the former administration sidebar. It includes:

- Industrial hero artwork, managed category cards/counts, featured products, company-specific frequently ordered products, and persistent recently viewed items.
- Category and descendant-category filtering, subcategories, brands, company-price ranges, availability, material, six sorting options, grid/list views and pagination.
- Product imagery with a local illustration fallback, detail gallery, technical specifications, downloadable sample datasheet text, delivery information and favorites.
- Negotiated prices, minimum order quantities, stock validation and explicit backorder handling.
- Separate cart and checkout routes with company details, delivery/billing addresses, purchase references, notes, totals and company-specific approval limits.
- Manual multi-SKU entry and reviewed CSV import; duplicate SKUs combine, invalid lines report errors.
- Orders, tracking, current-price reorder, templates, watermarked sample invoice PDFs and local support drafts.
- My Account overview, company profile, delivery-address CRUD, and company-scoped user management/approvals for customer administrators.
- Existing field-sales queue remains available. AI-assisted ordering accepts pasted email/PDF text or a `.txt` file, proposes editable SKU/quantity rows, reports unknown or invalid lines, and adds only reviewed selections to the active company cart. A description search uses local keyword matching. No live model, mailbox connection, PDF extraction or OCR is claimed.

Pricing precedence is a fixed company-specific product rule, otherwise the greater of company discount and product discount. Discounts do not compound. Existing orders retain their captured unit prices even after catalog changes. VAT/tax rate fields are illustrative metadata; tax and shipping are not calculated and remain future Odoo responsibilities.

## Catalog administration

The internal portal retains its enterprise sidebar and tables, with a collapsible navigation panel.

**Categories:** `/admin/categories` supports add/edit/delete, active/featured flags, display order, English/German names, descriptions, image URL or local illustration, icons, parents and subcategories. Slugs must be unique. Self-parenting and circular relationships are rejected. Deleting a populated category requires explicit reassignment outside its subtree; products are never silently removed.

**Products:** `/admin/products` supports add/edit/archive, filters and pagination; full descriptions, images, dynamic category/subcategory assignment, price/discount/tax metadata, company price overrides, stock status/minimum quantity, units, manufacturer references, specifications, datasheet URL and storefront visibility. SKU uniqueness is enforced. Archive removes the item from active shopping/cart views while preserving stable IDs and historical order lines.

Changes flow through shared getter/setter methods and appear immediately in related modules in the same browser. Inactive ancestor categories hide descendant products from the storefront.

## Odoo 17 configuration console

`/admin/odoo` provides:

- Non-sensitive connection fields: name, Odoo 17 version, `.invalid` example URL, database, authentication approach, username, environment, timeout and enable switch.
- Temporary masked demo-credential input kept only in component memory; it is excluded from saved configuration and snapshots.
- Save/reset/test actions and simulated disconnected/testing/connected/error states.
- Nine sync entities, directions, enabled switches, configurable intervals, last-sync time, state and manual actions. Orders target near-real-time transfer; master data targets at least hourly. No scheduled jobs actually run.
- Editable/enabled model and field mapping examples with reset-to-default controls and ERP-partner validation notices.
- KPI overview, detailed sync history, record/success/failure counts, intentional failure simulation and retry.

Checkout creates a local outbound queue event only for accepted orders. Approval creates the event for a high-value order. Simulated order push updates eligible orders to `processing` and ERP state to `synced`; rejected and pending-approval orders are excluded. Master-data actions retain local sample records and record simulated processing counts. No real Odoo validation or synchronization is claimed.

## Persistence and migration

`src/data/seed.json` and `public/seed.json` contain 54 products, 6 companies, 10 main categories and 4 subcategories. Runtime state is saved in **`tradehub-demo-v4`**; the current identity and company are stored separately in `tradehub-session-v3`. Existing v1/v2/v3 snapshots are migrated without changing stable product IDs, carts, order line prices, customer discounts or templates. Legacy single-company assignments become memberships. The v4 upgrade gives the public sample buyer (`u1`, `buyer@demo.tradehub`) exactly two active memberships (c1 and c2), without requiring a reset. Other customer assignments are preserved; subsequent v4 edits are retained. Admin → Users & company access → Edit user & companies manages associations. The first visit after upgrading requires login again. Invalid stored data falls back to seed with a visible message and a recovery copy when storage permits.

Admin Settings supports JSON export/import and confirmed reset. Snapshot import validates IDs, relationships, category cycles, product fields, quantities, totals and configuration. Deployed JSON files remain read-only; there is no cross-browser synchronization. Export/import transfers snapshots manually.

Navigation, category names, product actions, cart/checkout, account navigation, new category/product administration, Odoo form labels and primary validation/status messages support German and English. User-entered product content and some retained legacy page explanatory copy remain in their original language.

## Build and deployment

```bash
npm test
npm run build
npm run preview
```

Vercel: framework **Vite**, build command **`npm run build`**, output directory **`dist`**. Existing `vercel.json` SPA rewrites are preserved. No environment variables or secrets are required. Deploy at the domain root; hosting under an Apache subdirectory requires matching Vite base, router basename and server rewrites. No external deployment was performed.

## Verification

`npm test` runs:

1. 21 domain/access tests: login separation, active company memberships, role isolation, per-company checkout, return destinations, assisted text parsing and search, plus legacy migration, category hierarchy/reassignment, visibility, product SKU/archive behavior, company pricing, quantity validation, captured checkout data, approval queue, simulated sync failure/retry/idempotency, disabled sync, secret filtering, snapshot validation and CSV merging.
2. Seed-copy, relationship and required-route checks.
3. 52 server-rendered route checks covering login-first catalog guards, company-selection gating, membership isolation, distinct login pages, authenticated store/admin screens, populated cart/checkout and German labels.

These render checks do not emulate browser interaction or layout. Browser visual/responsive QA could not run because the computer-use environment reported no available browsers. The source includes responsive layouts; desktop/tablet/mobile interaction remains a manual acceptance step.

Manual walkthrough:

1. Sign out and visit `/`. Verify B2B login appears and no staff credentials are shown. Sign in as buyer, select a linked company, and browse its catalog. Visit My Account → Switch company and confirm a different company has its own cart and prices. A direct `/store/catalog` link before login must redirect to login.
2. At `/admin/login`, sign in as system administrator. Add an active category, then a product assigned to it. Return to the storefront and search for the new SKU.
3. Use Quick Order to review SKU rows/CSV, or AI-assisted ordering to review suggested lines from copied text. Add valid quantities and checkout. To exercise approval with existing stock, add `TLS-3201` quantity 5; its total exceeds Müller's EUR 1,000 threshold. Switch to customer administrator and approve the order.
4. Switch to system administrator and run Orders sync. Return to the buyer order to see `processing` and `synced`.
5. Change a company discount or product price rule; confirm future prices update and historical orders retain captured prices.
6. Save Odoo demo configuration, test simulated connection, run a deliberate failed sync and retry. Refresh: configuration remains; the temporary credential is blank.
7. Export JSON, reset and import. Verify restoration of categories, products, orders, addresses and settings.

## Main source files

- `src/App.jsx`: login, company-selection and protected company/role routes; `src/main.jsx`: entry point.
- `src/components/storefront/Storefront.jsx`: shopping header, category/product cards and pagination.
- `src/pages/storefront/ShoppingPages.jsx`: homepage, catalog, product, cart and checkout.
- `src/pages/storefront/AccountPages.jsx`: account, addresses, customer users and bulk ordering.
- `src/pages/storefront/LoginPage.jsx`: separate customer/internal login views and return navigation.
- `src/pages/storefront/CompanySelection.jsx`: linked-company chooser.
- `src/pages/storefront/AssistedOrder.jsx`: reviewable text-order and keyword search previews.
- `src/services/accessService.js`, `assistedOrderService.js`: membership/identity rules and local parsing.
- `src/pages/admin/CatalogManagement.jsx`: category/product management.
- `src/pages/admin/OdooConsole.jsx`: integration console.
- `src/context/DemoContext.jsx`: shared getter/setter API and browser persistence.
- `src/services/catalogService.js`, `odooService.js`, `domain.js`, `migration.js`: domain rules and data migration.
- `src/pages/StorePages.jsx`, `AdminPages.jsx`, `src/components/UI.jsx`: retained order, invoice, support, operational and sales workflows.
- `src/commerce.css`: storefront and upgraded management styling.
- `src/utils/i18n.js`: English/German UI labels.

`DEVELOPMENT_PROMPT.md` and `DEPLOYMENT_GUIDE.md` preserve the original supplied reference documents. Their original route and storage descriptions predate this upgrade; this README describes the current implementation.


### Staff roles and AI configuration

The B2B form has a separate, full-width Admin login link. `/admin/login` has staff account cards for System administrator, Inside sales and Field sales; selecting a card fills public demo credentials. A separate “Back to B2B customer login” link returns to the customer form. No session role switcher appears there.

- `/admin/roles`: create/edit permission profiles, assign staff accounts, disable profiles, and delete unassigned roles. Navigation and route access follow the assigned profile. The full-access system role and last active administrator are protected.
- `/admin/ai`: save demo provider/model/endpoint settings, enable or disable text-order and description-search features, and simulate configuration checks with history. Changes persist in browser storage and snapshots. The temporary demo key is never stored or exported.

This remains a static demo: role restrictions are client-side, and AI provider requests are simulated. A real backend must enforce permissions and hold API secrets before production integration. Planned provider fields do not change the deterministic local parser.

Styles load through `src/styles.css`, which imports `base.css` followed by `commerce.css`. Keep this order so the shared controls and responsive storefront layouts load together.

### End-to-end browser verification

`npm run test:e2e` runs the document acceptance journeys using Chrome DevTools Protocol (Node 22+), with no extra testing dependency. Start the app or production preview and a separate Chrome instance with `--headless --remote-debugging-port=9223 --user-data-dir=/tmp/tradehub-qa-chrome`, then run:

```bash
E2E_BASE_URL=http://localhost:4173 npm run test:e2e
```

Set `E2E_CDP_URL` to change the debugging endpoint. For the LAN HTTP regression, use the machine's network address as `E2E_BASE_URL`; localhost is considered secure by browsers and does not reproduce the `randomUUID` limitation. The runner creates and disposes an isolated browser context. It does not reset or mutate an existing browser/profile's demo data. Each run saves JSON results, downloaded CSV/JSON/PDF files and screenshots under the printed `/tmp/tradehub-e2e-*` directory. `E2E_FILTER` optionally selects scenario names; an unfiltered run is required for complete acceptance coverage.

Coverage includes login and company isolation, SKU search/favorites, checkout and approval, simulated Odoo sync and fulfillment, real demo PDF download, negotiated pricing, CSV duplicates/errors, templates/reorder, AI review/configuration, support drafts, product/category creation, customer users/addresses, role restrictions, snapshot export/reset/import/rejection, field-sales drafts, dropdown dismissal, EN/DE navigation and 1440/768/390px customer layouts. It checks browser exceptions and HTTP error responses. The domain suite separately verifies data constraints, role protection, migration, secret exclusion, SKU uniqueness and synchronization retry behavior.

Two end-to-end regressions are covered: changing Quick Order row structure invalidates the reviewed result; a failed field-sales draft transfer retains the draft and adds no partial lines to the cart, allowing a safe retry.

Latest verification (29 October 2026): all 29 unfiltered browser scenarios passed against the compiled Vite production preview over LAN HTTP, with no captured runtime exceptions or HTTP error responses. Four automated test files, 60 server-render route checks and the production build passed. Desktop/mobile screenshots and the downloaded demo invoice were inspected. The build still reports a non-blocking main-chunk size warning (approximately 535 kB minified).

### Comparison with supplied requirements

The supplied static master prompt and deployment guide define a frontend-only demo, while the project concept PDF describes the future production system. The storefront upgrade brief and latest requested login flow take precedence over older persona-switch instructions. Customer login therefore selects a linked company; staff use a separate login; in-session role switching is intentionally absent.

The static demo demonstrates the core order, approval, pricing, invoice, administration and simulated ERP journeys. Production PDF requirements remain outside this implementation: live Odoo transfer/hourly jobs, server-enforced authentication/tenant permissions, shared database persistence, real invoice provenance, native iOS/Android offline sync/barcode scanning, mailbox/PDF OCR and live AI, production-scale load testing, EU hosting verification and GDPR assessment. Partial translation is consistent with the static guide; full German localization is unfinished.

One functional gap against the concept PDF remains: customer administrators can manage company users and approve/reject purchases, but cannot edit their company's approval rules/limits themselves. Internal Admin → Customers currently controls those limits. Local preview direct links and `vercel.json` are checked; actual deployed Vercel routing has not been verified without a deployment URL.


### Create customer users and assign companies

Open **Users & company access** from the admin sidebar or **Create / manage users** on the dashboard. Choose **Create user**, enter the name, email and public demo password, then select one or more companies. Each assignment has an independent Buyer/Customer Administrator role and active flag. **Edit user & companies** changes existing user details, account status and memberships; name/email search and a company filter help find users. Empty assignments, duplicate emails and invalid memberships are rejected. On customer login, only active assigned companies appear. Staff accounts remain under **Roles & permissions → Staff accounts**. These changes persist locally; no invitation email or real authentication service is involved.

### Default interface language

German (`de`, Deutsch) is the default, matching the original German project concept. English remains selectable. Preferences persist under `tradehub-language-v4`, superseding the earlier English default without changing business data. The HTML `lang` attribute follows the selection. Browser tests check the German default, migration from the earlier English preference, and German/English selection persistence.
