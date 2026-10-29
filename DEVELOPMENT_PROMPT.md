# MASTER DEVELOPMENT PROMPT — ENTERPRISE B2B ORDERING / SERVICE PORTAL STATIC DEMO

You are acting as a senior React/MERN architect, principal UI designer, technical lead and quality engineer. Build a complete, polished and realistically interactive static demonstration of a B2B Ordering & Service Portal for a technical wholesaler operating in Germany, Austria and Switzerland (DACH). Use the requirements below as the source of truth. This is a client-facing proof of concept intended to help stakeholders see the whole user journey and proposed Odoo 17 integration. Work directly inside the provided repository, produce source code (not just a plan), and verify all screens and interactions.

## 1. Non-negotiable technical scope

- **MERN-oriented architecture**: React for the frontend, modular future-ready domain/services/interfaces matching the intended MongoDB + Express + Node implementation. **Do not run a backend** in this demo. No API server, database connection, serverless function or real Odoo calls. Use Vite + React with reusable components and client-side routing. The generated app must deploy as pure static assets on Vercel.
- Ship realistic records in local JSON seed files (`src/data/seed.json` and optionally `public/seed.json`). Hydrate a single shared React Context or equivalent store on initial launch.
- Provide synchronous getter-like selectors and setter-like actions to connect **all pages and roles**: adding an item in the storefront changes the cart; checkout creates an order visible in the operations portal; admin changes statuses visible in customer order tracking; customer discount edits recalculate prices; approval changes the order state; a simulated Odoo push changes ERP status and sync logs.
- For demo mutations use `localStorage` (or IndexedDB when appropriate). Data must survive SPA navigation, role switching and page refreshes within the **same browser**. Support export JSON, import JSON via a user-selected file, and reset to original seed.
- **Do not assert you can write to the deployed Vercel filesystem.** Static hosting does not provide a mutable cross-user database; seed files are read-only once deployed. Clearly label local browser persistence and simulated integrations. Never promise cross-browser synchronization.
- Include `vercel.json` with SPA rewrite to `/index.html`, `package.json`, README, runnable `npm` scripts, and no required secrets/env vars. Do not use mock API endpoints that pretend to respond over a network; perform local state actions instead.
- All login pages MUST have autofilled **publicly labeled demo credentials**, no real authentication. Provide role presets: buyer, customer administrator, system administrator, inside sales, field sales. Role switching must be easy through the app's top-right user dropdown.
- Implement type-safe data modeling if using TypeScript. Build a scalable but clean architecture so a later development team can replace local data adapters with actual Express/MongoDB/Odoo services.

## 2. Business context and mandatory requirements

Client is a mid-sized technical wholesaler, approximately 60 employees, approximately 1,200 business customers. Current approximately 150 daily orders arrive by email, phone or PDF and are manually entered into Odoo 17 ERP. Goal: at least 50% of orders use the portal within 12 months of go-live; automatic ordering into Odoo (production), customer self-service visibility of prices, stock, deliveries and invoices; field-sales orders on site. Existing WordPress corporate site remains separate; portal eventually runs under a subdomain. ERP is Odoo 17 with an external ERP support partner. No SSO needed. Desktop/tablet first, bilingual German and English, EU hosting (Germany preferred), GDPR/DSGVO in production.

**Production target volumes:** ~25,000 products, 1,200 companies, 2–5 purchasing users/company plus customer admin, 15 field sales staff, 12 inside sales staff and 2 administrators. The static demo should ship a representative sample, not 25,000 cumbersome sample rows. Show catalog count as "demo dataset" while labeling production-scale targets separately. User stories and screens must still be designed for scale.

## 3. UX quality / visual bar

Deliver an enterprise-grade product, **not a generic template**. Think polished modern industrial SaaS/B2B commerce. Use a coherent visual system: deep navy side navigation, teal/emerald interaction accents, cool gray page background, elegant white cards, minimal grid lines, legible typography, purposeful whitespace, real responsive layouts, polished tables, thoughtful empty and loading states, visible status pills, subtle shadows, excellent focus/hover affordances and charts drawn with CSS/SVG. Product artworks may be tasteful local vector illustrations by category; never rely on unavailable paid assets. Provide a brand identity clearly stated to be a fictional placeholder, unless supplied with a real company name/logo. Avoid random inconsistent colors and avoid generic stock e-commerce styling.

At minimum implement: full-width responsive login/onboarding experience; desktop fixed navigation + responsive mobile drawer; top toolbar with search, active persona and language switch; cohesive dashboard hero; reusable product cards and detail screens; side-panel catalog filters; clean checkout summary; data tables with search/filters; professional form dialogs; an admin command-center dashboard; a highly visual Odoo mapping/data-flow screen.

