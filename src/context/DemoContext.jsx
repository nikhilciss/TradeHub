import {
  canAccess,
  saveRoleProfile,
  deleteRoleProfile,
  saveStaffAccount,
  validateRoleProfiles,
} from "../services/roleService";
import {
  sanitizeAIConfig,
  testAIConfiguration,
} from "../services/aiConfigService";
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
import {
  companiesForUser,
  resolveCompany,
  enterCompany,
  membershipsFor,
  updateMembership,
} from "../services/accessService";
const Context = createContext();
const KEY = "tradehub-demo-v4";
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
    const raw =
      read(KEY) ||
      read("tradehub-demo-v3") ||
      read("tradehub-demo-v2") ||
      read("tradehub-demo-v1");
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
  const [session, setSession] = useState(() => {
    try {
      const value = JSON.parse(read("tradehub-session-v3", "{}"));
      return value && typeof value === "object" ? value : {};
    } catch {
      return {};
    }
  });
  const userId = session.userId || "";
  const companyId = session.companyId || "";
  const login = (id) => setSession({ userId: id, companyId: "" });
  const setCompanyId = (cid) => {
    enterCompany(stateRef.current, identity, cid);
    setSession({ userId, companyId: cid });
  };
  const [lang, setLang] = useState(() =>
    read("tradehub-lang", "en") === "de" ? "de" : "en",
  );
  const [toast, setToast] = useState("");
  const identity = state.users.find((u) => u.id === userId && u.active);
  const association = resolveCompany(state, identity, companyId);
  const selectedCompany = association?.company || null;
  const accessibleCompanies = companiesForUser(state, identity);
  const user = identity
    ? { ...identity, role: association?.role || identity.role }
    : null;
  // Internal dashboards still need an illustrative company context. Store routes require selectedCompany.
  const company =
    selectedCompany ||
    state.companies.find((c) => c.id === identity?.companyId) ||
    state.companies[0];
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
    persist("tradehub-session-v3", JSON.stringify(session));
  }, [session]);
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
  const add = (items, { atomic = false } = {}) => {
    if (!selectedCompany) {
      notify("Select a company to continue.");
      return false;
    }
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
    if (atomic && errors.length) {
      notify(errors.join(" "));
      return false;
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
    if (!selectedCompany) return notify("Select a company to continue.");
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
      if (collection === "users") validateRoleProfiles(next);
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
    identity,
    selectedCompany,
    accessibleCompanies,
    company,
    companyId,
    setCompanyId,
    login,
    clearCompany: () => setSession({ userId, companyId: "" }),
    getMemberships: membershipsFor,
    updateMembership: (uid, cid, changes) =>
      update((s) => updateMembership(s, uid, cid, changes)),
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
    can: (permission) => canAccess(state, identity, permission),
    saveRole: (record) => {
      update((s) => saveRoleProfile(s, identity, record));
      notify("Role saved");
    },
    deleteRole: (rid) => {
      update((s) => deleteRoleProfile(s, identity, rid));
      notify("Role deleted");
    },
    saveStaff: (record) => {
      update((s) => saveStaffAccount(s, identity, record));
      notify("Staff account saved");
    },
    saveAIConfig: (config) => {
      if (!canAccess(stateRef.current, identity, "ai"))
        throw Error("Access denied");
      const safe = sanitizeAIConfig(config);
      update((s) => ({
        ...s,
        aiConfig: {
          ...safe,
          status: "not_tested",
          lastTest: s.aiConfig.lastTest,
        },
      }));
      notify("AI configuration saved");
    },
    testAIConfig: (config, fail = false) => {
      if (!canAccess(stateRef.current, identity, "ai"))
        throw Error("Access denied");
      const result = testAIConfiguration(config, fail);
      update((s) => ({
        ...s,
        aiConfig: result,
        aiLogs: [
          {
            id: id(),
            date: result.lastTest,
            status: result.status,
            provider: result.provider,
            details:
              "Local configuration simulation only. No external API request.",
          },
          ...s.aiLogs,
        ],
      }));
      notify("AI configuration test complete");
      return result;
    },
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
    checkout: (reference, notes, addresses) => {
      if (!selectedCompany) throw Error("Select a company to continue.");
      return update((s) =>
        placeOrder(s, selectedCompany.id, user.id, reference, notes, addresses),
      );
    },
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
      setSession({ userId, companyId: "" });
      notify("Seed data restored");
    },
    importData: (s) => {
      const validated = validateSnapshot(s);
      update(() => validated);
      setSession({ userId, companyId: "" });
      notify("Snapshot imported");
    },
  };
  return <Context.Provider value={api}>{children}</Context.Provider>;
}
export const useDemo = () => useContext(Context);
