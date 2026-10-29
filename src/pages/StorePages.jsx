import React, { useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  Package,
  Truck,
  Percent,
  Heart,
  Zap,
  CheckCircle,
  ShoppingCart,
  Download,
  Trash2,
} from "lucide-react";
import { useDemo } from "../context/DemoContext";
import {
  Heading,
  OrderTable,
  Badge,
  Empty,
  Art,
  roles,
  homeFor,
  Modal,
} from "../components/UI";
import { money, totalFor, parseCSV, id } from "../services/domain";
import { downloadInvoice } from "../utils/invoice";
export function QuickOrder({ ai = false }) {
  const d = useDemo();
  const [text, setText] = useState(
      ai
        ? "Please order PNE-3201 x 5 and FAS-3201 x 20."
        : "SKU,quantity\nPNE-3201,5\nFAS-3201,20",
    ),
    [result, setResult] = useState(null),
    [sku, setSku] = useState(""),
    [qty, setQty] = useState(1);
  const parse = () => {
    let content = text;
    if (ai)
      content = [...text.matchAll(/([A-Z]{3}-\d+)\s*(?:x|:|,)\s*(\d+)/gi)]
        .map((m) => `${m[1]},${m[2]}`)
        .join("\n");
    setResult(parseCSV(content, d.state.products));
  };
  return (
    <>
      <Heading
        title={
          ai ? "From text to order lines." : "Know your parts? Skip the browse."
        }
        eyebrow={ai ? "PHASE 3 · OPTIONAL PREVIEW" : "QUICK ORDER"}
      >
        {ai
          ? "Deterministic local parser only. No AI model, mailbox access, OCR or PDF reading."
          : "Paste a list, upload a CSV, or add an article number."}
      </Heading>
      <div className="two-columns">
        <section className="panel">
          <h2>{ai ? "Paste sample order text" : "Bulk import"}</h2>
          <label>
            {ai ? "Order text" : "SKU,quantity"}
            <textarea
              rows="10"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setResult(null);
              }}
            />
          </label>
          {!ai && (
            <label className="file-label">
              {d.t("Upload CSV")}
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={async (e) => {
                  if (e.target.files[0]) {
                    setText(await e.target.files[0].text());
                    setResult(null);
                  }
                }}
              />
            </label>
          )}
          <button className="primary" onClick={parse}>
            {d.t("Review order lines →")}
          </button>
        </section>
        <section className="panel">
          <h2>{d.t("Add an individual article")}</h2>
          <label>
            {d.t("Article number")}
            <input
              list="skus"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder={d.t("PNE-3201")}
            />
            <datalist id="skus">
              {d.state.products
                .filter((p) => p.active)
                .map((p) => (
                  <option key={p.id} value={p.sku}>
                    {p.name}
                  </option>
                ))}
            </datalist>
          </label>
          <label>
            {d.t("Quantity")}
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </label>
          <button
            className="secondary"
            onClick={() => {
              const r = parseCSV(`${sku},${qty}`, d.state.products);
              if (r.errors.length) d.notify(r.errors[0]);
              else d.add(r.items);
            }}
          >
            {d.t("Add to cart")}
          </button>
          <div className="notice">
            {d.t(
              "Duplicate articles are combined into a single cart line. Invalid quantities and unknown SKUs are skipped with feedback.",
            )}
          </div>
          <Link
            className="text-link"
            to={ai ? "/store/quick-order" : "/store/ai-preview"}
          >
            {ai ? "Back to quick order" : "Explore text-ordering preview →"}
          </Link>
        </section>
      </div>
      {result && (
        <section className="panel">
          <h2>{result.items.length} matched articles</h2>
          {result.items.map((i) => (
            <p key={i.productId}>
              {d.state.products.find((p) => p.id === i.productId).sku} ·
              Quantity {i.qty}
            </p>
          ))}
          {result.errors.map((e) => (
            <p className="error" key={e}>
              {e}
            </p>
          ))}
          <button
            className="primary"
            disabled={!result.items.length}
            onClick={() => {
              d.add(result.items);
              setResult(null);
            }}
          >
            {d.t("Add reviewed lines to cart")}
          </button>
        </section>
      )}
    </>
  );
}
export function Orders({ admin = false, approvals = false }) {
  const d = useDemo();
  const [q, setQ] = useState(""),
    [status, setStatus] = useState("");
  const orders = d.state.orders.filter(
    (o) =>
      (admin || o.companyId === d.company.id) &&
      (!approvals || o.status === "pending_approval") &&
      (!status || o.status === status) &&
      `${o.number} ${o.reference} ${d.state.companies.find((c) => c.id === o.companyId)?.name}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <>
      <Heading
        title={approvals ? "Purchasing approvals" : "Every order. In view."}
        eyebrow={admin ? "ORDER OPERATIONS" : "ORDER MANAGEMENT"}
      >
        {approvals
          ? `Review purchases above your ${money(d.company.approvalThreshold)} company limit.`
          : "Track your purchases from submission to delivery."}
      </Heading>
      <section className="panel">
        <div className="filter-row">
          <input
            aria-label={d.t("Search orders")}
            placeholder={d.t("Search order, reference or company\u2026")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            aria-label={d.t("Filter status")}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">{d.t("All statuses")}</option>
            {[
              "pending_approval",
              "submitted",
              "processing",
              "shipped",
              "delivered",
              "canceled",
              "rejected",
            ].map((s) => (
              <option key={s} value={s}>
                {d.t(s)}
              </option>
            ))}
          </select>
        </div>
        <OrderTable orders={orders} admin={admin} />
      </section>
    </>
  );
}
export function OrderDetail({ admin = false }) {
  const d = useDemo(),
    { id: oid } = useParams();
  const o = d.state.orders.find(
    (o) => o.id === oid && (admin || o.companyId === d.company.id),
  );
  if (!o) return <Empty>{d.t("Order not found")}</Empty>;
  const company = d.state.companies.find((c) => c.id === o.companyId);
  const change = (status) =>
    d.edit("orders", {
      ...o,
      status,
      tracking:
        status === "shipped"
          ? "DEMO tracking · shipment in transit"
          : o.tracking,
    });
  return (
    <>
      <Heading
        title={o.number}
        eyebrow={d.t("ORDER DETAIL")}
        action={<Badge value={o.status} />}
      >
        {company.name} · {new Date(o.createdAt).toLocaleDateString("de-DE")} ·{" "}
        {o.reference || "No PO reference"}
      </Heading>
      <div className="stepper">
        {["submitted", "processing", "shipped", "delivered"].map((s, i) => (
          <div
            className={
              ["submitted", "processing", "shipped", "delivered"].indexOf(
                o.status,
              ) >= i
                ? "done"
                : ""
            }
            key={s}
          >
            <CheckCircle size={22} />
            {d.t(s)}
          </div>
        ))}
      </div>
      <section className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>{d.t("Article")}</th>
                <th>{d.t("SKU")}</th>
                <th>{d.t("Quantity")}</th>
                <th>{d.t("Captured unit price")}</th>
                <th>{d.t("Net total")}</th>
              </tr>
            </thead>
            <tbody>
              {o.items.map((i) => (
                <tr key={i.productId}>
                  <td>{i.name}</td>
                  <td>{i.sku}</td>
                  <td>{i.qty}</td>
                  <td>{money(i.unitPrice)}</td>
                  <td>{money(i.qty * i.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h2 className="align-right">{money(o.total)}</h2>
        {(o.deliveryAddress || o.billingAddress) && (
          <div className="two-columns">
            {[
              ["Delivery address", o.deliveryAddress],
              ["Billing address", o.billingAddress],
            ]
              .filter(([, a]) => a)
              .map(([label, a]) => (
                <div key={label}>
                  <h3>{d.t(label)}</h3>
                  <p>
                    {a.street}
                    <br />
                    {a.postalCode} {a.city}
                    <br />
                    {a.country}
                  </p>
                </div>
              ))}
          </div>
        )}
        <p>
          {d.t("Order notes")}: {o.notes || "—"}
        </p>
        <p>
          {d.t("Order tracking")}:{" "}
          {o.tracking || d.t("Not available yet · demo placeholder")}
        </p>
        <p>
          {d.t("ERP status (simulation)")}: <Badge value={o.erpStatus} />
        </p>
        <div className="inline">
          {!admin && (
            <button
              className="primary"
              onClick={() =>
                d.add(
                  o.items
                    .filter(
                      (i) =>
                        d.state.products.find((p) => p.id === i.productId)
                          ?.active,
                    )
                    .map((i) => ({ productId: i.productId, qty: i.qty })),
                )
              }
            >
              {d.t("Reorder into cart")}
            </button>
          )}
          {d.user.role === "customer_admin" &&
            o.status === "pending_approval" && (
              <>
                <button className="primary" onClick={() => change("submitted")}>
                  {d.t("Approve purchase")}
                </button>
                <button className="danger" onClick={() => change("rejected")}>
                  {d.t("Reject purchase")}
                </button>
              </>
            )}
          {admin &&
            !["pending_approval", "rejected", "canceled"].includes(
              o.status,
            ) && (
              <label>
                {d.t("Fulfillment state")}
                <select
                  value={o.status}
                  onChange={(e) => change(e.target.value)}
                >
                  {[
                    "submitted",
                    "processing",
                    "shipped",
                    "delivered",
                    "canceled",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {d.t(s)}
                    </option>
                  ))}
                </select>
              </label>
            )}
          {admin &&
            ["shipped", "delivered"].includes(o.status) &&
            !o.invoiceId && (
              <button
                className="secondary"
                onClick={() => {
                  const invoiceId = id();
                  d.update((s) => ({
                    ...s,
                    orders: s.orders.map((x) =>
                      x.id === o.id ? { ...x, invoiceId } : x,
                    ),
                    invoices: [
                      ...s.invoices,
                      {
                        id: invoiceId,
                        number: "DEMO-INV-" + o.number,
                        orderId: o.id,
                        companyId: o.companyId,
                        amount: o.total,
                        date: new Date().toISOString(),
                        status: "sample",
                      },
                    ],
                  }));
                  d.notify("Sample invoice created");
                }}
              >
                {d.t("Create sample invoice")}
              </button>
            )}
        </div>
        {o.status === "pending_approval" && admin && (
          <div className="notice">
            {d.t(
              "Customer administrator approval is required before fulfillment and ERP push.",
            )}
          </div>
        )}
      </section>
    </>
  );
}
export function Invoices() {
  const d = useDemo();
  const invoices = d.state.invoices.filter((i) => i.companyId === d.company.id);
  return (
    <>
      <Heading title={d.t("Your invoice center")} eyebrow={d.t("FINANCE")}>
        {d.t(
          "Watermarked sample documents. Genuine fiscal PDFs must come from Odoo in production.",
        )}
      </Heading>
      <section className="panel">
        {invoices.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{d.t("Invoice")}</th>
                  <th>{d.t("Date")}</th>
                  <th>{d.t("Net amount")}</th>
                  <th>{d.t("Document")}</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((i) => (
                  <tr key={i.id}>
                    <td>
                      {i.number}
                      <small>{d.t("DEMO · NOT A FISCAL DOCUMENT")}</small>
                    </td>
                    <td>{new Date(i.date).toLocaleDateString("de-DE")}</td>
                    <td>{money(i.amount)}</td>
                    <td>
                      <button
                        className="secondary"
                        onClick={() =>
                          downloadInvoice(
                            i,
                            d.state.orders.find((o) => o.id === i.orderId),
                            d.company,
                          )
                        }
                      >
                        <Download size={16} />
                        {d.t("Sample PDF")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
      </section>
    </>
  );
}
export function Templates() {
  const d = useDemo();
  const templates = d.state.templates.filter(
    (t) => t.companyId === d.company.id,
  );
  return (
    <>
      <Heading
        title={d.t("Repeat the good orders.")}
        eyebrow={d.t("ORDER TEMPLATES")}
      >
        {d.t(
          "Save a named template from your cart. Loading combines matching articles.",
        )}
      </Heading>
      <div className="three-columns">
        {templates.map((t) => (
          <section className="panel" key={t.id}>
            <Package className="teal" />
            <h2>{t.name}</h2>
            <p>
              {t.items.length} article lines ·{" "}
              {t.items.reduce((s, i) => s + i.qty, 0)} pieces
            </p>
            <button
              className="primary"
              onClick={() =>
                d.add(
                  t.items.filter(
                    (i) =>
                      d.state.products.find((p) => p.id === i.productId)
                        ?.active,
                  ),
                )
              }
            >
              {d.t("Load into cart")}
            </button>
            <button
              className="text-link"
              onClick={() =>
                d.update((s) => ({
                  ...s,
                  templates: s.templates.filter((x) => x.id !== t.id),
                }))
              }
            >
              {d.t("Delete")}
            </button>
          </section>
        ))}
      </div>
      {!templates.length && <Empty>{d.t("No saved templates yet")}</Empty>}
    </>
  );
}
export function Support() {
  const d = useDemo(),
    [subject, setSubject] = useState(""),
    [message, setMessage] = useState("");
  return (
    <>
      <Heading
        title={d.t("Let\u2019s keep things moving.")}
        eyebrow={d.t("SUPPORT")}
      >
        {d.t("Record an order exception or question as a local demo draft.")}
      </Heading>
      <section className="panel narrow">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            d.update((s) => ({
              ...s,
              support: [
                {
                  id: id(),
                  companyId: d.company.id,
                  subject,
                  message,
                  date: new Date().toISOString(),
                },
                ...s.support,
              ],
            }));
            d.notify("Support draft saved locally — nothing sent");
            setSubject("");
            setMessage("");
          }}
        >
          <label>
            {d.t("Subject / order reference")}
            <input
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>
          <label>
            {d.t("How can we help?")}
            <textarea
              required
              rows="5"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </label>
          <button className="primary">{d.t("Save local support draft")}</button>
          <p className="notice">
            {d.t("No message is emailed or sent to a support team.")}
          </p>
        </form>
        {d.state.support
          .filter((s) => s.companyId === d.company.id)
          .map((s) => (
            <div className="support-draft" key={s.id}>
              <b>{s.subject}</b>
              <p>{s.message}</p>
              <Badge value="local_draft" />
            </div>
          ))}
      </section>
    </>
  );
}
