import { translate } from "../../utils/i18n";
import { LanguageSelector } from "../LanguageSelector";
import React, { useState, useRef, useEffect } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Search,
  ShoppingCart,
  ChevronDown,
  ArrowRight,
  Heart,
  Package,
  ShieldCheck,
  Truck,
  Menu,
  User,
  Zap,
  Wrench,
  Settings,
} from "lucide-react";
import { useDemo } from "../../context/DemoContext";
import { Art } from "../UI";
import { money } from "../../services/domain";
import { categoryVisible } from "../../services/catalogService";
export const categoryName = (category, lang) =>
  lang === "de"
    ? category?.nameDe || category?.name
    : translate(lang, category?.name);
export function ProductImage({ product, index = 0, large = false }) {
  const [failed, setFailed] = useState("");
  const url = product.images?.[index] || product.image;
  return url && failed !== url ? (
    <div className={"photo " + (large ? "large" : "")}>
      <img src={url} alt={product.name} onError={() => setFailed(url)} />
    </div>
  ) : (
    <Art
      category={product.illustration || product.category || "Tools"}
      large={large}
    />
  );
}
export function ShopCard({ product: p }) {
  const d = useDemo(),
    nav = useNavigate(),
    [qty, setQty] = useState(p.minOrderQty || 1);
  const category = d.getCategoryById(p.categoryId),
    saved = !!d.user && (d.state.favorites[d.company.id] || []).includes(p.id);
  const discount =
    d.user && p.price ? Math.round((1 - d.price(p) / p.price) * 100) : 0;
  return (
    <article className="shop-product">
      <div className="shop-product-visual">
        <Link to={"/store/products/" + p.id}>
          <ProductImage product={p} />
        </Link>
        {discount > 0 && <span className="discount-ribbon">−{discount}%</span>}
        <button
          className={"favorite " + (saved ? "selected" : "")}
          aria-label={d.t(saved ? "Remove favorite" : "Save to favorites")}
          onClick={() =>
            d.user
              ? d.favorite(p.id)
              : nav(
                  "/login?next=" +
                    encodeURIComponent("/store/products/" + p.id),
                )
          }
        >
          <Heart size={17} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="shop-product-body">
        <div className="product-meta">
          {p.brand} <span>{p.sku}</span>
        </div>
        <Link className="shop-product-name" to={"/store/products/" + p.id}>
          {d.lang === "de" ? p.nameDe || p.name : p.name}
        </Link>
        <span className="product-category">
          {categoryName(category, d.lang)}
        </span>
        <div className={"stock " + (!p.stock ? "low" : "")}>
          ●{" "}
          {d.t(
            p.stockStatus === "unavailable"
              ? "Unavailable"
              : p.stock > 0
                ? "In stock"
                : "Backorder",
          )}
          {p.stock > 0 ? ` · ${p.stock}` : ` · ${p.leadDays} ${d.t("days")}`}
        </div>
        {d.user ? (
          <>
            <div className="shop-price">
              <b>{money(d.price(p))}</b>
              <small>
                {discount > 0 && <s>{money(p.price)}</s>} / {p.unit}
              </small>
            </div>
            <div className="shop-buy">
              <input
                aria-label={`${d.t("Quantity")} ${p.sku}`}
                type="number"
                min={p.minOrderQty}
                max={p.stockStatus === "backorder" ? 99999 : p.stock}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
              <button
                className="primary"
                disabled={p.stockStatus === "unavailable"}
                onClick={() => d.add([{ productId: p.id, qty }])}
              >
                <ShoppingCart size={15} />
                {d.t("Add to cart")}
              </button>
            </div>
          </>
        ) : (
          <div className="login-price">
            <Link
              className="secondary"
              to={
                "/login?next=" + encodeURIComponent("/store/products/" + p.id)
              }
            >
              {d.t("Log in to see prices")}
            </Link>
          </div>
        )}
        <Link className="product-details-link" to={"/store/products/" + p.id}>
          {d.t("View details")} <ArrowRight size={13} />
        </Link>
      </div>
    </article>
  );
}
export function CategoryCard({ category }) {
  const d = useDemo();
  const children = new Set([category.id]);
  let change = true;
  while (change) {
    change = false;
    for (const c of d.state.categories)
      if (children.has(c.parentId) && !children.has(c.id)) {
        children.add(c.id);
        change = true;
      }
  }
  const count = d
    .getProducts(true)
    .filter((p) => children.has(p.categoryId)).length;
  const Icon =
    { Package, Zap, Wrench, Shield: ShieldCheck, Settings }[category.icon] ||
    Package;
  return (
    <Link
      className="shop-category"
      to={"/store/catalog?category=" + category.id}
    >
      <ProductImage
        product={{
          ...category,
          images: category.image ? [category.image] : [],
        }}
      />
      <div>
        <Icon size={13} className="category-symbol" />
        <strong>{categoryName(category, d.lang)}</strong>
        <span>
          {count} {d.t("products")}
        </span>
      </div>
      <ArrowRight size={17} />
    </Link>
  );
}
export function Pagination({ page, count, onChange, pageSize = 12 }) {
  const { t } = useDemo();
  const pages = Math.max(1, Math.ceil(count / pageSize));
  return (
    <div className="pagination">
      <button
        className="secondary"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >
        {t("Previous")}
      </button>
      <span>
        {t("Page")} {page} {t("of")} {pages}
      </span>
      <button
        className="secondary"
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
      >
        {t("Next")}
      </button>
    </div>
  );
}
export function StorefrontShell() {
  const d = useDemo(),
    nav = useNavigate();
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [menu, setMenu] = useState(false);
  const accountDropdown = useRef(null);
  const categoryDropdown = useRef(null);
  const mobileMenu = useRef(null);
  const mobileMenuButton = useRef(null);
  const location = useLocation();
  useEffect(() => {
    const dismiss = (event) => {
      const escape = event.type === "keydown" && event.key === "Escape";
      if (event.type === "keydown" && !escape) return;
      for (const ref of [accountDropdown, categoryDropdown]) {
        const dropdown = ref.current;
        if (dropdown?.open && (escape || !dropdown.contains(event.target))) {
          dropdown.open = false;
          if (escape) dropdown.querySelector("summary")?.focus();
        }
      }
      if (
        menu &&
        (escape ||
          (!mobileMenu.current?.contains(event.target) &&
            !mobileMenuButton.current?.contains(event.target)))
      ) {
        setMenu(false);
        if (escape) mobileMenuButton.current?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss, true);
    document.addEventListener("keydown", dismiss, true);
    return () => {
      document.removeEventListener("pointerdown", dismiss, true);
      document.removeEventListener("keydown", dismiss, true);
    };
  }, [menu]);
  useEffect(() => {
    for (const ref of [accountDropdown, categoryDropdown]) {
      if (ref.current) ref.current.open = false;
    }
    setMenu(false);
  }, [location.pathname, location.search]);
  const categories = d
    .getCategories()
    .filter((c) => categoryVisible(d.state.categories, c.id));
  const accountLinks = [
    ["Switch company", "/companies"],
    ["AI-assisted ordering", "/store/ai-preview"],
    ["Account overview", "/store/account"],
    ["Company profile", "/store/account/company"],
    ["Order history", "/store/orders"],
    ["Invoices", "/store/invoices"],
    ["Favorites", "/store/favorites"],
    ["Saved order templates", "/store/templates"],
    ["Delivery addresses", "/store/account/addresses"],
    ...(d.user?.role === "customer_admin"
      ? [
          ["User management", "/store/account/users"],
          ["Order approvals", "/store/approvals"],
        ]
      : []),
  ];
  return (
    <div className="storefront">
      <div className="shop-topline">
        <span>
          <ShieldCheck size={13} />
          {d.t("Business buying, without the busywork.")}
        </span>
        <span>
          {d.user
            ? `${d.company.name} · ${d.company.tier}`
            : d.t("Professional supply, personal service.")}
        </span>
      </div>
      <header className="shop-header">
        <div className="shop-header-main">
          <Link to="/store" className="shop-logo">
            <span className="brand-mark">
              t<span>h</span>
            </span>
            {d.state.settings.portalName}
            <span className="brand-dot">.</span>
          </Link>
          <form
            className="shop-search"
            onSubmit={(e) => {
              e.preventDefault();
              nav(
                `/store/catalog?q=${encodeURIComponent(search)}&category=${category}`,
              );
            }}
          >
            <select
              aria-label={d.t("Categories")}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">{d.t("All categories")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parentId ? "↳ " : ""}
                  {categoryName(c, d.lang)}
                </option>
              ))}
            </select>
            <input
              aria-label={d.t("Search")}
              placeholder={d.t("Search products, brands or SKUs")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button aria-label={d.t("Search")}>
              <Search size={21} />
            </button>
          </form>
          <div className="shop-header-tools">
            <LanguageSelector />
            {d.user ? (
              <details className="account-dropdown" ref={accountDropdown}>
                <summary>
                  <User size={21} />
                  <span>
                    <small>{d.user.name}</small>
                    {d.t("My account")} ▾
                  </span>
                </summary>
                <div className="account-popover">
                  <b>{d.company.name}</b>
                  {accountLinks.map(([label, path]) => (
                    <Link
                      key={path}
                      to={path}
                      onClick={(e) =>
                        e.currentTarget
                          .closest("details")
                          .removeAttribute("open")
                      }
                    >
                      {d.t(label)}
                    </Link>
                  ))}
                  <button
                    className="text-link"
                    onClick={() => {
                      d.login("");
                      nav("/login");
                    }}
                  >
                    {d.t("Sign out")}
                  </button>
                </div>
              </details>
            ) : (
              <Link className="guest-login-button" to="/login">
                <User size={20} />
                {d.t("Log in")}
              </Link>
            )}
            <Link className="shop-cart-link" to="/store/cart">
              <span>
                <ShoppingCart size={24} />
                <b>{d.user ? d.cart.reduce((n, i) => n + i.qty, 0) : 0}</b>
              </span>
              <span>{d.t("Cart")}</span>
            </Link>
          </div>
        </div>
        <nav className="shop-navigation">
          <button
            ref={mobileMenuButton}
            className="shop-menu-toggle"
            aria-expanded={menu}
            aria-controls="shop-category-menu"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={17} />
            {d.t("Categories")}
          </button>
          <div
            ref={mobileMenu}
            id="shop-category-menu"
            className={"shop-nav-links " + (menu ? "expanded" : "")}
          >
            <details className="category-dropdown" ref={categoryDropdown}>
              <summary>
                <Menu size={17} />
                {d.t("All categories")}
                <ChevronDown size={14} />
              </summary>
              <div>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to={"/store/catalog?category=" + c.id}
                    onClick={(e) => {
                      setMenu(false);
                      e.currentTarget
                        .closest("details")
                        .removeAttribute("open");
                    }}
                    className={c.parentId ? "subcategory-link" : ""}
                  >
                    {categoryName(c, d.lang)}
                  </Link>
                ))}
              </div>
            </details>
            {categories
              .filter((c) => !c.parentId)
              .slice(0, 4)
              .map((c) => (
                <Link key={c.id} to={"/store/catalog?category=" + c.id}>
                  {categoryName(c, d.lang)}
                </Link>
              ))}
          </div>
          <div className="shop-nav-shortcuts">
            <NavLink to="/store/quick-order">
              <Zap size={15} />
              {d.t("Quick order")}
            </NavLink>
            <NavLink to="/store/ai-preview">
              {d.t("AI-assisted ordering")}
            </NavLink>
            <NavLink to="/store/orders">{d.t("Orders")}</NavLink>
          </div>
        </nav>
      </header>
      {d.storageError && (
        <div role="alert" className="notice">
          {d.storageError}
        </div>
      )}
      <main className="shop-main">
        <Outlet />
      </main>
      <section className="shop-benefits">
        <div>
          <ShieldCheck />
          {d.t("Contract pricing")}
        </div>
        <div>
          <Package />
          {d.t("Personal purchasing controls")}
        </div>
        <div>
          <Truck />
          {d.t("Reliable availability")}
        </div>
      </section>
      <footer className="shop-footer">
        <div>
          <Link to="/store" className="shop-logo">
            {d.state.settings.portalName}
            <span>.</span>
          </Link>
          <p>{d.t("Professional supply, personal service.")}</p>
          <small>{d.t("Demo only · browser-local data")}</small>
        </div>
        <div>
          <b>{d.t("My account")}</b>
          <Link to="/store/orders">{d.t("Orders")}</Link>
          <Link to="/store/invoices">{d.t("Invoices")}</Link>
          <Link to="/store/account/addresses">{d.t("Delivery addresses")}</Link>
        </div>
        <div>
          <b>{d.t("Business account")}</b>
          <Link to="/store/quick-order">{d.t("Quick order")}</Link>
          <Link to="/store/templates">{d.t("Templates")}</Link>
          <Link to="/store/support">{d.t("Support")}</Link>
        </div>
        <div>
          <b>TradeHub · DACH</b>
          <p>
            {d.t("Fictional demonstration brand")}
            <br />
            {d.t("Germany · Austria · Switzerland")}
          </p>
          <small>{d.t("VAT and shipping calculated in Odoo.")}</small>
        </div>
      </footer>
      {d.toast && (
        <div role="status" className="toast">
          {d.toast}
        </div>
      )}
    </div>
  );
}
