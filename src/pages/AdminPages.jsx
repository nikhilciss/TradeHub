import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Workflow,
  Database,
  Server,
  Monitor,
  CheckCircle,
  RefreshCw,
  Download,
  Package,
  WifiOff,
} from "lucide-react";
import { useDemo } from "../context/DemoContext";
import {
  Heading,
  OrderTable,
  Badge,
  Modal,
  Empty,
  roles,
} from "../components/UI";
import { money, id, parseCSV } from "../services/domain";
export function AdminDashboard() {
  const d = useDemo();
  return (
    <>
      <Heading
        title={d.t("Your operation, connected.")}
        eyebrow={d.t("OPERATIONS COMMAND CENTER")}
        action={
          <Link className="primary" to="/admin/odoo">
            {d.t("Integration center ↗")}
          </Link>
        }
      >
        {d.t("A shared view of customers, purchases and the ERP pipeline.")}
      </Heading>
      {d.can("users") && (
        <section className="panel user-management-entry">
          <div>
            <h2>{d.t("Users & company access")}</h2>
            <p>
              {d.t(
                "Create customer logins, assign companies and manage purchasing roles.",
              )}
            </p>
          </div>
          <Link className="primary" to="/admin/users">
            {d.t("Create / manage users →")}
          </Link>
        </section>
      )}
      <div className="stats">
        {[
          ["Total orders", d.state.orders.length, "Across all demo accounts"],
          [
            "Order volume",
            money(d.state.orders.reduce((s, o) => s + o.total, 0)),
            "Illustrative net order volume",
          ],
          [
            "Active accounts",
            d.state.companies.filter((c) => c.active).length,
            "Production target: ~1,200",
          ],
          [
            "Portal users",
            d.state.users.filter((u) => u.active).length,
            "Five demo persona groups",
          ],
        ].map(([l, v, s]) => (
          <div className="stat" key={l}>
            <div className="stat-label">{l}</div>
            <strong>{v}</strong>
            <small>{s}</small>
          </div>
        ))}
      </div>
      <div className="two-columns">
        <section className="panel">
          <div className="section-title">
            <h2>{d.t("Digital ordering momentum")}</h2>
            <Badge value="illustrative" />
          </div>
          <div className="bar-chart">
            {[30, 46, 40, 57, 68, 61, 82, 75, 91, 86, 98, 108].map((n, i) => (
              <div key={i}>
                <span style={{ height: n }} />
                <small>{i + 1}</small>
              </div>
            ))}
          </div>
          <p>
            {d.t(
              "Illustrative activity, not analytics. Production goal: 50% portal adoption within 12 months.",
            )}
          </p>
        </section>
        <section className="integration-card">
          <Workflow size={30} />
          <h2>{d.t("One connected source of truth.")}</h2>
          <p>
            {
              d.state.orders.filter(
                (o) => o.status === "submitted" && o.erpStatus === "pending",
              ).length
            }{" "}
            accepted orders ready for simulated transfer.
          </p>
          <Badge value="simulation_only" />
          <Link to="/admin/odoo">
            {d.t("Open Odoo integration")}
            <ArrowRight size={17} />
          </Link>
        </section>
      </div>
      <section className="panel">
        <div className="section-title">
          <h2>{d.t("Open order queue")}</h2>
          <Link to="/admin/orders">{d.t("All orders →")}</Link>
        </div>
        <OrderTable
          admin
          orders={d.state.orders.filter((o) =>
            ["submitted", "pending_approval", "processing"].includes(o.status),
          )}
        />
      </section>
    </>
  );
}
export function Customers() {
  const d = useDemo(),
    [q, setQ] = useState(""),
    [editing, setEditing] = useState(null),
    [error, setError] = useState("");
  const isNew = editing && !d.state.companies.some((c) => c.id === editing.id);
  const openNew = () => {
    setError("");
    setEditing({
      id: id(),
      name: "",
      code: "",
      tier: "Silver",
      discount: 0,
      approvalThreshold: d.state.settings.approvalThreshold,
      creditLimit: 0,
      city: "",
      country: "DE",
      active: true,
      billingAddress: { street: "", postalCode: "" },
    });
  };
  return (
    <>
      <Heading
        title={d.t("Partnerships that work.")}
        eyebrow={d.t("CUSTOMER ACCOUNTS")}
        action={
          <button className="primary" onClick={openNew}>
            {d.t("+ Add company")}
          </button>
        }
      >
        {d.t(
          "Negotiated pricing and purchase controls apply immediately to future orders.",
        )}
      </Heading>
      <section className="panel">
        <input
          className="table-search"
          aria-label={d.t("Search customers")}
          placeholder={d.t("Search companies or city\u2026")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{d.t("Company")}</th>
                <th>{d.t("Location")}</th>
                <th>{d.t("Tier")}</th>
                <th>{d.t("Discount")}</th>
                <th>{d.t("Approval limit")}</th>
                <th>{d.t("Status")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {d.state.companies
                .filter((c) =>
                  (c.name + " " + c.code + " " + c.city)
                    .toLowerCase()
                    .includes(q.toLowerCase()),
                )
                .map((c) => (
                  <tr key={c.id}>
                    <td>
                      <b>{c.name}</b>
                      <small>
                        {c.code} ·{" "}
                        {
                          d.state.users.filter((u) =>
                            d
                              .getMemberships(u)
                              .some((m) => m.companyId === c.id),
                          ).length
                        }{" "}
                        linked users
                      </small>
                    </td>
                    <td>
                      {c.city}, {c.country}
                    </td>
                    <td>
                      <Badge value={c.tier} />
                    </td>
                    <td>{c.discount}%</td>
                    <td>{money(c.approvalThreshold)}</td>
                    <td>
                      <Badge value={c.active ? "approved" : "pending"} />
                    </td>
                    <td>
                      <button
                        className="secondary compact"
                        onClick={() => {
                          setError("");
                          setEditing({ ...c });
                        }}
                      >
                        {d.t("Edit")}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      {editing && (
        <Modal
          title={isNew ? "Add company" : "Company contract"}
          onClose={() => setEditing(null)}
        >
          <h3>{editing.name}</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                if (isNew) d.createCompany(editing);
                else {
                  d.edit("companies", editing);
                  d.notify("Company contract updated");
                }
                setEditing(null);
              } catch (err) {
                setError(err.message);
              }
            }}
          >
            {isNew && (
              <>
                <div className="two-columns">
                  {[
                    ["name", "Company name"],
                    ["code", "Company code"],
                    ["city", "City"],
                  ].map(([key, label]) => (
                    <label key={key}>
                      {d.t(label)}
                      <input
                        required
                        value={editing[key]}
                        onChange={(e) =>
                          setEditing({ ...editing, [key]: e.target.value })
                        }
                      />
                    </label>
                  ))}
                  <label>
                    {d.t("Country")}
                    <select
                      value={editing.country}
                      onChange={(e) =>
                        setEditing({ ...editing, country: e.target.value })
                      }
                    >
                      <option value="DE">{d.t("Germany")}</option>
                      <option value="AT">{d.t("Austria")}</option>
                      <option value="CH">{d.t("Switzerland")}</option>
                    </select>
                  </label>
                </div>
                <div className="two-columns">
                  {[
                    ["street", "Street"],
                    ["postalCode", "Postal code"],
                  ].map(([key, label]) => (
                    <label key={key}>
                      {d.t(label)}
                      <input
                        required
                        value={editing.billingAddress[key]}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            billingAddress: {
                              ...editing.billingAddress,
                              [key]: e.target.value,
                            },
                          })
                        }
                      />
                    </label>
                  ))}
                </div>
                <p className="notice">
                  {d.t(
                    "This address will be used as the initial billing and delivery address. Assign users through Users & company access after saving.",
                  )}
                </p>
                <label>
                  {d.t("Credit limit (EUR)")}
                  <input
                    type="number"
                    required
                    min="0"
                    value={editing.creditLimit}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        creditLimit: Number(e.target.value),
                      })
                    }
                  />
                </label>
              </>
            )}
            <label>
              {d.t("Contract tier")}
              <select
                value={editing.tier}
                onChange={(e) =>
                  setEditing({ ...editing, tier: e.target.value })
                }
              >
                {["Silver", "Gold", "Platinum"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              {d.t("Discount (%)")}
              <input
                required
                type="number"
                min="0"
                max="100"
                value={editing.discount}
                onChange={(e) =>
                  setEditing({ ...editing, discount: Number(e.target.value) })
                }
              />
            </label>
            <label>
              {d.t("Purchase approval threshold (EUR)")}
              <input
                required
                type="number"
                min="0"
                value={editing.approvalThreshold}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    approvalThreshold: Number(e.target.value),
                  })
                }
              />
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) =>
                  setEditing({ ...editing, active: e.target.checked })
                }
              />
              {d.t("Account approved")}
            </label>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary">
              {d.t(isNew ? "Create company" : "Save contract")}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
