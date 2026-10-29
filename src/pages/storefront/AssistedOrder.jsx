import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Search, CheckCircle } from "lucide-react";
import { useDemo } from "../../context/DemoContext";
import { Heading, Empty } from "../../components/UI";
import { ShopCard } from "../../components/storefront/Storefront";
import {
  suggestOrderLines,
  searchByDescription,
} from "../../services/assistedOrderService";
import { quantityIssue } from "../../services/catalogService";
import { money } from "../../services/domain";
export function AssistedOrder() {
  const d = useDemo(),
    [text, setText] = useState(
      "Please supply PNE-3201 x 5 and FAS-3201 x 10 for our next maintenance shift.",
    ),
    [review, setReview] = useState(null),
    [query, setQuery] = useState(""),
    [matches, setMatches] = useState(null),
    [added, setAdded] = useState(false);
  const changeText = (value) => {
    setText(value);
    setReview(null);
    setAdded(false);
  };
  const issues =
    review?.items.map((i) =>
      quantityIssue(
        d.getProductById(i.productId),
        i.qty + (d.cart.find((x) => x.productId === i.productId)?.qty || 0),
      ),
    ) || [];
  if (!d.state.aiConfig.enabled)
    return (
      <>
        <Heading title={d.t("AI-assisted ordering")} />
        <div className="notice">
          {d.t("AI assistance is disabled by your administrator.")}
        </div>
      </>
    );
  return (
    <>
      <Heading
        title={d.t("AI-assisted ordering")}
        eyebrow={d.company.name}
        action={
          <Link className="secondary" to="/store/quick-order">
            {d.t("Quick order")}
            <ArrowRight size={15} />
          </Link>
        }
      >
        {d.t("Turn copied order text into a cart you can review.")}
      </Heading>
      <div className="notice permanent">
        <Sparkles size={17} />{" "}
        {d.t(
          "Demo preview: deterministic local parsing, not a live AI model. No mailbox access, PDF OCR or external data transfer.",
        )}
      </div>
      {d.state.aiConfig.textOrders && (
        <div className="two-columns">
          <section className="panel">
            <h2>{d.t("Paste email or PDF order text")}</h2>
            <label>
              {d.t("Order text")}
              <textarea
                rows={9}
                value={text}
                onChange={(e) => changeText(e.target.value)}
              />
            </label>
            <label className="file-label">
              {d.t("Upload a text file")}
              <input
                type="file"
                accept=".txt,text/plain"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (file.size > 1000000) {
                    d.notify("Text file must be smaller than 1 MB.");
                    return;
                  }
                  changeText(await file.text());
                  e.target.value = "";
                }}
              />
            </label>
            <button
              className="primary"
              disabled={!text.trim()}
              onClick={() => {
                const result = suggestOrderLines(text, d.getProducts(true));
                setReview({
                  ...result,
                  items: result.items.map((i) => ({ ...i, selected: true })),
                });
                setAdded(false);
              }}
            >
              <Sparkles size={16} />
              {d.t("Suggest order lines")}
            </button>
          </section>
          <section className="panel">
            <h2>{d.t("Review before ordering")}</h2>
            <ol className="assisted-steps">
              <li>
                {d.t("Copy item numbers and quantities from an email or PDF.")}
              </li>
              <li>
                {d.t("Review matched products, quantities and company prices.")}
              </li>
              <li>
                {d.t(
                  "Add selected lines to this company’s cart and checkout normally.",
                )}
              </li>
            </ol>
            <div className="notice">
              {d.t(
                "PDF files are not read in this demo. Paste their text instead.",
              )}
              <br />
              {d.t("Example")}: PNE-3201 x 5
            </div>
            <p>
              {d.t("Company")}: <b>{d.company.name}</b>
            </p>
            <p>
              {d.t("Approval limit")}: {money(d.company.approvalThreshold)}
            </p>
          </section>
        </div>
      )}
      {d.state.aiConfig.textOrders && review && (
        <section className="panel">
          <div className="section-title">
            <h2>{d.t("Suggested order lines")}</h2>
            <span>
              {review.items.length} {d.t("Matched products")}
            </span>
          </div>
          {review.items.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {[
                      "Select",
                      "Products",
                      "Quantity",
                      "Your price",
                      "Line total",
                      "Validation",
                    ].map((k) => (
                      <th key={k}>{d.t(k)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {review.items.map((i, index) => {
                    const p = d.getProductById(i.productId);
                    return (
                      <tr key={i.productId}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`${d.t("Select")} ${p.sku}`}
                            checked={i.selected}
                            onChange={(e) => {
                              setReview({
                                ...review,
                                items: review.items.map((x, n) =>
                                  n === index
                                    ? { ...x, selected: e.target.checked }
                                    : x,
                                ),
                              });
                              setAdded(false);
                            }}
                          />
                        </td>
                        <td>
                          <b>{p.name}</b>
                          <small>{p.sku}</small>
                        </td>
                        <td>
                          <input
                            className="frequency-input"
                            aria-label={`${d.t("Quantity")} ${p.sku}`}
                            type="number"
                            min={p.minOrderQty}
                            value={i.qty}
                            onChange={(e) => {
                              setReview({
                                ...review,
                                items: review.items.map((x, n) =>
                                  n === index
                                    ? { ...x, qty: Number(e.target.value) }
                                    : x,
                                ),
                              });
                              setAdded(false);
                            }}
                          />
                        </td>
                        <td>{money(d.price(p))}</td>
                        <td>{money(d.price(p) * i.qty)}</td>
                        <td>
                          {issues[index] ? (
                            <span className="error">{d.t(issues[index])}</span>
                          ) : (
                            <CheckCircle size={16} className="teal" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>
              {d.t(
                "No order lines matched. Include a SKU and quantity, or use Quick Order.",
              )}
            </Empty>
          )}
          {review.warnings.map((w, i) => (
            <p className="error" key={i}>
              {w.sku}: {d.t(w.reason)}
            </p>
          ))}
          <div className="inline">
            <button
              className="primary"
              disabled={
                added ||
                !review.items.some((i) => i.selected) ||
                review.items.some((i, n) => i.selected && issues[n])
              }
              onClick={() => {
                if (
                  d.add(
                    review.items
                      .filter((i) => i.selected)
                      .map(({ productId, qty }) => ({ productId, qty })),
                  )
                )
                  setAdded(true);
              }}
            >
              {d.t(added ? "Added to cart" : "Add selected lines to cart")}
            </button>
            <Link className="secondary" to="/store/cart">
              {d.t("Your cart")}
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      )}
      {d.state.aiConfig.descriptionSearch && (
        <section className="panel">
          <h2>{d.t("Describe what you need")}</h2>
          <p>{d.t("Local keyword search preview, not semantic AI search.")}</p>
          <form
            className="inline"
            onSubmit={(e) => {
              e.preventDefault();
              setMatches(searchByDescription(query, d.getProducts(true)));
            }}
          >
            <input
              aria-label={d.t("Search")}
              placeholder={d.t(
                "Example: torque wrench for workshop maintenance",
              )}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="secondary">
              <Search size={16} />
              {d.t("Search")}
            </button>
          </form>
        </section>
      )}
      {d.state.aiConfig.descriptionSearch && matches && (
        <div className="shop-products-grid">
          {matches.map((p) => (
            <ShopCard key={p.id} product={p} />
          ))}
          {!matches.length && <Empty>{d.t("No records found.")}</Empty>}
        </div>
      )}
    </>
  );
}
