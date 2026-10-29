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
        title="Your operation, connected."
        eyebrow="OPERATIONS COMMAND CENTER"
        action={
          <Link className="primary" to="/admin/odoo">
            Integration center ↗
          </Link>
        }
      >
        A shared view of customers, purchases and the ERP pipeline.
      </Heading>
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
            <h2>Digital ordering momentum</h2>
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
            Illustrative activity, not analytics. Production goal: 50% portal
            adoption within 12 months.
          </p>
        </section>
        <section className="integration-card">
          <Workflow size={30} />
          <h2>One connected source of truth.</h2>
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
            Open Odoo integration <ArrowRight size={17} />
          </Link>
        </section>
      </div>
      <section className="panel">
        <div className="section-title">
          <h2>Open order queue</h2>
          <Link to="/admin/orders">All orders →</Link>
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
    [editing, setEditing] = useState(null);
  return (
    <>
      <Heading title="Partnerships that work." eyebrow="CUSTOMER ACCOUNTS">
        Negotiated pricing and purchase controls apply immediately to future
        orders.
      </Heading>
      <section className="panel">
        <input
          className="table-search"
          aria-label="Search customers"
          placeholder="Search companies or city…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Location</th>
                <th>Tier</th>
                <th>Discount</th>
                <th>Approval limit</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {d.state.companies
                .filter((c) =>
                  (c.name + c.city).toLowerCase().includes(q.toLowerCase()),
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
                        onClick={() => setEditing({ ...c })}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
      {editing && (
        <Modal title="Company contract" onClose={() => setEditing(null)}>
          <h3>{editing.name}</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              d.edit("companies", editing);
              d.notify("Company contract updated");
              setEditing(null);
            }}
          >
            <label>
              Contract tier
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
              Discount (%)
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
              Purchase approval threshold (EUR)
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
              Account approved
            </label>
            <button className="primary">Save contract</button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function Users() {
  const d = useDemo(),
    [adding, setAdding] = useState(false),
    [access, setAccess] = useState(null);
  return (
    <>
      <Heading
        title="People & permissions"
        eyebrow="USER MANAGEMENT"
        action={
          <button className="primary" onClick={() => setAdding(true)}>
            + Add demo user
          </button>
        }
      >
        Role navigation is illustrative, not a security boundary. All bundled
        demo data is accessible.
      </Heading>
      <section className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Company</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {d.state.users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <b>{u.name}</b>
                    <small>{u.email}</small>
                  </td>
                  <td>{roles[u.role]}</td>
                  <td>
                    {d.getMemberships(u).length
                      ? d
                          .getMemberships(u)
                          .map(
                            (m) =>
                              d.state.companies.find(
                                (c) => c.id === m.companyId,
                              )?.name,
                          )
                          .join(", ")
                      : "Internal workspace"}
                  </td>
                  <td>
                    <Badge value={u.active ? "active" : "disabled"} />
                  </td>
                  <td>
                    {["buyer", "customer_admin"].includes(u.role) && (
                      <button
                        className="secondary compact"
                        onClick={() =>
                          setAccess({
                            ...u,
                            memberships: structuredClone(d.getMemberships(u)),
                          })
                        }
                      >
                        {d.t("Company access")}
                      </button>
                    )}
                    <button
                      disabled={u.id === d.user.id}
                      className="secondary compact"
                      onClick={() =>
                        (() => {
                          try {
                            d.edit("users", { ...u, active: !u.active });
                          } catch (err) {
                            d.notify(err.message);
                          }
                        })()
                      }
                    >
                      {u.active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {access && (
        <Modal title={d.t("Company access")} onClose={() => setAccess(null)}>
          <h3>{access.email}</h3>
          <p>{d.t("Choose companies and the role for each membership.")}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!access.memberships.length)
                return d.notify("Select at least one company.");
              d.edit("users", {
                ...access,
                companyId: access.memberships.some(
                  (m) => m.companyId === access.companyId,
                )
                  ? access.companyId
                  : access.memberships[0].companyId,
              });
              setAccess(null);
              d.notify("Company access updated");
            }}
          >
            {d.state.companies.map((c) => {
              const member = access.memberships.find(
                (m) => m.companyId === c.id,
              );
              return (
                <div className="membership-row" key={c.id}>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={!!member}
                      onChange={(e) =>
                        setAccess({
                          ...access,
                          memberships: e.target.checked
                            ? [
                                ...access.memberships,
                                {
                                  companyId: c.id,
                                  role: "buyer",
                                  active: true,
                                },
                              ]
                            : access.memberships.filter(
                                (m) => m.companyId !== c.id,
                              ),
                        })
                      }
                    />
                    {c.name}
                  </label>
                  {member && (
                    <div className="inline">
                      <select
                        aria-label={`${d.t("Role")} ${c.name}`}
                        value={member.role}
                        onChange={(e) =>
                          setAccess({
                            ...access,
                            memberships: access.memberships.map((m) =>
                              m.companyId === c.id
                                ? { ...m, role: e.target.value }
                                : m,
                            ),
                          })
                        }
                      >
                        <option value="buyer">{d.t("Buyer")}</option>
                        <option value="customer_admin">
                          {d.t("Customer administrator")}
                        </option>
                      </select>
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={member.active}
                          onChange={(e) =>
                            setAccess({
                              ...access,
                              memberships: access.memberships.map((m) =>
                                m.companyId === c.id
                                  ? { ...m, active: e.target.checked }
                                  : m,
                              ),
                            })
                          }
                        />
                        {d.t("Active")}
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
            <button className="primary">{d.t("Save")}</button>
          </form>
        </Modal>
      )}
      {adding && (
        <Modal title="Add local demo user" onClose={() => setAdding(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.target));
              if (
                d.state.users.some(
                  (u) => u.email.toLowerCase() === f.email.toLowerCase(),
                )
              )
                return d.notify("Email already exists");
              d.update((s) => ({
                ...s,
                users: [
                  ...s.users,
                  {
                    ...f,
                    id: id(),
                    active: true,
                    password: "Demo@123",
                    memberships: ["buyer", "customer_admin"].includes(f.role)
                      ? [{ companyId: f.companyId, role: f.role, active: true }]
                      : [],
                  },
                ],
              }));
              setAdding(false);
            }}
          >
            <label>
              Name
              <input name="name" required />
            </label>
            <label>
              Demo email
              <input name="email" type="email" required />
            </label>
            <label>
              Role
              <select name="role">
                {Object.entries(roles).map(([v, n]) => (
                  <option key={v} value={v}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Company
              <select name="companyId">
                {d.state.companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <p>Public password: Demo@123 · No real authentication</p>
            <button className="primary">Create local user</button>
          </form>
        </Modal>
      )}
    </>
  );
}
export function Settings() {
  const d = useDemo(),
    [reset, setReset] = useState(false),
    [error, setError] = useState("");
  return (
    <>
      <Heading title="Make this workspace yours." eyebrow="PORTAL SETTINGS">
        Snapshots and configuration belong to this browser. No shared database
        or cross-browser synchronization.
      </Heading>
      <div className="two-columns">
        <section className="panel">
          <h2>Portal preferences</h2>
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
              Portal name
              <input
                name="name"
                required
                defaultValue={d.state.settings.portalName}
              />
            </label>
            <label>
              Default approval limit (EUR)
              <input
                name="limit"
                required
                type="number"
                min="0"
                defaultValue={d.state.settings.approvalThreshold}
              />
            </label>
            <p>Company-specific limits override this default.</p>
            <button className="primary">Save settings</button>
          </form>
        </section>
        <section className="panel">
          <h2>Your demo data</h2>
          <p>
            Export a full snapshot, or manually import it in another browser.
            Deployed seed files are read-only.
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
            Export JSON snapshot
          </button>
          <label className="file-label">
            Import snapshot JSON
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
          <h3>Start fresh</h3>
          <p>
            Restore the original 54 products and six companies. Export first to
            preserve your work.
          </p>
          <button className="danger" onClick={() => setReset(true)}>
            Reset demo data
          </button>
        </section>
      </div>
      {reset && (
        <Modal title="Restore original seed?" onClose={() => setReset(false)}>
          <p>
            This replaces local orders, cart, configuration and all other demo
            edits.
          </p>
          <div className="inline">
            <button className="secondary" onClick={() => setReset(false)}>
              Cancel
            </button>
            <button
              className="danger"
              onClick={() => {
                d.reset();
                setReset(false);
              }}
            >
              Restore seed data
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
        title="Closer to your customers."
        eyebrow="PHASE 2 · FIELD SALES PREVIEW"
      >
        Responsive browser preview. No native app, camera scanner or real
        offline synchronization.
      </Heading>
      <div className="two-columns">
        <section className="panel">
          <label>
            Customer account
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
            <span>Contract discount</span>
            <b>{d.company.discount}%</b>
          </div>
          <div className="summary-line">
            <span>Approval limit</span>
            <b>{money(d.company.approvalThreshold)}</b>
          </div>
          <div className="summary-line">
            <span>Credit limit · illustrative</span>
            <b>{money(d.company.creditLimit)}</b>
          </div>
          <Link className="text-link" to="/store/catalog">
            Browse with this customer’s pricing →
          </Link>
        </section>
        <section className="panel">
          <div className="section-title">
            <h2>On-site order</h2>
            <button className="secondary" onClick={() => setOffline(!offline)}>
              {offline ? "Reconnect preview" : "Simulate offline"}
            </button>
          </div>
          <label>
            SKU,quantity
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
            {offline ? "Save offline preview draft" : "Add to customer cart"}
          </button>
          <p>
            Barcode scanner: future native capability, unavailable in this
            preview.
          </p>
        </section>
      </div>
      <section className="panel">
        <h2>Local draft queue</h2>
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
                Move to cart
              </button>
            </div>
          ))}
        {!d.state.drafts.some((x) => x.companyId === d.company.id) && (
          <p>No queued drafts for this customer.</p>
        )}
      </section>
      <section className="panel">
        <h2>Customer purchase history</h2>
        <OrderTable
          orders={d.state.orders.filter((o) => o.companyId === d.company.id)}
        />
      </section>
    </>
  );
}
