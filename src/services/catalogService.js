export const slugify = (value) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export function categoryIds(categories, root) {
  const result = new Set([root]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of categories)
      if (result.has(c.parentId) && !result.has(c.id)) {
        result.add(c.id);
        changed = true;
      }
  }
  return result;
}
export function categoryVisible(categories, id, visited = new Set()) {
  const category = categories.find((c) => c.id === id);
  if (!category || !category.active || visited.has(id)) return false;
  visited.add(id);
  return (
    !category.parentId ||
    categoryVisible(categories, category.parentId, visited)
  );
}
export const productVisible = (state, p) =>
  !!p &&
  p.active &&
  !p.deleted &&
  p.showOnStorefront !== false &&
  categoryVisible(state.categories, p.categoryId);
export function validateCategory(categories, record) {
  if (!record.name?.trim() || !record.slug?.trim())
    throw Error("Name and slug are required.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug))
    throw Error("Use a lowercase URL slug with hyphens.");
  if (categories.some((c) => c.id !== record.id && c.slug === record.slug))
    throw Error("Category slug already exists.");
  if (!Number.isFinite(record.displayOrder) || record.displayOrder < 0)
    throw Error("Display order must be zero or greater.");
  if (record.parentId && !categories.some((c) => c.id === record.parentId))
    throw Error("Parent category does not exist.");
  if (
    record.parentId &&
    categoryIds(categories, record.id).has(record.parentId)
  )
    throw Error("A category cannot be its own ancestor.");
  return record;
}
export function saveCategory(state, record) {
  validateCategory(state.categories, record);
  return {
    ...state,
    categories: state.categories.some((c) => c.id === record.id)
      ? state.categories.map((c) => (c.id === record.id ? record : c))
      : [...state.categories, record],
    products: state.products.map((p) =>
      p.categoryId === record.id ? { ...p, category: record.name } : p,
    ),
  };
}
export function removeCategory(state, categoryId, replacementId) {
  const affected =
    state.products.some((p) => p.categoryId === categoryId) ||
    state.categories.some((c) => c.parentId === categoryId);
  if (
    affected &&
    (!replacementId ||
      !state.categories.some((c) => c.id === replacementId) ||
      categoryIds(state.categories, categoryId).has(replacementId))
  )
    throw Error("Choose a replacement outside this category subtree.");
  const target = state.categories.find((c) => c.id === replacementId);
  return {
    ...state,
    categories: state.categories
      .filter((c) => c.id !== categoryId)
      .map((c) =>
        c.parentId === categoryId ? { ...c, parentId: replacementId } : c,
      ),
    products: state.products.map((p) =>
      p.categoryId === categoryId
        ? { ...p, categoryId: replacementId, category: target.name }
        : p,
    ),
  };
}
export function validateProduct(state, record) {
  if (
    !record.name?.trim() ||
    !record.sku?.trim() ||
    !record.brand?.trim() ||
    !record.description?.trim()
  )
    throw Error("Name, SKU, brand and description are required.");
  if (
    state.products.some(
      (p) =>
        p.id !== record.id && p.sku.toLowerCase() === record.sku.toLowerCase(),
    )
  )
    throw Error("SKU already exists.");
  if (!state.categories.some((c) => c.id === record.categoryId))
    throw Error("Select a valid category.");
  for (const k of ["price", "stock", "discount", "taxRate", "minOrderQty"])
    if (!Number.isFinite(record[k]) || record[k] < 0)
      throw Error("Enter valid non-negative numeric values.");
  if (
    !Number.isInteger(record.stock) ||
    !Number.isInteger(record.minOrderQty) ||
    record.minOrderQty < 1 ||
    record.discount > 100 ||
    record.taxRate > 100
  )
    throw Error("Check stock, minimum quantity and percentage values.");
  if (!["in_stock", "backorder", "unavailable"].includes(record.stockStatus))
    throw Error("Select a valid stock status.");
  if (
    !record.unit?.trim() ||
    !Number.isFinite(record.leadDays) ||
    record.leadDays < 0
  )
    throw Error("Unit and delivery lead time are required.");
  if (
    !record.specifications ||
    typeof record.specifications !== "object" ||
    Array.isArray(record.specifications) ||
    Object.values(record.specifications).some((v) => typeof v !== "string")
  )
    throw Error("Specifications must use key: value.");
  if (
    typeof record.createdAt !== "string" ||
    !Number.isFinite(Date.parse(record.createdAt))
  )
    throw Error("Invalid product date.");
  if (
    !Array.isArray(record.images) ||
    record.images.some((url) => url && !/^https?:\/\//i.test(url))
  )
    throw Error("Image URLs must use http or https.");
  if (record.datasheetUrl && !/^https?:\/\//i.test(record.datasheetUrl))
    throw Error("Datasheet URL must use http or https.");
  if (
    !Array.isArray(record.pricingRules) ||
    record.pricingRules.some(
      (r) =>
        !state.companies.some((c) => c.id === r.companyId) ||
        !Number.isFinite(r.price) ||
        r.price < 0,
    ) ||
    new Set(record.pricingRules.map((r) => r.companyId)).size !==
      record.pricingRules.length
  )
    throw Error("Check customer-specific pricing rules.");
  return record;
}
export function saveProduct(state, record) {
  validateProduct(state, record);
  const product = {
    ...record,
    category: state.categories.find((c) => c.id === record.categoryId).name,
  };
  return {
    ...state,
    products: state.products.some((p) => p.id === product.id)
      ? state.products.map((p) => (p.id === product.id ? product : p))
      : [...state.products, product],
  };
}
// Soft deletion preserves IDs in historical orders, invoices and templates.
export function removeProduct(state, productId) {
  return {
    ...state,
    products: state.products.map((p) =>
      p.id === productId
        ? { ...p, active: false, showOnStorefront: false, deleted: true }
        : p,
    ),
    carts: Object.fromEntries(
      Object.entries(state.carts).map(([c, items]) => [
        c,
        items.filter((i) => i.productId !== productId),
      ]),
    ),
    favorites: Object.fromEntries(
      Object.entries(state.favorites).map(([c, ids]) => [
        c,
        ids.filter((x) => x !== productId),
      ]),
    ),
  };
}
export function quantityIssue(product, qty) {
  if (
    !product ||
    !product.active ||
    product.deleted ||
    product.showOnStorefront === false
  )
    return "This product is unavailable.";
  if (!Number.isInteger(qty) || qty < (product.minOrderQty || 1) || qty > 99999)
    return "Quantity must meet the minimum order quantity.";
  if (product.stockStatus === "unavailable")
    return "This product is unavailable.";
  if (product.stockStatus !== "backorder" && qty > product.stock)
    return "Requested quantity exceeds available stock.";
  return "";
}