Do not build a single mega-page. Use real clickable routes, URL navigation and state transitions; every prominently shown primary CTA must work. All example invoices or ERP statuses must be clearly marked demo. Make navigation and data consistent between modules. Provide sensible keyboard labels and semantic HTML.

## 4. User-facing customer store / buyer portal — MVP

Pages and functions:
1. Login with autofilled buyer credentials; company context and contract tier displayed.
2. Personalized overview dashboard: open orders, delivery/in-transit count, contract discount, saved products, categories, featured/recommended products, recent order list and support CTA.
3. **Product catalog** (design for 25k target, use illustrative JSON): browse category, brand, availability; search by product name, SKU/article number and brand; sort by price/name; show stock, units, lead time, list price vs negotiated company price.
4. Product details with SKU, name, category, brand, rich description, availability, tier price, selected quantity, add to cart, related items, favorites.
5. **Company-specific pricing/discounts** read from shared customer records. All cart/order lines capture the negotiated price at checkout. Admin editing a customer discount should visibly affect catalog and future carts.
6. Cart: quantity update, item removal, clear all, subtotal, notes and client purchase-order reference; show VAT/shipping will be decided in Odoo.
7. **Fast ordering**: article-number manual search and CSV/pasted CSV bulk import with `SKU,quantity`; match SKU, skip unknown entries with useful feedback, prevent duplicates.
8. **Order approval**: when subtotal exceeds customer-specific or default company limit, create `pending_approval` order instead of accepted. Allow a customer administrator to approve/reject; accepted orders become eligible for simulated ERP push.
9. Order history: filter and search, status labels and drilldown with line items, tracking placeholder, delivery stage, references and ERP sync indicator. "Reorder" should repopulate cart.
10. Invoice center: list invoices related by order/customer; download **watermarked sample PDF** files; explicitly state genuine fiscal PDFs must be supplied from Odoo in production.
11. Templates: save cart as named order template, list saved templates, load a template into cart. Favorites/saved items list.
12. Customer company admin: distinct login preset, access to purchase approval queue and relevant purchase-control views; do not conflate this with internal system administration.
13. English/German UI switch (at minimum shared primary navigation and core actions; ideally full copy localization). Prices in EUR and DACH-friendly date formats.

## 5. Internal admin/operations portal — MVP

Accessible by admin and inside-sales demo personas; a separate administration navigation set sharing the SAME data:
1. Executive operations dashboard: order count, indicative order volume, active accounts, role/user count, visual illustrative activity, open order queue and integration health.
2. Product operations: searchable products, stock, list prices, active flags, category and SKU. Demo edit dialog that updates storefront. Note products/stock/pricing remain master-data-controlled by Odoo in production.
3. Order processing: searchable/filterable orders across companies; customer/amount/date/ERP sync; change fulfillment state (submitted, processing, shipped, delivered, canceled), demonstrate invoice creation when appropriate, and reflect customer-side.
4. Customers/contract accounts: company code, tier, discount, purchasing approval limit, location and linked users. Editing discount or limit influences buyer pages.
5. Users and roles: list five user groups; enable/disable demo accounts; add local demo users; visually explain company association; role-based navigation is a demo, not a security guarantee.
6. Integration administration: dedicated Odoo 17 configuration and workflows (next section).
7. Settings: company/portal config, default approval limit, **export data to JSON**, **import snapshot from file**, restore seed data with confirmation.
8. Clear demo support and order exception workflow. A sophisticated UI should never imply that a support request has been sent if no backend exists.

## 6. Odoo 17 integration configuration screen (mandatory visual highlight)

Create a credible **integration center** to showcase the future architecture and technical mapping to stakeholders. The real ERP remains authoritative, the existing WordPress site is unchanged and the portal is under a future subdomain. Show a high-clarity infographic:

`React B2B Storefront / Internal Admin ↔ Future Express/Node API & Odoo Adapter ↔ Odoo 17 ERP`

Inbound to portal from Odoo: products/article data, customer accounts, contract pricelists and discounts, stock availability, order/delivery status, invoice PDFs/metadata. Outbound to Odoo: accepted purchases after approval. Target order transfer **near-real-time**; master-data refresh **at least hourly**.

Include tabs/cards for:
- Overview with demo connection status, last simulated sync, order queue, sync interval and visible callouts.
- Configuration UI: example/non-working Odoo URL (`odoo-demo.example.invalid`), database name, version 17.0, integration user, masked demo placeholder (never store credentials), enabled module toggles, sync interval; Save edits to shared demo store.
- Data mapping table with prospective Odoo models (subject to ERP partner validation): `product.product` / `product.template`, `res.partner`, `product.pricelist`, `stock.quant`, `sale.order`, `account.move`. Label exact fields and custom modules as **TBC** pending discovery. Consider company mappings, pricelist hierarchy, stock reservation/availability, order status and invoice access constraints.
- Simulated buttons: Test connection, sync products, customers, stock, push accepted orders, pull invoices, full sync. Each action updates timestamps/logs and—where appropriate—local order ERP statuses. Show success details and order count; no network calls.
- Sync history table (date/time, direction/entity, success, details). Ideally demonstrate pending → synced → processing status transitions.
- A permanent, prominent disclaimer that no real Odoo authentication or sync occurs and production credentials require server-side protection. Never expose live secrets in React/localStorage.

