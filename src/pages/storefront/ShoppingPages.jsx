import React, { useEffect, useMemo, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  Grid2X2,
  List,
  Heart,
  Download,
  ShieldCheck,
  Truck,
  Package,
  ShoppingCart,
} from "lucide-react";
import { useDemo } from "../../context/DemoContext";
import { Heading, Empty } from "../../components/UI";
import {
  ShopCard,
  CategoryCard,
  ProductImage,
  Pagination,
  categoryName,
} from "../../components/storefront/Storefront";
import {
  categoryIds,
  categoryVisible,
  productVisible,
  quantityIssue,
} from "../../services/catalogService";
import { money, totalFor } from "../../services/domain";
export function ShopHome() {
  const d = useDemo(),
    products = d.getProducts(true),
    categories = d
      .getCategories()
      .filter((c) => !c.parentId && categoryVisible(d.state.categories, c.id));
  const frequency = {};
  d.state.orders
    .filter(
      (o) =>
        o.companyId === d.company.id &&
        !["canceled", "rejected"].includes(o.status),
    )
    .forEach((o) =>
      o.items.forEach(
        (i) => (frequency[i.productId] = (frequency[i.productId] || 0) + i.qty),
      ),
    );
  const frequent = d.user
    ? products
        .filter((p) => frequency[p.id])
        .sort((a, b) => frequency[b.id] - frequency[a.id])
        .slice(0, 4)
    : [];
  const recent = d.user
    ? (d.state.recentlyViewed[d.company.id] || [])
        .map((pid) => products.find((p) => p.id === pid))
        .filter(Boolean)
        .slice(0, 4)
    : [];
  const target =
    categories.find((c) => c.slug.includes("automation")) || categories[0];
  return (
    <>
      <section className="commerce-hero">
        <div className="commerce-hero-copy">
          <span className="eyebrow">
            {d.t("TRADEHUB / PROFESSIONAL INDUSTRIAL SUPPLY")}
          </span>
          <h1>{d.t("Precision for your next project.")}</h1>
          <p>
            {d.t(
              "Industrial quality. Your contract prices. Everything your business needs, in one place.",
            )}
          </p>
          <div className="inline">
            <Link className="primary" to="/store/catalog">
              {d.t("Shop products")}
              <ArrowRight size={17} />
            </Link>
            <a className="hero-category-link" href="#shop-categories">
              {d.t("Browse categories")} ↗
            </a>
          </div>
          <div className="hero-contract">
            <ShieldCheck size={16} />
            {d.user
              ? `${d.company.name} · ${d.company.tier}`
              : d.t("Business account")}
          </div>
        </div>
        <div className="industrial-collage">
          <div className="hero-grid-lines" />
          <div className="hero-part hero-part-one">
            <ProductImage product={{ category: "Pneumatics" }} large />
          </div>
          <div className="hero-part hero-part-two">
            <ProductImage product={{ category: "Power transmission" }} large />
          </div>
          <div className="hero-part hero-part-three">
            <ProductImage product={{ category: "Tools" }} large />
          </div>
          <span className="industrial-caption">
            {d.t("01 / ENGINEERED FOR YOUR EVERYDAY")}
          </span>
          <div className="hero-stock-tag">
            <span>●</span> {d.t("Reliable availability")}
            <small>{d.t("Precision. Performance. Partnership.")}</small>
          </div>
        </div>
      </section>
      <div className="commerce-value-strip">
        <span>
          <ShieldCheck size={18} />
          {d.t("Contract pricing")}
        </span>
        <span>
          <Package size={18} />
          {d.t("Personal purchasing controls")}
        </span>
        <span>
          <Truck size={18} />
          {d.t("Reliable availability")}
        </span>
        <span>
          {products.length} demo {d.t("products")}
        </span>
      </div>
      <section id="shop-categories" className="shop-section">
        <div className="section-title">
          <div className="section-heading">
            <span className="eyebrow">{d.t("THE RIGHT PART STARTS HERE")}</span>
            <h2>{d.t("Shop by category")}</h2>
          </div>
          <Link to="/store/catalog">{d.t("View all")} →</Link>
        </div>
        <div className="category-card-grid">
          {categories
            .filter((c) => c.featured)
            .map((c) => (
              <CategoryCard key={c.id} category={c} />
            ))}
        </div>
      </section>
      <section className="shop-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">{d.t("SELECTED FOR YOUR BUSINESS")}</span>
            <h2>{d.t("Featured products")}</h2>
          </div>
          <Link to="/store/catalog">{d.t("View all")} →</Link>
        </div>
        <div className="shop-products-grid">
          {products
            .filter((p) => p.featured)
            .slice(0, 4)
            .map((p) => (
              <ShopCard key={p.id} product={p} />
            ))}
        </div>
      </section>
      <div className="commerce-promos">
        <Link
          className="promo-automation"
          to={"/store/catalog?category=" + (target?.id || "")}
        >
          <div>
            <span className="eyebrow">{d.t("SMARTER PRODUCTION")}</span>
            <h2>{categoryName(target, d.lang)}</h2>
            <p>{d.t("Ready for the next shift.")}</p>
            <strong>{d.t("Shop the collection")} →</strong>
          </div>
          <ProductImage product={{ category: "Electrical" }} />
        </Link>
        <Link className="promo-workshop" to="/store/quick-order">
          <span className="eyebrow">{d.t("LESS ADMIN. MORE PROGRESS.")}</span>
          <h2>{d.t("Bulk ordering made easy")}</h2>
          <p>{d.t("Turn your SKU list into an order in seconds.")}</p>
          <strong>{d.t("Quick order")} →</strong>
        </Link>
      </div>
      {!!frequent.length && (
        <section className="shop-section">
          <div className="section-title">
            <h2>{d.t("Frequently ordered")}</h2>
            <Link to="/store/orders">{d.t("Order history")} →</Link>
          </div>
          <div className="shop-products-grid">
            {frequent.map((p) => (
              <ShopCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      {!!recent.length && (
        <section className="shop-section">
          <div className="section-title">
            <h2>{d.t("Recently viewed")}</h2>
          </div>
          <div className="shop-products-grid">
            {recent.map((p) => (
              <ShopCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      <section className="business-promo">
        <div>
          <span className="eyebrow">{d.t("Your business advantage")}</span>
          <h2>{d.t("Professional supply, personal service.")}</h2>
          <p>
            {d.user
              ? `${d.company.tier} · ${d.company.discount}% ${d.t("Discount")}`
              : d.t("Log in to see your contract prices and place orders.")}
          </p>
        </div>
        <Link className="primary" to={d.user ? "/store/account" : "/login"}>
          {d.t(d.user ? "My account" : "Log in")}
          <ArrowRight size={17} />
        </Link>
      </section>
    </>
  );
}
export function ShopCatalog({ favorites = false }) {
  const d = useDemo(),
    [params, setParams] = useSearchParams();
  const [view, setView] = useState("grid");
  const q = params.get("q") || "",
    requested = params.get("category") || "";
  const category = d.state.categories.find(
      (c) => c.id === requested || c.name === requested || c.slug === requested,
    ),
    selected = category?.id || "";
  const sub = params.get("sub") || "",
    brand = params.get("brand") || "",
    availability = params.get("availability") || "",
    material = params.get("material") || "",
    sort = params.get("sort") || "recommended";
  const setFilter = (key, value) =>
    setParams((previous) => {
      previous.set(key, value);
      previous.delete("page");
      if (key === "category") previous.delete("sub");
      return previous;
    });
  const visible = d.getProducts(true),
    ids =
      sub || selected ? categoryIds(d.state.categories, sub || selected) : null;
  let results = visible.filter(
    (p) =>
      (!favorites || (d.state.favorites[d.company.id] || []).includes(p.id)) &&
      (!requested || !!category) &&
      (!ids || ids.has(p.categoryId)) &&
      (!brand || p.brand === brand) &&
      (!availability ||
        (availability === "in_stock"
          ? p.stock > 0 && p.stockStatus !== "unavailable"
          : p.stockStatus === availability)) &&
      (!material || p.specifications.Material === material) &&
      `${p.name} ${p.nameDe} ${p.sku} ${p.brand}`
        .toLowerCase()
        .includes(q.toLowerCase()) &&
      (!d.user ||
        !params.get("min") ||
        d.price(p) >= Number(params.get("min"))) &&
      (!d.user ||
        !params.get("max") ||
        d.price(p) <= Number(params.get("max"))),
  );
  results.sort((a, b) =>
    sort === "name"
      ? a.name.localeCompare(b.name)
      : sort === "name-desc"
        ? b.name.localeCompare(a.name)
        : sort === "low" && d.user
          ? d.price(a) - d.price(b)
          : sort === "high" && d.user
            ? d.price(b) - d.price(a)
            : sort === "new"
              ? b.createdAt.localeCompare(a.createdAt)
              : Number(b.featured) - Number(a.featured),
  );
  const page = Math.min(
    Math.max(1, Number(params.get("page")) || 1),
    Math.max(1, Math.ceil(results.length / 12)),
  );
  const categories = d
    .getCategories()
    .filter((c) => categoryVisible(d.state.categories, c.id));
  return (
    <>
      <div className="shop-breadcrumb">
        <Link to="/store">{d.t("TradeHub")}</Link> /{" "}
        {d.t(favorites ? "Favorites" : "Products")}{" "}
        {category && " / " + categoryName(category, d.lang)}
      </div>
      <Heading
        title={
          favorites
            ? d.t("Favorites")
            : category
              ? categoryName(category, d.lang)
              : d.t("Products for every working day.")
        }
        eyebrow={d.t("INDUSTRIAL SUPPLY")}
      >
        {results.length} {d.t("products")}
        {d.user && ` · ${d.company.name}`}
      </Heading>
      <div className="catalog-layout commerce-catalog">
        <aside className="filters">
          <h3>{d.t("Filters")}</h3>
          <label>
            {d.t("Search")}
            <input value={q} onChange={(e) => setFilter("q", e.target.value)} />
          </label>
          <label>
            {d.t("Category")}
            <select
              value={selected}
              onChange={(e) => setFilter("category", e.target.value)}
            >
              <option value="">{d.t("All categories")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? "↳ " : ""}
                  {categoryName(c, d.lang)}
                </option>
              ))}
            </select>
          </label>
          {selected && categories.some((c) => c.parentId === selected) && (
            <label>
              {d.t("Subcategory")}
              <select
                value={sub}
                onChange={(e) => setFilter("sub", e.target.value)}
              >
                <option value="">{d.t("All categories")}</option>
                {categories
                  .filter((c) => c.parentId === selected)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {categoryName(c, d.lang)}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <label>
            {d.t("Brand")}
            <select
              value={brand}
              onChange={(e) => setFilter("brand", e.target.value)}
            >
              <option value="">{d.t("View all")}</option>
              {[...new Set(visible.map((p) => p.brand))].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          {d.user && (
            <div className="price-filters">
              <label>
                {d.t("Price from")}
                <input
                  type="number"
                  min="0"
                  value={params.get("min") || ""}
                  onChange={(e) => setFilter("min", e.target.value)}
                />
              </label>
              <label>
                {d.t("Price to")}
                <input
                  type="number"
                  min="0"
                  value={params.get("max") || ""}
                  onChange={(e) => setFilter("max", e.target.value)}
                />
              </label>
            </div>
          )}
          <label>
            {d.t("Availability")}
            <select
              value={availability}
              onChange={(e) => setFilter("availability", e.target.value)}
            >
              <option value="">{d.t("All availability")}</option>
              {["in_stock", "backorder", "unavailable"].map((a) => (
                <option key={a} value={a}>
                  {d.t(a)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {d.t("Material")}
            <select
              value={material}
              onChange={(e) => setFilter("material", e.target.value)}
            >
              <option value="">{d.t("All materials")}</option>
              {[
                ...new Set(
                  visible.map((p) => p.specifications.Material).filter(Boolean),
                ),
              ].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <button className="text-link" onClick={() => setParams({})}>
            {d.t("Clear filters")}
          </button>
        </aside>
        <section>
          <div className="catalog-controls">
            <span>
              {results.length} {d.t("products")}
            </span>
            <div>
              <select
                aria-label={d.t("Recommended")}
                value={sort}
                onChange={(e) => setFilter("sort", e.target.value)}
              >
                {[
                  ["recommended", "Recommended"],
                  ["name", "Name A–Z"],
                  ["name-desc", "Name Z–A"],
                  ["low", "Price low to high"],
                  ["high", "Price high to low"],
                  ["new", "Recently added"],
                ]
                  .filter(([v]) => d.user || !["low", "high"].includes(v))
                  .map(([v, l]) => (
                    <option value={v} key={v}>
                      {d.t(l)}
                    </option>
                  ))}
              </select>
              <button
                aria-label={d.t("Grid view")}
                aria-pressed={view === "grid"}
                className="icon-btn"
                onClick={() => setView("grid")}
              >
                <Grid2X2 size={18} />
              </button>
              <button
                aria-label={d.t("List view")}
                aria-pressed={view === "list"}
                className="icon-btn"
                onClick={() => setView("list")}
              >
                <List size={18} />
              </button>
            </div>
          </div>
          {results.length ? (
            <div
              className={
                "shop-products-grid catalog-products " +
                (view === "list" ? "products-list" : "")
              }
            >
              {results.slice((page - 1) * 12, page * 12).map((p) => (
                <ShopCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <Empty>{d.t("No products match your filters.")}</Empty>
          )}
          <Pagination
            page={page}
            count={results.length}
            onChange={(n) =>
              setParams((p) => {
                p.set("page", String(n));
                return p;
              })
            }
          />
        </section>
      </div>
    </>
  );
}
export function ShopProduct() {
  const d = useDemo(),
    nav = useNavigate(),
    { id: pid } = useParams(),
    p = d.getProductById(pid);
  const [qty, setQty] = useState(1),
    [image, setImage] = useState(0),
    [tab, setTab] = useState("Specifications");
  useEffect(() => {
    if (p && productVisible(d.state, p)) {
      if (d.user) d.recordView(pid);
      setQty(p.minOrderQty || 1);
      setImage(0);
    }
  }, [pid]);
  if (!p || !productVisible(d.state, p))
    return <Empty>{d.t("Product unavailable")}</Empty>;
  const category = d.getCategoryById(p.categoryId),
    saved = (d.state.favorites[d.company.id] || []).includes(pid),
    discount = p.price ? Math.round((1 - d.price(p) / p.price) * 100) : 0;
  const datasheet = () => {
    const text = `TradeHub DEMO / NOT MANUFACTURER DOCUMENTATION\n${p.name}\nSKU: ${p.sku}\n${Object.entries(
      p.specifications,
    )
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n")}\nVerify all specifications with the manufacturer.`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = p.sku + "-demo-specifications.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <Link className="back" to="/store/catalog">
        ← {d.t("Back to catalog")}
      </Link>
      <div className="commerce-product-detail">
        <div className="product-gallery">
          <ProductImage product={p} index={image} large />
          <div className="gallery-thumbs">
            {(p.images.length ? p.images : ["front", "detail"]).map((_, i) => (
              <button
                className={image === i ? "selected" : ""}
                aria-label={`${p.name} ${i + 1}`}
                key={i}
                onClick={() => setImage(i)}
              >
                <ProductImage product={p} index={i} />
              </button>
            ))}
          </div>
        </div>
        <div className="product-purchase">
          <span className="eyebrow">
            {p.brand} / {p.sku}
          </span>
          <h1>{d.lang === "de" ? p.nameDe || p.name : p.name}</h1>
          <Link
            className="text-link"
            to={"/store/catalog?category=" + p.categoryId}
          >
            {categoryName(category, d.lang)}
          </Link>
          <p>{p.shortDescription}</p>
          {d.user ? (
            <>
              <div className="product-detail-price">
                <strong>{money(d.price(p))}</strong>
                <span>
                  {discount > 0 && (
                    <>
                      <s>{money(p.price)}</s>
                      <b>−{discount}%</b>
                    </>
                  )}{" "}
                  / {p.unit}
                </span>
              </div>
              <p className="contract-price-note">
                {d.t("Your price")} · {d.company.name}
              </p>
              <div className="stock">
                ● {d.t(p.stockStatus)} · {p.stock} {d.t("pieces")} ·{" "}
                {p.leadDays} {d.t("days")}
              </div>
              <label>
                {d.t("Quantity")}
                <input
                  type="number"
                  min={p.minOrderQty}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                />
              </label>
              <small>
                {d.t("Minimum order")}: {p.minOrderQty} {p.unit}
              </small>
              <div className="product-purchase-actions">
                <button
                  className="primary"
                  onClick={() => d.add([{ productId: pid, qty }])}
                >
                  <ShoppingCart size={18} />
                  {d.t("Add to cart")}
                </button>
                <button className="secondary" onClick={() => d.favorite(pid)}>
                  <Heart size={17} fill={saved ? "currentColor" : "none"} />
                  {d.t(saved ? "Remove favorite" : "Save to favorites")}
                </button>
              </div>
            </>
          ) : (
            <div className="login-price product-login">
              <p>
                {d.t("Log in to see your contract prices and place orders.")}
              </p>
              <Link
                className="primary"
                to={
                  "/login?next=" + encodeURIComponent("/store/products/" + pid)
                }
              >
                {d.t("Log in to see prices")}
                <ArrowRight size={16} />
              </Link>
              <p className="stock">
                ● {d.t(p.stockStatus)} · {p.stock} {d.t("pieces")}
              </p>
            </div>
          )}
          <div className="notice">
            {d.t("VAT and shipping calculated in Odoo.")}
            <br />
            {d.t(
              "Sample technical data; verify with the manufacturer before use.",
            )}
          </div>
        </div>
      </div>
      <section className="panel product-information">
        <div className="tabs">
          {[
            "Description",
            "Specifications",
            "Technical documentation",
            "Delivery information",
          ].map((name) => (
            <button
              key={name}
              className={tab === name ? "active" : ""}
              onClick={() => setTab(name)}
            >
              {d.t(name)}
            </button>
          ))}
        </div>
        {tab === "Description" && <p>{p.description}</p>}
        {tab === "Specifications" && (
          <dl className="specifications">
            {Object.entries({
              ...p.specifications,
              Manufacturer: p.manufacturer,
              "Manufacturer part number": p.manufacturerPartNumber,
              Unit: p.unit,
            }).map(([k, v]) => (
              <React.Fragment key={k}>
                <dt>{d.t(k)}</dt>
                <dd>{v}</dd>
              </React.Fragment>
            ))}
          </dl>
        )}
        {tab === "Technical documentation" && (
          <>
            <p>
              {d.t(
                "Sample technical data; verify with the manufacturer before use.",
              )}
            </p>
            <button className="secondary" onClick={datasheet}>
              <Download size={16} />
              {d.t("Download sample datasheet")}
            </button>
            {p.datasheetUrl && (
              <a
                className="text-link"
                href={p.datasheetUrl}
                target="_blank"
                rel="noreferrer"
              >
                {" "}
                {d.t("Datasheet URL")} ↗
              </a>
            )}
          </>
        )}
        {tab === "Delivery information" && (
          <>
            <h3>
              {d.t("Delivery lead time")}: {p.leadDays} {d.t("days")}
            </h3>
            <p>
              {d.t("Availability")}: {d.t(p.stockStatus)} · {p.stock}{" "}
              {d.t("pieces")}
            </p>
            <p>{d.t("VAT and shipping calculated in Odoo.")}</p>
          </>
        )}
      </section>
      <section className="shop-section">
        <h2>{d.t("Related products")}</h2>
        <div className="shop-products-grid">
          {d
            .getProducts(true)
            .filter(
              (x) =>
                x.id !== pid &&
                (x.categoryId === p.categoryId || x.brand === p.brand),
            )
            .slice(0, 4)
            .map((p) => (
              <ShopCard key={p.id} product={p} />
            ))}
        </div>
      </section>
    </>
  );
}
export function ShopCart({ checkout = false }) {
  const d = useDemo(),
    nav = useNavigate();
  const [reference, setReference] = useState(""),
    [notes, setNotes] = useState(""),
    [name, setName] = useState(""),
    [error, setError] = useState("");
  const [delivery, setDelivery] = useState(d.company.addresses[0]),
    [billing, setBilling] = useState(d.company.billingAddress);
  const lines = d.cart.map((i) => ({
    ...i,
    p: d.getProductById(i.productId),
    unitPrice: d.price(d.getProductById(i.productId)),
  }));
  const total = totalFor(lines);
  const addressForm = (title, value, setter) => (
    <fieldset className="address-form">
      <legend>{d.t(title)}</legend>
      {["street", "postalCode", "city", "country"].map((k, i) => (
        <label key={k}>
          {d.t(["Street", "Postal code", "City", "Country"][i])}
          <input
            required
            value={value[k]}
            onChange={(e) => setter({ ...value, [k]: e.target.value })}
          />
        </label>
      ))}
    </fieldset>
  );
  const submit = (e) => {
    e.preventDefault();
    try {
      d.checkout(reference, notes, {
        deliveryAddress: delivery,
        billingAddress: billing,
      });
      d.notify("Order created");
      nav("/store/orders");
    } catch (err) {
      setError(d.t(err.message));
    }
  };
  return (
    <>
      <div className="shop-breadcrumb">
        <Link to="/store">{d.t("TradeHub")}</Link> /{" "}
        <Link to="/store/cart">{d.t("Cart")}</Link>
        {checkout && " / " + d.t("Checkout")}
      </div>
      <Heading
        title={d.t(checkout ? "Checkout" : "Your cart")}
        eyebrow={d.company.name}
        action={
          <Link className="text-link" to="/store/catalog">
            ← {d.t("Continue shopping")}
          </Link>
        }
      />
      {!lines.length ? (
        <Empty>{d.t("Your cart is empty.")}</Empty>
      ) : (
        <form onSubmit={submit}>
          <div className="cart-layout shop-cart-layout">
            <div>
              {!checkout ? (
                <>
                  <section className="panel">
                    <div className="section-title">
                      <h2>
                        {lines.length} {d.t("products")}
                      </h2>
                      <button
                        type="button"
                        className="text-link"
                        onClick={() =>
                          d.update((s) => ({
                            ...s,
                            carts: { ...s.carts, [d.company.id]: [] },
                          }))
                        }
                      >
                        {d.t("Clear cart")}
                      </button>
                    </div>
                    {lines.map(({ p, qty, unitPrice }) => (
                      <div className="shop-cart-line" key={p.id}>
                        <Link to={"/store/products/" + p.id}>
                          <ProductImage product={p} />
                        </Link>
                        <div>
                          <Link to={"/store/products/" + p.id}>
                            <b>{p.name}</b>
                          </Link>
                          <small>
                            {p.sku} · {p.brand}
                          </small>
                          <span>
                            {d.t("Unit price")}: {money(unitPrice)}
                          </span>
                          <span>
                            {d.t("Discount")}:{" "}
                            {p.price
                              ? Math.round((1 - unitPrice / p.price) * 100)
                              : 0}
                            %
                          </span>
                          <button
                            type="button"
                            className="text-link"
                            onClick={() => d.setQty(p.id, 0)}
                          >
                            {d.t("Remove")}
                          </button>
                        </div>
                        <input
                          aria-label={`${d.t("Quantity")} ${p.sku}`}
                          type="number"
                          min={p.minOrderQty}
                          value={qty}
                          onChange={(e) =>
                            d.setQty(p.id, Number(e.target.value))
                          }
                        />
                        <strong>{money(qty * unitPrice)}</strong>
                      </div>
                    ))}
                  </section>
                  <section className="panel">
                    <h3>{d.t("Save as template")}</h3>
                    <div className="inline">
                      <input
                        aria-label={d.t("Template name")}
                        placeholder={d.t("Template name")}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      <button
                        type="button"
                        className="secondary"
                        disabled={!name.trim()}
                        onClick={() => {
                          d.saveTemplate(name.trim());
                          setName("");
                        }}
                      >
                        {d.t("Save")}
                      </button>
                    </div>
                  </section>
                </>
              ) : (
                <>
                  <section className="panel">
                    <h2>{d.t("Company information")}</h2>
                    <b>{d.company.name}</b>
                    <p>
                      {d.company.code} · {d.company.tier}
                    </p>
                    <label>
                      {d.t("Delivery addresses")}
                      <select
                        onChange={(e) =>
                          setDelivery(
                            d.company.addresses.find(
                              (a) => a.id === e.target.value,
                            ),
                          )
                        }
                        value={delivery.id}
                      >
                        {d.company.addresses.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.label} · {a.street}, {a.city}
                          </option>
                        ))}
                      </select>
                    </label>
                    <Link className="text-link" to="/store/account/addresses">
                      {d.t("Manage addresses")} →
                    </Link>
                  </section>
                  <div className="two-columns">
                    {addressForm("Delivery address", delivery, setDelivery)}
                    {addressForm("Billing address", billing, setBilling)}
                  </div>
                  <section className="panel">
                    <label>
                      {d.t("Purchase order reference")}
                      <input
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder={d.t("PO-2026-001")}
                      />
                    </label>
                    <label>
                      {d.t("Order notes")}
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                      />
                    </label>
                  </section>
                </>
              )}
            </div>
            <aside className="panel checkout">
              <h2>{d.t("Order summary")}</h2>
              {checkout &&
                lines.map(({ p, qty, unitPrice }) => (
                  <div className="summary-line" key={p.id}>
                    <span>
                      {p.name} × {qty}
                    </span>
                    <b>{money(qty * unitPrice)}</b>
                  </div>
                ))}
              <div className="summary-line">
                <span>{d.t("Subtotal")}</span>
                <b>{money(total)}</b>
              </div>
              <p>{d.t("VAT and shipping calculated in Odoo.")}</p>
              <hr />
              <div className="summary-line total">
                <span>{d.t("Net total")}</span>
                <b>{money(total)}</b>
              </div>
              <div className="notice">
                {d.t("Approval limit")}: {money(d.company.approvalThreshold)}
                {total > d.company.approvalThreshold && (
                  <>
                    <br />
                    <b>{d.t("Approval required")}</b>
                  </>
                )}
              </div>
              {error && (
                <p role="alert" className="error">
                  {error}
                </p>
              )}
              {checkout ? (
                <button className="primary full" type="submit">
                  {d.t("Submit demo order")}
                  <ArrowRight size={16} />
                </button>
              ) : (
                <Link className="primary full" to="/store/checkout">
                  {d.t("Proceed to checkout")}
                  <ArrowRight size={16} />
                </Link>
              )}
              <small>{d.t("No real order or payment is submitted.")}</small>
            </aside>
          </div>
        </form>
      )}
    </>
  );
}
