import { mergeItems } from "./domain.js";
export function suggestOrderLines(text, products) {
  const lines = [],
    warnings = [];
  for (const match of text.matchAll(
    /\b[A-Z]{2,12}-[A-Z0-9-]*\d[A-Z0-9-]*\b/gi,
  )) {
    const sku = match[0],
      product = products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
    if (!product) {
      warnings.push({ sku, reason: "Unknown SKU" });
      continue;
    }
    const after = text.slice(match.index + sku.length),
      before = text.slice(Math.max(0, match.index - 30), match.index);
    const suffix = after.match(
      /^\s*(?:x|×|:|,|quantity\s*:?|qty\s*:?|menge\s*:?)\s*(\d+(?:\.\d+)?)/i,
    );
    const prefix = before.match(
      /(\d+(?:\.\d+)?)\s*(?:x|×|pieces?\s+(?:of\s+)?|stück\s+)?$/i,
    );
    const qty = Number(suffix?.[1] || prefix?.[1] || 0);
    if (!Number.isInteger(qty) || qty < 1 || qty > 99999) {
      warnings.push({
        sku,
        reason: qty
          ? "Invalid quantity"
          : "Quantity is missing. Add it in Quick Order.",
      });
      continue;
    }
    lines.push({ productId: product.id, qty });
  }
  return { items: mergeItems([], lines), warnings };
}
export function searchByDescription(query, products) {
  const stop = new Set([
    "the",
    "a",
    "an",
    "for",
    "i",
    "need",
    "please",
    "find",
    "me",
    "some",
    "of",
    "and",
    "with",
    "buy",
    "want",
    "ich",
    "suche",
    "bitte",
    "für",
    "und",
    "ein",
    "eine",
  ]);
  const words =
    query
      .toLowerCase()
      .match(/[\p{L}\d-]+/gu)
      ?.filter((w) => w.length > 1 && !stop.has(w)) || [];
  if (!words.length) return [];
  return products
    .map((p) => {
      const content =
        `${p.name} ${p.nameDe || ""} ${p.sku} ${p.brand} ${p.category} ${p.description}`.toLowerCase();
      return {
        p,
        score: words.reduce((n, w) => n + (content.includes(w) ? 1 : 0), 0),
      };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((x) => x.p);
}