export { UserManagement as Users } from "./admin/UserManagement";
export function Settings() {
  const d = useDemo(),
    [reset, setReset] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <Heading
        title={d.t("Make this workspace yours.")}
        eyebrow={d.t("PORTAL SETTINGS")}
      >
        {d.t(
          "Snapshots and configuration belong to this browser. No shared database or cross-browser synchronization.",
        )}
      </Heading>
      <div className="two-columns">
        <section className="panel">
          <h2>{d.t("Portal preferences")}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.target);
              d.update((s) => ({
                ...s,
                settings: {
                  portalName: f.get("name"),
                  approvalThreshold: Number(f.get("limit")),
                },
              }));
              d.notify("Settings saved");
            }}
          >
            <label>
              {d.t("Portal name")}
              <input
                name="name"
                required
                defaultValue={d.state.settings.portalName}
              />
            </label>
            <label>
              {d.t("Default approval limit (EUR)")}
              <input
                name="limit"
                required
                type="number"
                min="0"
                defaultValue={d.state.settings.approvalThreshold}
              />
            </label>
            <p>{d.t("Company-specific limits override this default.")}</p>
            <button className="primary">{d.t("Save settings")}</button>
          </form>
        </section>
        <section className="panel">
          <h2>{d.t("Your demo data")}</h2>
          <p>
            {d.t(
              "Export a full snapshot, or manually import it in another browser. Deployed seed files are read-only.",
            )}
          </p>
          <button
            className="secondary"
            onClick={() => {
              const url = URL.createObjectURL(
                new Blob([JSON.stringify(d.state, null, 2)], {
                  type: "application/json",
                }),
              );
              const a = document.createElement("a");
              a.href = url;
              a.download = "tradehub-snapshot.json";
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            <Download size={16} />
            {d.t("Export JSON snapshot")}
          </button>
          <label className="file-label">
            {d.t("Import snapshot JSON")}
            <input
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                try {
                  if (!e.target.files[0]) return;
                  if (e.target.files[0].size > 5000000)
                    throw Error("Maximum snapshot size is 5 MB");
                  d.importData(JSON.parse(await e.target.files[0].text()));
                  setError("");
                } catch (err) {
                  setError("Import rejected: " + err.message);
                }
                e.target.value = "";
              }}
            />
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <hr />
          <h3>{d.t("Start fresh")}</h3>
          <p>
            {d.t(
              "Restore the original 54 products and six companies. Export first to preserve your work.",
            )}
          </p>
          <button className="danger" onClick={() => setReset(true)}>
            {d.t("Reset demo data")}
          </button>
        </section>
      </div>
      {reset && (
        <Modal
          title={d.t("Restore original seed?")}
          onClose={() => setReset(false)}
        >
          <p>
            {d.t(
              "This replaces local orders, cart, configuration and all other demo edits.",
            )}
          </p>
          <div className="inline">
            <button className="secondary" onClick={() => setReset(false)}>
              {d.t("Cancel")}
            </button>
            <button
              className="danger"
              onClick={() => {
                d.reset();
                setReset(false);
              }}
            >
              {d.t("Restore seed data")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function Sales() {
  const d = useDemo(),
    [text, setText] = useState("PNE-3201,4"),
    [offline, setOffline] = useState(false);
  return (
    <>
      <Heading
        title={d.t("Closer to your customers.")}
        eyebrow={d.t("PHASE 2 \u00b7 FIELD SALES PREVIEW")}
      >
        {d.t(
          "Responsive browser preview. No native app, camera scanner or real offline synchronization.",
        )}
      </Heading>
      <div className="two-columns">
        <section className="panel">
          <label>
            {d.t("Customer account")}
            <select
              value={d.company.id}
              onChange={(e) => d.setCompanyId(e.target.value)}
            >
              {d.state.companies
                .filter((c) => c.active)
                .map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <h2>{d.company.name}</h2>
          <p>
            {d.company.city}, {d.company.country} · {d.company.tier} partner
          </p>
          <div className="summary-line">
            <span>{d.t("Contract discount")}</span>
            <b>{d.company.discount}%</b>
          </div>
          <div className="summary-line">
            <span>{d.t("Approval limit")}</span>
            <b>{money(d.company.approvalThreshold)}</b>
          </div>
          <div className="summary-line">
            <span>{d.t("Credit limit · illustrative")}</span>
            <b>{money(d.company.creditLimit)}</b>
          </div>
          <Link className="text-link" to="/store/catalog">
            {d.t("Browse with this customer’s pricing →")}
          </Link>
        </section>
        <section className="panel">
          <div className="section-title">
            <h2>{d.t("On-site order")}</h2>
            <button className="secondary" onClick={() => setOffline(!offline)}>
              {d.t(offline ? "Reconnect preview" : "Simulate offline")}
            </button>
          </div>
          <label>
            {d.t("SKU,quantity")}
            <textarea
              rows="4"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <button
            className="primary"
            onClick={() => {
              const r = parseCSV(text, d.state.products);
              if (r.errors.length || !r.items.length)
                return d.notify(
                  r.errors.join("; ") || "Enter at least one valid line",
                );
              if (offline) {
                d.update((s) => ({
                  ...s,
                  drafts: [
                    ...s.drafts,
                    { id: id(), companyId: d.company.id, items: r.items },
                  ],
                }));
                d.notify("Offline preview draft saved locally");
              } else d.add(r.items);
            }}
          >
            {d.t(
              offline ? "Save offline preview draft" : "Add to customer cart",
            )}
          </button>
          <p>
            {d.t(
              "Barcode scanner: future native capability, unavailable in this preview.",
            )}
          </p>
        </section>
      </div>
      <section className="panel">
        <h2>{d.t("Local draft queue")}</h2>
        {d.state.drafts
          .filter((x) => x.companyId === d.company.id)
          .map((x) => (
            <div className="summary-line" key={x.id}>
              <span>
                {x.items.length} lines · {d.company.name}
              </span>
              <button
                className="secondary"
                disabled={offline}
                onClick={() => {
                  if (!d.add(x.items, { atomic: true })) return;
                  d.update((s) => ({
                    ...s,
                    drafts: s.drafts.filter((y) => y.id !== x.id),
                  }));
                }}
              >
                {d.t("Move to cart")}
              </button>
            </div>
          ))}
        {!d.state.drafts.some((x) => x.companyId === d.company.id) && (
          <p>{d.t("No queued drafts for this customer.")}</p>
        )}
      </section>
      <section className="panel">
        <h2>{d.t("Customer purchase history")}</h2>
        <OrderTable
          orders={d.state.orders.filter((o) => o.companyId === d.company.id)}
        />
      </section>
    </>
  );
}
