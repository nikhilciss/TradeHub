import { routePermissions, staffLanding } from "../services/roleService";
import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ClipboardList,
  FileText,
  Heart,
  Layers,
  Zap,
  ShieldCheck,
  Headphones,
  Users,
  Settings,
  Workflow,
  Menu,
  Search,
  ArrowUpRight,
  Box,
  LogOut,
} from "lucide-react";
import { useDemo } from "../context/DemoContext";
import { money } from "../services/domain";
import { labels } from "../utils/i18n";
export const roles = {
  buyer: "B2B buyer",
  customer_admin: "Customer administrator",
  admin: "System administrator",
  inside_sales: "Inside sales",
  field_sales: "Field sales",
};
export const homeFor = (r) =>
  r === "field_sales"
    ? "/sales"
    : ["admin", "inside_sales"].includes(r)
      ? "/admin"
      : "/store";
export function Badge({ value }) {
  const { t } = useDemo();
  return (
    <span className={"badge " + value}>
      {t(value) === value ? String(value).replaceAll("_", " ") : t(value)}
    </span>
  );
}
export function Heading({
  eyebrow = "YOUR WORKSPACE",
  title,
  children,
  action,
}) {
  return (
    <div className="heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {action}
    </div>
  );
}
export function Empty({ children = "No records found." }) {
  const { t } = useDemo();
  return (
    <div className="empty">
      <Box size={32} />
      <h3>{typeof children === "string" ? t(children) : children}</h3>
      <p>{t("Try a different filter or add your first item.")}</p>
    </div>
  );
}
export function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Tab") {
            const nodes = [
              ...e.currentTarget.querySelectorAll(
                "button,input,select,textarea,a[href]",
              ),
            ].filter((n) => !n.disabled);
            if (e.shiftKey && document.activeElement === nodes[0]) {
              e.preventDefault();
              nodes.at(-1)?.focus();
            } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
              e.preventDefault();
              nodes[0]?.focus();
            }
          }
        }}
      >
        <div className="section-title">
          <h2>{title}</h2>
          <button
            autoFocus
            className="icon-btn"
            aria-label="Close dialog"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
