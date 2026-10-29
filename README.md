# TradeHub · Static B2B storefront and operations portal

An existing Vite/React demo upgraded in place for a fictional DACH industrial wholesaler. The buyer storefront, internal operations portal, and Odoo configuration console share one browser-local data store. No backend, database service, live authentication, or external ERP requests are used.

## Run locally

Requires Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:5173. The landing page now opens the public storefront, not the login page.

- `/` and `/store`: public shopping homepage.
- `/store/catalog`: public category/search/filter results.
- `/store/products/:id`: public product details.
- `/login`: buyer, customer administrator and field-sales demo login.
- `/admin/login`: separate system administrator and inside-sales demo login.
- `/store/cart`, `/store/checkout`, account pages and purchasing tools require demo login.
- `/admin/*`: internal operations, guarded by the internal demo roles.

Guests can browse products, images, categories, availability and technical details. Prices, discounts, quantity controls and Add to Cart actions are hidden. Product cards and detail pages instead show **Log in to see prices**. Buyer login returns to the originating product or protected storefront page. Signing out returns to the public storefront.

This is a simulated presentation gate, not a security boundary: sample prices remain in bundled JSON and localStorage. A production application must enforce authentication, tenant permissions and price visibility on the server.

## Public demo credentials

The relevant login page autofills credentials when a persona is selected.

- Buyer: `buyer@demo.tradehub` / `Demo@123`
- Customer administrator: `manager@demo.tradehub` / `Demo@123`
- System administrator: `admin@demo.tradehub` / `Admin@123`
- Inside sales: `support@demo.tradehub` / `Support@123`
- Field sales: `sales@demo.tradehub` / `Sales@123`

Logged-in users can switch demo personas from the account dropdown. These are publicly labeled example passwords, never production credentials.

## Storefront

The buyer experience has a full-width shopping header and category navigation, without the former administration sidebar. It includes:

- Industrial hero artwork, managed category cards/counts, featured products, company-specific frequently ordered products, and persistent recently viewed items.
- Category and descendant-category filtering, subcategories, brands, customer-price ranges after login, availability, material, six sorting options, grid/list views and pagination.
- Product imagery with a local illustration fallback, detail gallery, technical specifications, downloadable sample datasheet text, delivery information and favorites.
- Negotiated prices, minimum order quantities, stock validation and explicit backorder handling.
- Separate cart and checkout routes with company details, delivery/billing addresses, purchase references, notes, totals and company-specific approval limits.
- Manual multi-SKU entry and reviewed CSV import; duplicate SKUs combine, invalid lines report errors.
- Orders, tracking, current-price reorder, templates, watermarked sample invoice PDFs and local support drafts.
- My Account overview, company profile, delivery-address CRUD, and company-scoped user management/approvals for customer administrators.
- Existing field-sales queue and deterministic text-ordering previews remain available.

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

`src/data/seed.json` and `public/seed.json` contain 54 products, 6 companies, 10 main categories and 4 subcategories. Runtime state is saved in **`tradehub-demo-v2`**. Existing `tradehub-demo-v1` snapshots are migrated without changing stable product IDs, carts, order line prices, customer discounts or templates. Invalid stored data falls back to seed with a visible message and a recovery copy when storage permits.

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

1. 13 domain tests: legacy migration, category hierarchy/reassignment, visibility, product SKU/archive behavior, company pricing, quantity validation, captured checkout data, approval queue, simulated sync failure/retry/idempotency, disabled sync, secret filtering, snapshot validation and CSV merging.
2. Seed-copy, relationship and required-route checks.
3. 40 server-rendered route checks covering public price gating, distinct login pages, authenticated store/admin screens, populated cart/checkout and German labels.

These render checks do not emulate browser interaction or layout. Browser visual/responsive QA could not run because the computer-use environment reported no available browsers. The source includes responsive layouts; desktop/tablet/mobile interaction remains a manual acceptance step.

Manual walkthrough:

1. Sign out and visit `/`. Browse a product; verify prices are hidden. Click **Log in to see prices**, sign in as buyer, and verify return to that product with its contract price and cart action.
2. At `/admin/login`, sign in as system administrator. Add an active category, then a product assigned to it. Return to the storefront and search for the new SKU.
3. Add valid quantities and checkout. To exercise approval with existing stock, add `TLS-3201` quantity 5; its total exceeds Müller's EUR 1,000 threshold. Switch to customer administrator and approve the order.
4. Switch to system administrator and run Orders sync. Return to the buyer order to see `processing` and `synced`.
5. Change a company discount or product price rule; confirm future prices update and historical orders retain captured prices.
6. Save Odoo demo configuration, test simulated connection, run a deliberate failed sync and retry. Refresh: configuration remains; the temporary credential is blank.
7. Export JSON, reset and import. Verify restoration of categories, products, orders, addresses and settings.

## Main source files

- `src/App.jsx`: public routes and protected role routes; `src/main.jsx`: entry point.
- `src/components/storefront/Storefront.jsx`: shopping header, category/product cards and pagination.
- `src/pages/storefront/ShoppingPages.jsx`: homepage, catalog, product, cart and checkout.
- `src/pages/storefront/AccountPages.jsx`: account, addresses, customer users and bulk ordering.
- `src/pages/storefront/LoginPage.jsx`: separate customer/internal login views and return navigation.
- `src/pages/admin/CatalogManagement.jsx`: category/product management.
- `src/pages/admin/OdooConsole.jsx`: integration console.
- `src/context/DemoContext.jsx`: shared getter/setter API and browser persistence.
- `src/services/catalogService.js`, `odooService.js`, `domain.js`, `migration.js`: domain rules and data migration.
- `src/pages/StorePages.jsx`, `AdminPages.jsx`, `src/components/UI.jsx`: retained order, invoice, support, operational and sales workflows.
- `src/commerce.css`: storefront and upgraded management styling.
- `src/utils/i18n.js`: English/German UI labels.

`DEVELOPMENT_PROMPT.md` and `DEPLOYMENT_GUIDE.md` preserve the original supplied reference documents. Their original route and storage descriptions predate this upgrade; this README describes the current implementation.
