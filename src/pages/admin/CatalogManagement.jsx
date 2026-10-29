import React, { useState } from "react";
import { useDemo } from "../../context/DemoContext";
import { Heading, Modal, Badge, Empty } from "../../components/UI";
import {
  ProductImage,
  Pagination,
  categoryName,
} from "../../components/storefront/Storefront";
import { slugify, categoryIds } from "../../services/catalogService";
import { money, id } from "../../services/domain";
const illustrations = [
  "Electrical",
  "Pneumatics",
  "Power transmission",
  "Tools",
  "Safety",
  "Fasteners",
];
const blankCategory = () => ({
  id: id(),
  name: "",
  nameDe: "",
  slug: "",
  description: "",
  parentId: null,
  image: "",
  icon: "Package",
  illustration: "Electrical",
  displayOrder: 0,
  active: true,
  featured: true,
});
export function CategoriesAdmin() {
  const d = useDemo(),
    [q, setQ] = useState(""),
    [status, setStatus] = useState(""),
    [editing, setEditing] = useState(null),
    [original, setOriginal] = useState(null),
    [deleting, setDeleting] = useState(null),
    [replacement, setReplacement] = useState(""),
    [error, setError] = useState("");
  const open = (c) => {
    const record = c ? { ...c } : blankCategory();
    setEditing(record);
    setOriginal(record);
    setError("");
  };
  const categories = d
    .getCategories()
    .filter(
      (c) =>
        `${c.name} ${c.nameDe} ${c.description}`
          .toLowerCase()
          .includes(q.toLowerCase()) &&
        (!status || c.active === (status === "active")),
    );
  const form = (key, value) => setEditing({ ...editing, [key]: value });
  return (
    <>
      <Heading
        title={d.t("Category management")}
        eyebrow={d.t("Catalog management")}
        action={
          <button className="primary" onClick={() => open()}>
            + {d.t("Add category")}
          </button>
        }
      />
      <section className="panel">
        <div className="filter-row">
          <input
            aria-label={d.t("Search")}
            placeholder={d.t("Search")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            value={status}
            aria-label={d.t("Status")}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">{d.t("All statuses")}</option>
            <option value="active">{d.t("Active")}</option>
            <option value="inactive">{d.t("Inactive")}</option>
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  "Category",
                  "Description",
                  "Parent category",
                  "Products",
                  "Display order",
                  "Status",
                  "Actions",
                ].map((k) => (
                  <th key={k}>{d.t(k)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="table-product">
                      <ProductImage
                        product={{ ...c, images: c.image ? [c.image] : [] }}
                      />
                      <div>
                        <b>{categoryName(c, d.lang)}</b>
                        <small>/{c.slug}</small>
                      </div>
                    </div>
                  </td>
                  <td className="wrap-cell">{c.description}</td>
                  <td>{d.getCategoryById(c.parentId)?.name || "—"}</td>
                  <td>
                    {
                      d.state.products.filter(
                        (p) => !p.deleted && p.categoryId === c.id,
                      ).length
                    }
                  </td>
                  <td>{c.displayOrder}</td>
                  <td>
                    <button
                      className="status-button"
                      onClick={() =>
                        d.updateCategory(c.id, { active: !c.active })
                      }
                    >
                      <Badge value={c.active ? "active" : "disabled"} />
                    </button>
                  </td>
                  <td>
                    <div className="inline">
                      <button
                        className="secondary compact"
                        onClick={() => open(c)}
                      >
                        {d.t("Edit")}
                      </button>
                      <button
                        className="text-link"
                        onClick={() => {
                          setDeleting(c);
                          setReplacement("");
                          setError("");
                        }}
                      >
                        {d.t("Delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!categories.length && <Empty>{d.t("No records found.")}</Empty>}
      </section>
      {editing && (
        <Modal
          title={d.t(
            d.state.categories.some((c) => c.id === editing.id)
              ? "Edit category"
              : "Add category",
          )}
          onClose={() => setEditing(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                d.addCategory(editing);
                setEditing(null);
                d.notify("Category saved");
              } catch (err) {
                setError(d.t(err.message));
              }
            }}
          >
            <div className="two-columns">
              <label>
                {d.t("Category name")}
                <input
                  required
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      name: e.target.value,
                      slug:
                        editing.slug === slugify(editing.name)
                          ? slugify(e.target.value)
                          : editing.slug || slugify(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                {d.t("German category name")}
                <input
                  value={editing.nameDe}
                  onChange={(e) => form("nameDe", e.target.value)}
                />
              </label>
            </div>
            <label>
              {d.t("Slug")}
              <input
                required
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                value={editing.slug}
                onChange={(e) => form("slug", e.target.value)}
              />
            </label>
            <label>
              {d.t("Parent category")}
              <select
                value={editing.parentId || ""}
                onChange={(e) => form("parentId", e.target.value || null)}
              >
                <option value="">{d.t("No parent")}</option>
                {d
                  .getCategories()
                  .filter(
                    (c) =>
                      !categoryIds(d.state.categories, editing.id).has(c.id),
                  )
                  .map((c) => (
                    <option value={c.id} key={c.id}>
                      {categoryName(c, d.lang)}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              {d.t("Description")}
              <textarea
                value={editing.description}
                onChange={(e) => form("description", e.target.value)}
              />
            </label>
            <label>
              {d.t("Image URL")}
              <input
                type="url"
                value={editing.image}
                onChange={(e) => form("image", e.target.value)}
                placeholder="https://…"
              />
            </label>
            <div className="two-columns">
              <label>
                {d.t("Demo illustration")}
                <select
                  value={editing.illustration}
                  onChange={(e) => form("illustration", e.target.value)}
                >
                  {illustrations.map((i) => (
                    <option key={i}>{i}</option>
                  ))}
                </select>
              </label>
              <label>
                {d.t("Icon")}
                <select
                  value={editing.icon}
                  onChange={(e) => form("icon", e.target.value)}
                >
                  {["Package", "Zap", "Wrench", "Shield", "Settings"].map(
                    (i) => (
                      <option key={i}>{i}</option>
                    ),
                  )}
                </select>
              </label>
            </div>
            <label>
              {d.t("Display order")}
              <input
                type="number"
                min="0"
                required
                value={editing.displayOrder}
                onChange={(e) => form("displayOrder", Number(e.target.value))}
              />
            </label>
            {[
              ["active", "Active"],
              ["featured", "Featured category"],
            ].map(([k, l]) => (
              <label className="checkbox" key={k}>
                <input
                  type="checkbox"
                  checked={editing[k]}
                  onChange={(e) => form(k, e.target.checked)}
                />
                {d.t(l)}
              </label>
            ))}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="inline">
              <button className="primary">{d.t("Save category")}</button>
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  setEditing({ ...original });
                  setError("");
                }}
              >
                {d.t("Reset")}
              </button>
              <button
                className="secondary"
                type="button"
                onClick={() => setEditing(null)}
              >
                {d.t("Cancel")}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal title={d.t("Delete category")} onClose={() => setDeleting(null)}>
          <h3>{deleting.name}</h3>
          <p>{d.t("Products are never deleted with a category.")}</p>
          {(d.state.products.some((p) => p.categoryId === deleting.id) ||
            d.state.categories.some((c) => c.parentId === deleting.id)) && (
            <label>
              {d.t("Reassign products and subcategories to")}
              <select
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
              >
                <option value="">{d.t("Choose replacement")}</option>
                {d
                  .getCategories()
                  .filter(
                    (c) =>
                      !categoryIds(d.state.categories, deleting.id).has(c.id),
                  )
                  .map((c) => (
                    <option value={c.id} key={c.id}>
                      {categoryName(c, d.lang)}
                    </option>
                  ))}
              </select>
            </label>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <div className="inline">
            <button
              className="danger"
              onClick={() => {
                try {
                  d.deleteCategory(deleting.id, replacement);
                  setDeleting(null);
                  d.notify("Category deleted");
                } catch (err) {
                  setError(d.t(err.message));
                }
              }}
            >
              {d.t("Delete")}
            </button>
            <button className="secondary" onClick={() => setDeleting(null)}>
              {d.t("Cancel")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
const blankProduct = (categoryId) => ({
  id: id(),
  name: "",
  nameDe: "",
  sku: "",
  brand: "",
  description: "",
  shortDescription: "",
  categoryId,
  category: "",
  images: [],
  price: 0,
  discount: 0,
  taxRate: 19,
  pricingRules: [],
  stock: 0,
  stockStatus: "in_stock",
  minOrderQty: 1,
  unit: "piece",
  leadDays: 2,
  manufacturer: "",
  manufacturerPartNumber: "",
  datasheetUrl: "",
  specifications: {},
  illustration: "Electrical",
  active: true,
  featured: false,
  showOnStorefront: true,
  deleted: false,
  createdAt: new Date().toISOString(),
});
export function ProductManagement() {
  const d = useDemo(),
    [q, setQ] = useState(""),
    [category, setCategory] = useState(""),
    [stock, setStock] = useState(""),
    [page, setPage] = useState(1),
    [editing, setEditing] = useState(null),
    [images, setImages] = useState(""),
    [specs, setSpecs] = useState(""),
    [error, setError] = useState(""),
    [deleting, setDeleting] = useState(null);
  const open = (p) => {
    const record = p
      ? structuredClone(p)
      : blankProduct(d.state.categories[0]?.id || "");
    setEditing(record);
    setImages(record.images.join("\n"));
    setSpecs(
      Object.entries(record.specifications)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n"),
    );
    setError("");
  };
  const products = d
    .getProducts()
    .filter(
      (p) =>
        `${p.name} ${p.sku} ${p.brand}`
          .toLowerCase()
          .includes(q.toLowerCase()) &&
        (!category ||
          categoryIds(d.state.categories, category).has(p.categoryId)) &&
        (!stock ||
          (stock === "in_stock" ? p.stock > 0 : p.stockStatus === stock)),
    );
  const current = Math.min(page, Math.max(1, Math.ceil(products.length / 12)));
  const value = (k, v) => setEditing({ ...editing, [k]: v });
  const field = (key, label, type = "text", props = {}) => (
    <label>
      {d.t(label)}
      <input
        {...props}
        type={type}
        value={editing[key]}
        onChange={(e) =>
          value(
            key,
            type === "number" ? Number(e.target.value) : e.target.value,
          )
        }
      />
    </label>
  );
  const save = (another) => {
    try {
      const product = {
        ...editing,
        images: images
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        specifications: Object.fromEntries(
          specs
            .split("\n")
            .filter((s) => s.trim())
            .map((line) => {
              const colon = line.indexOf(":");
              if (colon < 1) throw Error("Specifications must use key: value.");
              return [
                line.slice(0, colon).trim(),
                line.slice(colon + 1).trim(),
              ];
            }),
        ),
      };
      d.addProduct(product);
      d.notify("Product saved");
      if (another) open();
      else setEditing(null);
    } catch (err) {
      setError(d.t(err.message));
    }
  };
  const parent = editing && d.getCategoryById(editing.categoryId)?.parentId;
  return (
    <>
      <Heading
        title={d.t("Product management")}
        eyebrow={d.t("Catalog management")}
        action={
          <button className="primary" onClick={() => open()}>
            + {d.t("Add product")}
          </button>
        }
      />
      <section className="panel">
        <div className="filter-row">
          <input
            placeholder={d.t("Search")}
            aria-label={d.t("Search")}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <select
            aria-label={d.t("Category")}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{d.t("All categories")}</option>
            {d.getCategories().map((c) => (
              <option key={c.id} value={c.id}>
                {categoryName(c, d.lang)}
              </option>
            ))}
          </select>
          <select
            aria-label={d.t("Stock status")}
            value={stock}
            onChange={(e) => {
              setStock(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{d.t("All availability")}</option>
            {["in_stock", "backorder", "unavailable"].map((s) => (
              <option key={s} value={s}>
                {d.t(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  "Products",
                  "Category",
                  "Brand",
                  "Base price",
                  "Stock",
                  "Status",
                  "Actions",
                ].map((k) => (
                  <th key={k}>{d.t(k)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.slice((current - 1) * 12, current * 12).map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="table-product">
                      <ProductImage product={p} />
                      <div>
                        <b>{p.name}</b>
                        <small>{p.sku}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    {categoryName(d.getCategoryById(p.categoryId), d.lang)}
                  </td>
                  <td>{p.brand}</td>
                  <td>{money(p.price)}</td>
                  <td>
                    {p.stock}
                    <small>{d.t(p.stockStatus)}</small>
                  </td>
                  <td>
                    <Badge value={p.active ? "active" : "disabled"} />
                  </td>
                  <td>
                    <div className="inline">
                      <button
                        className="secondary compact"
                        onClick={() => open(p)}
                      >
                        {d.t("Edit")}
                      </button>
                      <button
                        className="text-link"
                        onClick={() => setDeleting(p)}
                      >
                        {d.t("Delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={current} count={products.length} onChange={setPage} />
      </section>
      {editing && (
        <Modal
          title={d.t(
            d.state.products.some((p) => p.id === editing.id)
              ? "Edit product"
              : "Add product",
          )}
          onClose={() => setEditing(null)}
        >
          <form
            className="product-editor"
            onSubmit={(e) => {
              e.preventDefault();
              save(e.nativeEvent.submitter?.value === "another");
            }}
          >
            <h3>{d.t("Basic information")}</h3>
            <div className="two-columns">
              {field("name", "Product name", "text", { required: true })}
              {field("nameDe", "German product name")}
              {field("sku", "SKU", "text", { required: true })}
              {field("brand", "Brand", "text", { required: true })}
            </div>
            {field("shortDescription", "Short description")}
            <label>
              {d.t("Product description")}
              <textarea
                required
                value={editing.description}
                onChange={(e) => value("description", e.target.value)}
              />
            </label>
            <div className="two-columns">
              <label>
                {d.t("Category")}
                <select
                  required
                  value={parent || editing.categoryId}
                  onChange={(e) => value("categoryId", e.target.value)}
                >
                  {d.getCategories().map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parentId ? "↳ " : ""}
                      {categoryName(c, d.lang)}
                      {c.active ? "" : " (inactive)"}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {d.t("Subcategory")}
                <select
                  value={parent ? editing.categoryId : ""}
                  onChange={(e) =>
                    value(
                      "categoryId",
                      e.target.value || parent || editing.categoryId,
                    )
                  }
                >
                  <option value="">—</option>
                  {d
                    .getCategories()
                    .filter(
                      (c) => c.parentId === (parent || editing.categoryId),
                    )
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {categoryName(c, d.lang)}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <label>
              {d.t("Images (one URL per line)")}
              <textarea
                value={images}
                onChange={(e) => setImages(e.target.value)}
              />
            </label>
            <label>
              {d.t("Demo illustration")}
              <select
                value={editing.illustration}
                onChange={(e) => value("illustration", e.target.value)}
              >
                {illustrations.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </label>
            <h3>{d.t("Pricing")}</h3>
            <div className="three-columns">
              {field("price", "Base price", "number", {
                min: 0,
                step: ".01",
                required: true,
              })}
              {field("discount", "Discount", "number", {
                min: 0,
                max: 100,
                required: true,
              })}
              {field("taxRate", "Tax rate", "number", {
                min: 0,
                max: 100,
                step: ".1",
                required: true,
              })}
            </div>
            <p className="notice">
              {d.t("VAT and shipping calculated in Odoo.")}
            </p>
            <h4>{d.t("Customer-specific pricing")}</h4>
            {editing.pricingRules.map((r, i) => (
              <div className="pricing-rule" key={i}>
                <select
                  aria-label={d.t("Company")}
                  value={r.companyId}
                  onChange={(e) =>
                    value(
                      "pricingRules",
                      editing.pricingRules.map((x, j) =>
                        j === i ? { ...x, companyId: e.target.value } : x,
                      ),
                    )
                  }
                >
                  {d.state.companies.map((c) => (
                    <option value={c.id} key={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  aria-label={d.t("Fixed net price")}
                  type="number"
                  required
                  min="0"
                  step=".01"
                  value={r.price}
                  onChange={(e) =>
                    value(
                      "pricingRules",
                      editing.pricingRules.map((x, j) =>
                        j === i ? { ...x, price: Number(e.target.value) } : x,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  aria-label={d.t("Remove")}
                  onClick={() =>
                    value(
                      "pricingRules",
                      editing.pricingRules.filter((_, j) => i !== j),
                    )
                  }
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              className="secondary compact"
              onClick={() =>
                value("pricingRules", [
                  ...editing.pricingRules,
                  {
                    companyId:
                      d.state.companies.find(
                        (c) =>
                          !editing.pricingRules.some(
                            (r) => r.companyId === c.id,
                          ),
                      )?.id || d.company.id,
                    price: editing.price,
                  },
                ])
              }
            >
              {d.t("Add pricing rule")}
            </button>
            <h3>{d.t("Inventory")}</h3>
            <div className="two-columns">
              {field("stock", "Stock", "number", { min: 0, required: true })}
              <label>
                {d.t("Stock status")}
                <select
                  value={editing.stockStatus}
                  onChange={(e) => value("stockStatus", e.target.value)}
                >
                  {["in_stock", "backorder", "unavailable"].map((s) => (
                    <option value={s} key={s}>
                      {d.t(s)}
                    </option>
                  ))}
                </select>
              </label>
              {field("minOrderQty", "Minimum order quantity", "number", {
                min: 1,
                required: true,
              })}
              {field("unit", "Unit of measurement", "text", { required: true })}
              {field("leadDays", "Delivery lead time", "number", {
                min: 0,
                required: true,
              })}
            </div>
            <h3>{d.t("Technical details")}</h3>
            <div className="two-columns">
              {field("manufacturer", "Manufacturer")}
              {field("manufacturerPartNumber", "Manufacturer part number")}
            </div>
            {field("datasheetUrl", "Datasheet URL", "url")}
            <label>
              {d.t("Specifications (key: value per line)")}
              <textarea
                rows={4}
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
              />
            </label>
            <h3>{d.t("Visibility")}</h3>
            {[
              ["active", "Active"],
              ["featured", "Featured product"],
              ["showOnStorefront", "Show on storefront"],
            ].map(([k, l]) => (
              <label className="checkbox" key={k}>
                <input
                  type="checkbox"
                  checked={editing[k]}
                  onChange={(e) => value(k, e.target.checked)}
                />
                {d.t(l)}
              </label>
            ))}
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="editor-actions">
              <button className="primary" type="submit">
                {d.t("Save product")}
              </button>
              <button className="secondary" type="submit" value="another">
                {d.t("Save & add another")}
              </button>
              <button
                className="secondary"
                type="button"
                onClick={() => setEditing(null)}
              >
                {d.t("Cancel")}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {deleting && (
        <Modal title={d.t("Delete product")} onClose={() => setDeleting(null)}>
          <h3>{deleting.name}</h3>
          <p>
            {d.t(
              "The product will be archived. Historical order lines remain unchanged.",
            )}
          </p>
          <div className="inline">
            <button
              className="danger"
              onClick={() => {
                d.deleteProduct(deleting.id);
                setDeleting(null);
                d.notify("Product archived");
              }}
            >
              {d.t("Delete")}
            </button>
            <button className="secondary" onClick={() => setDeleting(null)}>
              {d.t("Cancel")}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