## 7. Phase 2 sales app preview (not mandatory MVP implementation)

Build a **responsive preview screen** for approximately 15 field-sales employees, accessible with its own autofilled login preset. Salesperson chooses a customer account and views the corresponding pricing/order history, enters SKU orders on the customer's behalf, has barcode-scan UI placeholder and simulates an offline draft queue that can be moved to cart on reconnection. Label it explicitly as a preview: not an installed native iOS/Android app, camera scanner, or offline-first sync engine.

## 8. Optional Phase 3 AI-assisted ordering preview

Add a clearly optional AI preview where a sales order email/PDF text can be pasted, SKU and quantities parsed locally and turned into **reviewable suggested order lines**, and accepted lines added to cart. Use a deterministic regex parser or fixture-based mock; do NOT claim a real LLM, PDF OCR, mailbox reader, semantic search or unseen content analysis. Explain planned natural-language product search as a future feature. A true model would require server-side orchestration and data protection review.

## 9. State model and page relationships

Include realistic demo records with stable IDs:
- companies `{id,name,code,tier,discount,approvalThreshold,creditLimit,city,country}`
- users `{id,name,email,password,role,companyId,active}` (sample credentials only)
- products `{id,sku,name,brand,category,price,stock,unit,leadDays,description,featured,active}`
- carts by company ID `{productId,qty}`
- orders `{id,number,companyId,userId,items,status,total,reference,notes,createdAt,erpStatus,tracking,invoiceId}`
- order items `{productId,sku,name,qty,unitPrice}`
- invoices `{id,number,orderId,companyId,amount,date,status}`
- templates `{id,companyId,name,items}`; favorites by company
- integration settings/mapping/syncLogs.

Build getter/setter style service methods such as `getProducts`, `getCompanyPrice`, `getCart`, `setCartItem`, `addCartBulk`, `createOrder`, `approveOrder`, `updateOrderStatus`, `updateCompanyDiscount`, `updateStock`, `saveOdooSettings`, `simulateOdooSync`, `exportSnapshot`, `importSnapshot`, `resetDemo`. Avoid independent state arrays per page that cause inconsistencies. Keep role and company association meaningful.

## 10. Demo personas and workflow acceptance

Provide clearly public, autofilled sample logins (adjust names if already in repo):

- Buyer: buyer@demo.tradehub / Demo@123
- Customer Administrator: manager@demo.tradehub / Demo@123
- System Administrator: admin@demo.tradehub / Admin@123
- Field Sales: sales@demo.tradehub / Sales@123
- Inside Sales: support@demo.tradehub / Support@123

A judge must be able to:
A. Login as buyer → find `PNE-3201` → add products → place order → see it in order history.
B. Place a high-value order → switch to customer admin → approve → switch to system admin → push order via simulated Odoo sync → return to buyer → see changed status.
C. Change customer discount in admin → switch to buyer → see contract price change.
D. CSV upload SKU/quantity → populate cart, no real server.
E. Save cart as a named template → reload template → reorder.
F. Trigger simulated Odoo connection/sync → see last-sync time/log update and local order status change.
G. Download a labeled demo invoice PDF.
H. Export local JSON snapshot → reset → import snapshot → see restored state.
I. Navigate the app at desktop and tablet widths without clipped tables or inaccessible menu.
J. Open any route directly after deployment without Vercel 404.

## 11. Engineering quality and final output requirements

- Produce complete working source files and a useful README with exact install, build and deploy instructions; do not respond with only pseudocode or a design mock.
- Use clean component boundaries and reusable visual elements; responsive desktop/tablet/mobile. Keep business calculations centralized and deterministic.
- Test seed relationships and validate links/flows. Run `npm install`, `npm test`, `npm run build` and fix errors in an environment with dependency registry access. Do at least one browser-based smoke test of login, adding to cart, checkout, admin order sync and return-to-buyer flow.
- Deliver `vercel.json` SPA fallback, static assets in `dist`, and no server credentials or production API addresses.
- Distinguish **simulation** from actual production capability everywhere that a reasonable client could otherwise misunderstand.
- Keep sample company identity and project effort estimates separate from the actual client; only use real CIS corporate information when it has been provided and verified in explicitly authorized company source documents.

**Final expectation:** a credible clickable enterprise storefront + admin portal + Odoo integration demonstration that feels like a production product but makes no false claims about backend functionality; every step is backed by client-side shared state and is ready for deployment as a static Vite/React site on Vercel.
