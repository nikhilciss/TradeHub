import React, { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useDemo } from "../../context/DemoContext";
import { Heading, Modal, Badge, OrderTable } from "../../components/UI";
import { money, id, parseCSV } from "../../services/domain";
import { quantityIssue, productVisible } from "../../services/catalogService";
export function Account() {
  const d = useDemo(),
    location = useLocation(),
    [editing, setEditing] = useState(null),
    [addingUser, setAddingUser] = useState(false),
    [error, setError] = useState("");
  const page = location.pathname.split("/").at(-1),
    orders = d.state.orders.filter((o) => o.companyId === d.company.id);
  const links = [
    ["Account overview", "/store/account"],
    ["Company profile", "/store/account/company"],
    ["Order history", "/store/orders"],
    ["Order tracking", "/store/orders"],
    ["Invoices", "/store/invoices"],
    ["Saved order templates", "/store/templates"],
    ["Favorites", "/store/favorites"],
    ["Delivery addresses", "/store/account/addresses"],
    ...(d.user.role === "customer_admin"
      ? [
          ["User management", "/store/account/users"],
          ["Order approvals", "/store/approvals"],
        ]
      : []),
  ];
  return (
    <>
      <Heading title={d.t("My account")} eyebrow={d.company.name}>
        {d.t("Track your purchases and manage your business account.")}
      </Heading>
      <div className="account-layout">
        <nav className="account-navigation">
          {links.map(([label, path]) => (
            <NavLink key={label} end to={path}>
              {d.t(label)}
            </NavLink>
          ))}
        </nav>
        <div>
          {page === "account" && (
            <>
              <section className="account-welcome">
                <h2>
                  {d.t("Welcome")}, {d.user.name}
                </h2>
                <p>
                  {d.company.name} · {d.company.tier}
                </p>
                <div className="account-metrics">
                  <div>
                    <b>
                      {
                        orders.filter(
                          (o) =>
                            !["delivered", "canceled", "rejected"].includes(
                              o.status,
                            ),
                        ).length
                      }
                    </b>
                    {d.t("Open orders")}
                  </div>
                  <div>
                    <b>{d.company.discount}%</b>
                    {d.t("Discount")}
                  </div>
                  <div>
                    <b>{(d.state.favorites[d.company.id] || []).length}</b>
                    {d.t("Saved products")}
                  </div>
                </div>
              </section>
              <section className="panel">
                <h2>{d.t("Order history")}</h2>
                <OrderTable orders={orders.slice(0, 5)} />
              </section>
            </>
          )}
          {page === "company" && (
            <section className="panel">
              <h2>{d.t("Company profile")}</h2>
              <dl className="specifications">
                {[
                  ["Company", d.company.name],
                  ["Company code", d.company.code],
                  ["Contract tier", d.company.tier],
                  ["Discount", d.company.discount + "%"],
                  ["Approval limit", money(d.company.approvalThreshold)],
                  ["Credit limit", money(d.company.creditLimit)],
                  ["Email", d.user.email],
                ].map(([k, v]) => (
                  <React.Fragment key={k}>
                    <dt>{d.t(k)}</dt>
                    <dd>{v}</dd>
                  </React.Fragment>
                ))}
              </dl>
              <h3>{d.t("Billing address")}</h3>
              <p>
                {d.company.billingAddress.street}
                <br />
                {d.company.billingAddress.postalCode}{" "}
                {d.company.billingAddress.city}
                <br />
                {d.company.billingAddress.country}
              </p>
              <Link className="text-link" to="/store/support">
                {d.t("Support")} →
              </Link>
            </section>
          )}
          {page === "addresses" && (
            <section className="panel">
              <div className="section-title">
                <h2>{d.t("Delivery addresses")}</h2>
                <button
                  className="primary"
                  onClick={() => {
                    setError("");
                    setEditing({
                      id: id(),
                      label: "",
                      street: "",
                      postalCode: "",
                      city: "",
                      country: "DE",
                    });
                  }}
                >
                  + {d.t("Add address")}
                </button>
              </div>
              <div className="address-cards">
                {d.company.addresses.map((a) => (
                  <article key={a.id}>
                    <h3>{a.label}</h3>
                    <p>
                      {a.street}
                      <br />
                      {a.postalCode} {a.city}
                      <br />
                      {a.country}
                    </p>
                    <div className="inline">
                      <button
                        className="secondary"
                        onClick={() => setEditing({ ...a })}
                      >
                        {d.t("Edit")}
                      </button>
                      <button
                        className="text-link"
                        disabled={d.company.addresses.length < 2}
                        onClick={() =>
                          d.edit("companies", {
                            ...d.company,
                            addresses: d.company.addresses.filter(
                              (x) => x.id !== a.id,
                            ),
                          })
                        }
                      >
                        {d.t("Delete")}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
          {page === "users" && d.user.role === "customer_admin" && (
            <section className="panel">
              <div className="section-title">
                <h2>{d.t("User management")}</h2>
                <button
                  className="primary"
                  onClick={() => {
                    setError("");
                    setAddingUser(true);
                  }}
                >
                  {d.t("Add company user")}
                </button>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      {["Name", "Email", "Role", "Status", "Actions"].map(
                        (k) => (
                          <th key={k}>{d.t(k)}</th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {d.state.users
                      .filter(
                        (u) =>
                          d
                            .getMemberships(u)
                            .some((m) => m.companyId === d.company.id) &&
                          ["buyer", "customer_admin"].includes(u.role),
                      )
                      .map((u) => (
                        <tr key={u.id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            {d.t(
                              d
                                .getMemberships(u)
                                .find((m) => m.companyId === d.company.id)
                                ?.role === "buyer"
                                ? "Business account"
                                : "User management",
                            )}
                          </td>
                          <td>
                            <Badge
                              value={
                                u.active &&
                                d
                                  .getMemberships(u)
                                  .find((m) => m.companyId === d.company.id)
                                  ?.active
                                  ? "active"
                                  : "disabled"
                              }
                            />
                          </td>
                          <td>
                            <button
                              className="secondary compact"
                              disabled={u.id === d.user.id}
                              onClick={() =>
                                d.updateMembership(u.id, d.company.id, {
                                  active: !d
                                    .getMemberships(u)
                                    .find((m) => m.companyId === d.company.id)
                                    ?.active,
                                })
                              }
                            >
                              {d.t(
                                d
                                  .getMemberships(u)
                                  .find((m) => m.companyId === d.company.id)
                                  ?.active
                                  ? "Disable"
                                  : "Enable",
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </div>
      {editing && (
        <Modal title={d.t("Delivery address")} onClose={() => setEditing(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fields = [
                "label",
                "street",
                "postalCode",
                "city",
                "country",
              ];
              if (fields.some((k) => !editing[k].trim())) return;
              d.edit("companies", {
                ...d.company,
                addresses: d.company.addresses.some((a) => a.id === editing.id)
                  ? d.company.addresses.map((a) =>
                      a.id === editing.id ? editing : a,
                    )
                  : [...d.company.addresses, editing],
              });
              d.notify("Address saved");
              setEditing(null);
            }}
          >
            {[
              ["label", "Address label"],
              ["street", "Street"],
              ["postalCode", "Postal code"],
              ["city", "City"],
              ["country", "Country"],
            ].map(([k, l]) => (
              <label key={k}>
                {d.t(l)}
                <input
                  required
                  value={editing[k]}
                  onChange={(e) =>
                    setEditing({ ...editing, [k]: e.target.value })
                  }
                />
              </label>
            ))}
            <button className="primary">{d.t("Save address")}</button>
          </form>
        </Modal>
      )}
      {addingUser && (
        <Modal
          title={d.t("Add company user")}
          onClose={() => setAddingUser(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.target));
              if (
                d.state.users.some(
                  (u) => u.email.toLowerCase() === f.email.toLowerCase(),
                )
              )
                return setError(d.t("Email already exists"));
              d.update((s) => ({
                ...s,
                users: [
                  ...s.users,
                  {
                    ...f,
                    id: id(),
                    companyId: d.company.id,
                    memberships: [
                      { companyId: d.company.id, role: f.role, active: true },
                    ],
                    password: "Demo@123",
                    active: true,
                  },
                ],
              }));
              setAddingUser(false);
              d.notify("User saved");
            }}
          >
            <label>
              {d.t("Name")}
              <input name="name" required />
            </label>
            <label>
              {d.t("Email")}
              <input name="email" type="email" required />
            </label>
            <label>
              {d.t("Role")}
              <select name="role">
                <option value="buyer">{d.t("Business account")}</option>
                <option value="customer_admin">{d.t("User management")}</option>
              </select>
            </label>
            <p className="notice">Demo@123 · {d.t("Local demo only")}</p>
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <button className="primary">{d.t("Save")}</button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function BulkOrder() {
  const d = useDemo(),
    [rows, setRows] = useState(() => [{ key: id(), sku: "", qty: 1 }]),
    [csv, setCSV] = useState("SKU,quantity\nPNE-3201,2"),
    [review, setReview] = useState(null);
  const validate = (text) => {
    const parsed = parseCSV(text, d.getProducts(true));
    const issues = [
        ...parsed.errors.map((message) => {
          const line = message.match(/\((.*)\)$/)?.[1] || message;
          return `${d.t("Unknown SKU")} / ${d.t("Invalid quantity")}: ${line}`;
        }),
      ],
      valid = [];
    for (const item of parsed.items) {
      const p = d.getProductById(item.productId),
        error = quantityIssue(
          p,
          item.qty + (d.cart.find((i) => i.productId === p.id)?.qty || 0),
        );
      if (error) issues.push(`${p.sku}: ${d.t(error)}`);
      else valid.push(item);
    }
    setReview({ items: valid, errors: issues });
  };
  return (
    <>
      <Heading title={d.t("Quick order")} eyebrow={d.t("SKU / CSV")}>
        {d.t("Turn your SKU list into an order in seconds.")}
      </Heading>
      <div className="two-columns">
        <section className="panel">
          <h2>{d.t("Products")}</h2>
          {rows.map((row, index) => (
            <div className="sku-row" key={row.key}>
              <label>
                {d.t("SKU")}
                <input
                  list="bulk-skus"
                  value={row.sku}
                  onChange={(e) => {
                    setRows(
                      rows.map((r) =>
                        r.key === row.key ? { ...r, sku: e.target.value } : r,
                      ),
                    );
                    setReview(null);
                  }}
                />
              </label>
              <label>
                {d.t("Quantity")}
                <input
                  type="number"
                  min="1"
                  value={row.qty}
                  onChange={(e) => {
                    setRows(
                      rows.map((r) =>
                        r.key === row.key
                          ? { ...r, qty: Number(e.target.value) }
                          : r,
                      ),
                    );
                    setReview(null);
                  }}
                />
              </label>
              <button
                className="icon-btn"
                aria-label={d.t("Remove")}
                disabled={rows.length === 1}
                onClick={() => {
                  setRows(rows.filter((r) => r.key !== row.key));
                  setReview(null);
                }}
              >
                ×
              </button>
            </div>
          ))}
          <datalist id="bulk-skus">
            {d.getProducts(true).map((p) => (
              <option key={p.id} value={p.sku}>
                {p.name}
              </option>
            ))}
          </datalist>
          <div className="inline">
            <button
              className="secondary"
              onClick={() => {
                setRows([...rows, { key: id(), sku: "", qty: 1 }]);
                setReview(null);
              }}
            >
              + {d.t("Add row")}
            </button>
            <button
              className="primary"
              onClick={() =>
                validate(rows.map((r) => `${r.sku},${r.qty}`).join("\n"))
              }
            >
              {d.t("Review lines")}
            </button>
          </div>
        </section>
        <section className="panel">
          <h2>{d.t("Upload CSV")}</h2>
          <label>
            {d.t("Paste CSV")}
            <textarea
              rows={7}
              value={csv}
              onChange={(e) => {
                setCSV(e.target.value);
                setReview(null);
              }}
            />
          </label>
          <label className="file-label">
            {d.t("Upload CSV")}
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={async (e) => {
                if (e.target.files[0]) {
                  setCSV(await e.target.files[0].text());
                  setReview(null);
                }
              }}
            />
          </label>
          <button className="primary" onClick={() => validate(csv)}>
            {d.t("Review lines")}
          </button>
        </section>
      </div>
      {review && (
        <section className="panel">
          <h2>
            {d.t("Matched products")}: {review.items.length}
          </h2>
          {review.items.map((i) => (
            <div className="summary-line" key={i.productId}>
              <span>
                {d.getProductById(i.productId).name} ·{" "}
                {d.getProductById(i.productId).sku}
              </span>
              <b>× {i.qty}</b>
            </div>
          ))}
          {review.errors.map((e, i) => (
            <p className="error" role="alert" key={i}>
              {e}
            </p>
          ))}
          <button
            className="primary"
            disabled={!review.items.length}
            onClick={() => {
              d.add(review.items);
              setReview(null);
            }}
          >
            {d.t("Add valid lines to cart")}
          </button>
        </section>
      )}
      <Link className="text-link" to="/store/ai-preview">
        {d.t("Text ordering · Phase 3 preview")} →
      </Link>
    </>
  );
}
