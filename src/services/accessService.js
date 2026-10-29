import { profileFor } from "./roleService.js";
export const isInternalRole = (role) =>
  ["admin", "inside_sales", "field_sales"].includes(role);
export function membershipsFor(user) {
  if (!user || !["buyer", "customer_admin"].includes(user.role)) return [];
  return (
    user.memberships || [
      { companyId: user.companyId, role: user.role, active: true },
    ]
  );
}
export function companiesForUser(state, user) {
  if (!user?.active) return [];
  if (isInternalRole(user.role) && !profileFor(state, user)?.active) return [];
  if (isInternalRole(user.role))
    return state.companies
      .filter((c) => c.active)
      .map((company) => ({ company, role: user.role }));
  return membershipsFor(user)
    .filter((m) => m.active)
    .map((m) => ({
      company: state.companies.find((c) => c.id === m.companyId && c.active),
      role: m.role,
    }))
    .filter((m) => m.company);
}
export function resolveCompany(state, user, companyId) {
  return (
    companiesForUser(state, user).find((m) => m.company.id === companyId) ||
    null
  );
}
export function authenticateDemo(state, email, password, internal = false) {
  const user = state.users.find(
    (u) =>
      u.email.trim().toLowerCase() === email.trim().toLowerCase() &&
      u.password === password &&
      u.active &&
      isInternalRole(u.role) === internal,
  );
  if (!user || (internal && !profileFor(state, user)?.active))
    throw Error("Invalid demo credentials or inactive account.");
  return user;
}
export function safeStoreDestination(next) {
  return typeof next === "string" &&
    /^\/store(?:\/|\?|$)/.test(next) &&
    !/[\\\s]/.test(next) &&
    !next.includes("..")
    ? next
    : "/store";
}
export function enterCompany(state, user, companyId) {
  if (!resolveCompany(state, user, companyId))
    throw Error("You do not have access to this company.");
  return companyId;
}
export function updateMembership(state, userId, companyId, changes) {
  const target = state.users.find((u) => u.id === userId);
  if (!target || isInternalRole(target.role))
    throw Error("Only customer memberships can be changed here.");
  const memberships = membershipsFor(target).map((m) =>
    m.companyId === companyId ? { ...m, ...changes, companyId } : m,
  );
  return {
    ...state,
    users: state.users.map((u) =>
      u.id === userId ? { ...u, memberships } : u,
    ),
  };
}
