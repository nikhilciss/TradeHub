export const permissionCatalog = [
  ["dashboard", "Operations dashboard"],
  ["orders", "Order management"],
  ["products", "Product management"],
  ["categories", "Category management"],
  ["customers", "Customer management"],
  ["users", "User management"],
  ["roles", "Roles & permissions"],
  ["odoo", "Odoo integration"],
  ["ai", "AI configuration"],
  ["settings", "Portal settings"],
  ["sales", "Field sales workspace"],
];
export const defaultRoleProfiles = [
  {
    id: "system-admin",
    name: "System administrator",
    description: "Full internal administration access.",
    active: true,
    system: true,
    permissions: permissionCatalog.map(([key]) => key),
  },
  {
    id: "inside-sales",
    name: "Inside sales",
    description: "Customer support and order processing.",
    active: true,
    system: false,
    permissions: ["dashboard", "orders", "customers"],
  },
  {
    id: "field-sales",
    name: "Field sales",
    description: "Select customer accounts and prepare on-site orders.",
    active: true,
    system: false,
    permissions: ["sales"],
  },
];
export const profileIdFor = (user) =>
  user?.staffRoleId ||
  {
    admin: "system-admin",
    inside_sales: "inside-sales",
    field_sales: "field-sales",
  }[user?.role];
export const profileFor = (state, user) =>
  state.roleProfiles?.find((r) => r.id === profileIdFor(user));
export function canAccess(state, user, permission) {
  return (
    !!user?.active &&
    !!profileFor(state, user)?.active &&
    profileFor(state, user).permissions.includes(permission)
  );
}
export const routePermissions = {
  "/admin": "dashboard",
  "/admin/orders": "orders",
  "/admin/products": "products",
  "/admin/categories": "categories",
  "/admin/customers": "customers",
  "/admin/users": "users",
  "/admin/roles": "roles",
  "/admin/odoo": "odoo",
  "/admin/ai": "ai",
  "/admin/settings": "settings",
  "/sales": "sales",
};
export function staffLanding(state, user) {
  if (user?.role === "field_sales") return "/companies";
  return (
    Object.entries(routePermissions).find(
      ([path, key]) => path !== "/sales" && canAccess(state, user, key),
    )?.[0] || "/admin"
  );
}
export function validateRoleProfiles(state) {
  if (
    !Array.isArray(state.roleProfiles) ||
    new Set(state.roleProfiles.map((r) => r.id)).size !==
      state.roleProfiles.length
  )
    throw Error("Invalid role profiles.");
  for (const r of state.roleProfiles) {
    if (
      !r.id ||
      !r.name?.trim() ||
      typeof r.active !== "boolean" ||
      !Array.isArray(r.permissions) ||
      r.permissions.some((p) => !permissionCatalog.some(([key]) => key === p))
    )
      throw Error("Invalid role permissions.");
  }
  const admin = state.roleProfiles.find((r) => r.id === "system-admin");
  if (
    !admin?.active ||
    permissionCatalog.some(([key]) => !admin.permissions.includes(key))
  )
    throw Error("The system administrator role must retain full access.");
  if (
    !state.users.some(
      (u) =>
        u.active && u.role === "admin" && profileIdFor(u) === "system-admin",
    )
  )
    throw Error("Keep at least one active system administrator.");
  for (const u of state.users.filter((u) =>
    ["admin", "inside_sales", "field_sales"].includes(u.role),
  )) {
    const p = profileFor(state, u);
    if (!p) throw Error("Staff account has an unknown role.");
    if (u.role === "field_sales" && !p.permissions.includes("sales"))
      throw Error("Field sales accounts need sales permission.");
  }
  return state;
}
export function saveRoleProfile(state, actor, record) {
  if (!canAccess(state, actor, "roles"))
    throw Error("You do not have permission to manage roles.");
  if (
    state.roleProfiles.some(
      (r) =>
        r.id !== record.id &&
        r.name.toLowerCase() === record.name.trim().toLowerCase(),
    )
  )
    throw Error("Role name already exists.");
  const next = {
    ...state,
    roleProfiles: state.roleProfiles.some((r) => r.id === record.id)
      ? state.roleProfiles.map((r) => (r.id === record.id ? record : r))
      : [...state.roleProfiles, record],
  };
  return validateRoleProfiles(next);
}
export function deleteRoleProfile(state, actor, id) {
  if (!canAccess(state, actor, "roles"))
    throw Error("You do not have permission to manage roles.");
  if (id === "system-admin" || state.users.some((u) => profileIdFor(u) === id))
    throw Error("Reassign users before deleting this role.");
  return validateRoleProfiles({
    ...state,
    roleProfiles: state.roleProfiles.filter((r) => r.id !== id),
  });
}
export function saveStaffAccount(state, actor, record) {
  if (!canAccess(state, actor, "users"))
    throw Error("You do not have permission to manage users.");
  if (
    !record.name?.trim() ||
    !record.email?.includes("@") ||
    !record.password ||
    !["admin", "inside_sales", "field_sales"].includes(record.role)
  )
    throw Error("Complete the staff account fields.");
  if (
    state.users.some(
      (u) =>
        u.id !== record.id &&
        u.email.toLowerCase() === record.email.toLowerCase(),
    )
  )
    throw Error("Email already exists");
  if (!state.companies.some((c) => c.id === record.companyId))
    throw Error("Invalid company.");
  const prior = state.users.find((u) => u.id === record.id);
  if (prior && !["admin", "inside_sales", "field_sales"].includes(prior.role))
    throw Error("Customer accounts are managed through company memberships.");
  if (
    record.id === actor.id &&
    (!record.active || record.staffRoleId !== profileIdFor(actor))
  )
    throw Error("You cannot disable or change your own staff role.");
  return validateRoleProfiles({
    ...state,
    users: prior
      ? state.users.map((u) => (u.id === record.id ? record : u))
      : [...state.users, record],
  });
}
