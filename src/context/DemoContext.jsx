import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import seed from "../data/seed.json";
import {
  mergeItems,
  placeOrder,
  validateSnapshot,
  id,
  priceFor,
} from "../services/domain";
import {
  saveCategory,
  removeCategory,
  saveProduct,
  removeProduct,
  productVisible,
  quantityIssue,
} from "../services/catalogService";
import { migrateState } from "../services/migration";
import {
  queueOrder,
  runSync,
  safeConnection,
  logEntry,
} from "../services/odooService";
import { translate } from "../utils/i18n";
const Context = createContext();
const KEY = "tradehub-demo-v2";
const read = (key, fallback = "") => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
};
const fresh = () => migrateState(seed);
export function DemoProvider({ children }) {
  const [initial] = useState(() => {
    const raw = read(KEY) || read("tradehub-demo-v1");
    try {
      return {
        state: raw ? validateSnapshot(JSON.parse(raw)) : fresh(),
        warning: "",
      };
    } catch {
      let backedUp = false;
      try {
        if (raw) {
          localStorage.setItem(KEY + "-recovery", raw);
          backedUp = true;
        }
      } catch {}
      return {
        state: fresh(),
        warning: backedUp
          ? "Stored demo data could not be restored. A recovery copy was retained in browser storage."
          : "Stored demo data could not be restored. The original seed has been loaded.",
      };
    }
  });
  const [storageError, setStorageError] = useState(initial.warning);
  const [state, setState] = useState(initial.state);
  const stateRef = useRef(state);
  const [userId, setUserId] = useState(() => read("tradehub-user"));
  const [companyId, setCompanyId] = useState(() =>
    read("tradehub-company", "c1"),
  );
  const [lang, setLang] = useState(() =>
    read("tradehub-lang", "en") === "de" ? "de" : "en",
  );
  const [toast, setToast] = useState("");
  const user = state.users.find((u) => u.id === userId && u.active);
  const company =
    state.companies.find(
      (c) =>
        c.id === (user?.role === "field_sales" ? companyId : user?.companyId),
    ) || state.companies[0];
  const t = (key) => translate(lang, key);
  const persist = (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      setStorageError(
        "Browser storage is unavailable or full. Export your data before closing.",
      );
    }
  };
  useEffect(() => {
    persist(KEY, JSON.stringify(state));
  }, [state]);
  useEffect(() => {
    persist("tradehub-user", userId);
  }, [userId]);
  useEffect(() => {
    persist("tradehub-company", companyId);
  }, [companyId]);
  useEffect(() => {
    persist("tradehub-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  // Compute before committing: validation errors can be caught by forms instead of escaping React state updaters.
  const update = (fn) => {
    const next = fn(stateRef.current);
    stateRef.current = next;
    setState(next);
    return next;
  };
  const notify = (message) => setToast(t(message));
  const mutate = (fn) => {
    try {
      update(fn);
      return true;
    } catch (error) {
      notify(error.message);
      return false;
    }
  };
  const cart = state.carts[company.id] || [];
  const add = (items) => {
    const valid = [],
      errors = [];
    const current = stateRef.current;
    for (const item of mergeItems([], items)) {
      const p = current.products.find((p) => p.id === item.productId);
      const total =
        (current.carts[company.id]?.find((i) => i.productId === item.productId)
          ?.qty || 0) + item.qty;
      const issue =
        !p || !productVisible(current, p)
          ? "This product is unavailable."
          : quantityIssue(p, total);
      if (issue) errors.push(`${p?.sku || item.productId}: ${t(issue)}`);
      else valid.push(item);
    }
    if (valid.length)
      update((s) => ({
        ...s,
        carts: {
          ...s.carts,
          [company.id]: mergeItems(s.carts[company.id] || [], valid),
        },
      }));
    notify(
      errors.length
        ? errors.join(" ")
        : valid.length
          ? "Cart updated"
          : "No valid products selected.",
    );
    return errors.length === 0 && valid.length > 0;
  };
  const setQty = (productId, qty) => {
    if (qty !== 0) {
      const p = state.products.find((p) => p.id === productId);
      const error = quantityIssue(p, qty);
      if (error) return notify(error);
    }
    update((s) => ({
      ...s,
      carts: {
        ...s.carts,
        [company.id]: qty
          ? s.carts[company.id].map((i) =>
              i.productId === productId ? { ...i, qty } : i,
            )
          : s.carts[company.id].filter((i) => i.productId !== productId),
      },
    }));
  };
  const edit = (collection, record) =>
    update((s) => {
      let next = {
        ...s,
        [collection]: s[collection].map((x) =>
          x.id === record.id ? record : x,
        ),
      };
      if (collection === "orders") next = queueOrder(next, record);
      return next;
    });
  const sync = (entity, fail = false) => {
    if (
      !stateRef.current.odoo.enabled ||
      (entity !== "Full sync" &&
        !stateRef.current.odoo.syncSettings[entity]?.enabled)
    )
      return notify("Integration or synchronization is disabled.");
    update((s) => runSync(s, entity, fail));
    notify(
      fail
        ? "Simulated failure recorded."
        : "Local simulation complete. No ERP request was made.",
    );
  };
  const api = {
    state,
    update,
    mutate,
    user,
    company,
    companyId,
    setCompanyId,
    login: setUserId,
    lang,
    setLang,
    t,
    toast,
    notify,
    storageError,
    cart,
    add,
    setQty,
    edit,
    sync,
    price: (p) => priceFor(p, company),
    getProducts: (visible = false) =>
      state.products.filter(
        (p) => !p.deleted && (!visible || productVisible(state, p)),
      ),
    getProductById: (pid) => state.products.find((p) => p.id === pid),
    getCategories: () =>
      [...state.categories].sort((a, b) => a.displayOrder - b.displayOrder),
    getCategoryById: (cid) => state.categories.find((c) => c.id === cid),
    addCategory: (record) =>
      update((s) => saveCategory(s, { ...record, id: record.id || id() })),
    updateCategory: (cid, values) =>
      update((s) =>
        saveCategory(s, {
          ...s.categories.find((c) => c.id === cid),
          ...values,
          id: cid,
        }),
      ),
    deleteCategory: (cid, replacement) =>
      update((s) => removeCategory(s, cid, replacement)),
    addProduct: (record) =>
      update((s) => saveProduct(s, { ...record, id: record.id || id() })),
    updateProduct: (pid, values) =>
      update((s) =>
        saveProduct(s, {
          ...s.products.find((p) => p.id === pid),
          ...values,
          id: pid,
        }),
      ),
    deleteProduct: (pid) => update((s) => removeProduct(s, pid)),
    getOrders: () => state.orders,
    getCart: (cid) => state.carts[cid] || [],
    checkout: (reference, notes, addresses) =>
      update((s) =>
        placeOrder(s, company.id, user.id, reference, notes, addresses),
      ),
    favorite: (pid) =>
      update((s) => {
        const old = s.favorites[company.id] || [];
        return {
          ...s,
          favorites: {
            ...s.favorites,
            [company.id]: old.includes(pid)
              ? old.filter((x) => x !== pid)
              : [...old, pid],
          },
        };
      }),
    recordView: (pid) =>
      update((s) => {
        const old = s.recentlyViewed[company.id] || [];
        if (old[0] === pid) return s;
        return {
          ...s,
          recentlyViewed: {
            ...s.recentlyViewed,
            [company.id]: [pid, ...old.filter((x) => x !== pid)].slice(0, 12),
          },
        };
      }),
    saveTemplate: (name) => {
      update((s) => ({
        ...s,
        templates: [
          ...s.templates,
          {
            id: id(),
            companyId: company.id,
            name,
            items: structuredClone(cart),
          },
        ],
      }));
      notify("Template saved");
    },
    getOdooConfig: () => state.odoo,
    getSyncHistory: () => state.syncLogs,
    updateOdooConfig: (config) => {
      const safe = safeConnection(config);
      update((s) => ({
        ...s,
        odoo: { ...s.odoo, ...safe, connectionStatus: "disconnected" },
      }));
      notify("Configuration saved");
    },
    simulateOdooConnection: (fail) => {
      update((s) => ({
        ...s,
        odoo: { ...s.odoo, connectionStatus: "testing" },
      }));
      setTimeout(
        () =>
          update((s) => {
            const status = fail || !s.odoo.enabled ? "error" : "connected";
            return {
              ...s,
              odoo: { ...s.odoo, connectionStatus: status },
              syncLogs: [
                logEntry(
                  "Connection test",
                  status === "error" ? "error" : "success",
                  0,
                  "Simulated connection test. No external ERP request.",
                ),
                ...s.syncLogs,
              ],
            };
          }),
        650,
      );
    },
    reset: () => {
      update(() => fresh());
      setCompanyId("c1");
      notify("Seed data restored");
    },
    importData: (s) => {
      const validated = validateSnapshot(s);
      update(() => validated);
      setCompanyId(validated.companies[0].id);
      notify("Snapshot imported");
    },
  };
  return <Context.Provider value={api}>{children}</Context.Provider>;
}
export const useDemo = () => useContext(Context);