export function Art({ category, large = false }) {
  const variant = [
    "Pneumatics",
    "Fasteners",
    "Power transmission",
    "Electrical",
    "Tools",
    "Safety",
  ].indexOf(category);
  return (
    <div className={"product-art " + (large ? "large" : "")}>
      <svg
        viewBox="0 0 240 145"
        aria-label={`${category} illustration`}
        role="img"
      >
        <defs>
          <linearGradient id={"metal" + variant} x2="0.8" y2="1">
            <stop stopColor="#f7fafc" />
            <stop offset=".5" stopColor="#b7c8d0" />
            <stop offset="1" stopColor="#718995" />
          </linearGradient>
        </defs>
        <ellipse
          cx="122"
          cy="119"
          rx="68"
          ry="9"
          fill="#203e4b"
          opacity=".09"
        />
        <g
          fill={`url(#metal${variant})`}
          stroke="#607d8b"
          strokeWidth="2"
          transform="translate(30 12)"
        >
          {variant === 0 ? (
            <>
              <path d="M35 52l35-20 78 22-34 23z" />
              <path d="M35 52v39l79 23V77z" />
              <path d="M114 77l34-23v38l-34 22z" />
              <path d="M143 65l39-23 8 10-42 26" />
              <rect
                x="45"
                y="62"
                width="12"
                height="23"
                rx="3"
                fill="#0c9b8d"
              />
              <circle cx="124" cy="88" r="5" fill="#223f4e" />
            </>
          ) : variant === 1 ? (
            <>
              <path d="M54 47l21-14 26 8 5 24-24 14-25-9z" />
              <path d="M88 71l59 29 12-19-61-29" />
              {[0, 1, 2, 3, 4].map((i) => (
                <path key={i} d={`M${104 + i * 9} ${62 + i * 4}l-10 19`} />
              ))}
            </>
          ) : variant === 2 ? (
            <>
              <circle cx="92" cy="65" r="45" />
              <circle cx="92" cy="65" r="28" fill="#dce8ed" />
              <circle cx="92" cy="65" r="16" fill="#edf3f5" />
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <circle
                  key={i}
                  cx={92 + 36 * Math.cos((i * Math.PI) / 4)}
                  cy={65 + 36 * Math.sin((i * Math.PI) / 4)}
                  r="6"
                  fill="#5f7887"
                />
              ))}
            </>
          ) : variant === 3 ? (
            <>
              <rect x="57" y="27" width="71" height="80" rx="7" />
              <rect x="70" y="40" width="44" height="27" fill="#264b59" />
              <path d="M65 83h53M65 91h53" />
              <circle cx="106" cy="53" r="5" fill="#19b4a2" />
              <path d="M73 27V15m18 12V15m18 12V15" />
            </>
          ) : variant === 4 ? (
            <>
              <path d="M52 25q-22 19-2 37l65 50 14-15-64-49q13-22-2-31l-3 22z" />
              <path d="M88 66l41 35" stroke="#0a9485" strokeWidth="12" />
            </>
          ) : (
            <>
              <path d="M45 88q0-61 47-61t47 61z" fill="#e7b45c" />
              <path d="M35 88h114v13H35z" fill="#cb943e" />
              <path d="M87 27v49m11-49v49" />
            </>
          )}
        </g>
      </svg>
    </div>
  );
}
export function OrderTable({ orders, admin = false }) {
  const { t, state } = useDemo();
  return orders.length ? (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>{t("Order / reference")}</th>
            <th>{t("Date")}</th>
            {admin && <th>{t("Company")}</th>}
            <th>{t("Status")}</th>
            <th>{t("Net amount")}</th>
            <th>{t("ERP · demo")}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <Link
                  className="text-link"
                  to={`${admin ? "/admin" : "/store"}/orders/${o.id}`}
                >
                  {o.number}
                </Link>
                <small>{o.reference || t("No purchase reference")}</small>
              </td>
              <td>{new Date(o.createdAt).toLocaleDateString("de-DE")}</td>
              {admin && (
                <td>
                  {state.companies.find((c) => c.id === o.companyId)?.name ||
                    o.companyId}
                </td>
              )}
              <td>
                <Badge value={o.status} />
              </td>
              <td className="numeric">{money(o.total)}</td>
              <td>
                <Badge value={o.erpStatus} />
              </td>
              <td>
                <Link
                  aria-label={`View ${o.number}`}
                  to={`${admin ? "/admin" : "/store"}/orders/${o.id}`}
                >
                  <ArrowUpRight size={17} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty />
  );
}
export function Shell() {
  const d = useDemo(),
    navigate = useNavigate();
  const [open, setOpen] = useState(false),
    [search, setSearch] = useState("");
  const admin = ["admin", "inside_sales"].includes(d.user.role),
    sales = d.user.role === "field_sales";
  const nav = admin
    ? [
        ["Overview", "/admin", LayoutDashboard],
        ["Orders", "/admin/orders", ClipboardList],
        ["Products", "/admin/products", Package],
        ["Categories", "/admin/categories", Layers],
        ["Customers", "/admin/customers", Users],
        ["Users", "/admin/users", ShieldCheck],
        ["Odoo integration", "/admin/odoo", Workflow],
        ["Roles & permissions", "/admin/roles", ShieldCheck],
        ["AI configuration", "/admin/ai", Zap],
        ["Settings", "/admin/settings", Settings],
      ].filter(([, path]) => d.can(routePermissions[path]))
    : sales
      ? [
          ["Overview", "/sales", LayoutDashboard],
          ["Catalog", "/store/catalog", Package],
          ["Cart", "/store/cart", ShoppingCart],
          ["Orders", "/store/orders", ClipboardList],
        ]
      : [
          ["Overview", "/store", LayoutDashboard],
          ["Catalog", "/store/catalog", Package],
          ["Quick order", "/store/quick-order", Zap],
          ["Orders", "/store/orders", ClipboardList],
          ["Invoices", "/store/invoices", FileText],
          ["Favorites", "/store/favorites", Heart],
          ["Templates", "/store/templates", Layers],
          ...(d.user.role === "customer_admin"
            ? [["Approvals", "/store/approvals", ShieldCheck]]
            : []),
          ["Support", "/store/support", Headphones],
        ];
  return (
    <div className={"app " + (open ? "admin-collapsed" : "")}>
      <aside className={"sidebar " + (open ? "open" : "")}>
        <Link
          className="brand"
          to={admin ? staffLanding(d.state, d.identity) : homeFor(d.user.role)}
        >
          <span className="brand-mark">
            t<span>h</span>
          </span>
          {d.state.settings.portalName.toLowerCase()}
          <span className="brand-dot">.</span>
        </Link>
        <div className="workspace-label">
          {admin
            ? "OPERATIONS CENTER"
            : sales
              ? "FIELD SALES"
              : "CUSTOMER PORTAL"}
        </div>
        <nav>
          {nav.map(([label, path, Icon]) => (
            <NavLink
              end={label === "Overview"}
              onClick={() => setOpen(false)}
              key={path}
              to={path}
            >
              <Icon size={19} />
              {label === "Categories" ? (
                <span>
                  <small className="nav-group-label">
                    {d.t("Catalog management")}
                  </small>
                  {d.t(label)}
                </span>
              ) : (
                d.t(label)
              )}
              {label === "Orders" && (
                <span className="nav-count">
                  {
                    d.state.orders.filter(
                      (o) => admin || o.companyId === d.company.id,
                    ).length
                  }
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="connection-dot">Browser-local demo</div>
          <p>
            Fictional brand. Real possibilities.
            <br />
            No live ERP connection.
          </p>
          <Link to="/store/support">
            Need a hand? <ArrowUpRight size={14} />
          </Link>
        </div>
      </aside>
      {open && (
        <button
          className="drawer-shade"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <div className="main-shell">
        <header className="toolbar">
          <button
            className="admin-menu-toggle icon-btn"
            aria-label="Toggle navigation"
            onClick={() => setOpen(!open)}
          >
            <Menu />
          </button>
          <form
            className="global-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate("/store/catalog?q=" + encodeURIComponent(search));
            }}
          >
            <Search size={18} />
            <input
              aria-label="Search products"
              placeholder="Search products, brands or article numbers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd>↵</kbd>
          </form>
          <div className="toolbar-actions">
            <button
              className="language"
              onClick={() => d.setLang(d.lang === "en" ? "de" : "en")}
            >
              {d.lang.toUpperCase()} / {d.lang === "en" ? "DE" : "EN"}
            </button>
            {!admin && (
              <Link className="cart-button" aria-label="Cart" to="/store/cart">
                <ShoppingCart size={20} />
                <span>{d.cart.reduce((s, i) => s + i.qty, 0)}</span>
              </Link>
            )}
            <span className="avatar">
              {d.user.name
                .split(" ")
                .map((x) => x[0])
                .join("")}
            </span>
            <span className="current-user-name">{d.user.name}</span>
            <button
              className="icon-btn"
              title="Sign out"
              onClick={() => {
                d.login("");
                navigate(admin ? "/admin/login" : "/login");
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <div className="context-bar">
          <span>
            {d.company.name} <b>{d.company.tier} partner</b>
          </span>
          <span>
            Static demonstration <i /> Saved in this browser only
          </span>
        </div>
        {d.storageError && (
          <div role="alert" className="notice">
            {d.storageError}
          </div>
        )}
        <main>
          <Outlet />
        </main>
        <footer>
          © 2026 TradeHub · Fictional demonstration brand{" "}
          <span>
            Prices exclude VAT and shipping · Final calculation in Odoo
          </span>
        </footer>
      </div>
      {d.toast && (
        <div role="status" className="toast">
          ✓ {d.toast}
        </div>
      )}
    </div>
  );
}
