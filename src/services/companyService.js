import { canAccess } from "./roleService.js";
export function createCompany(state, actor, input) {
  if (!canAccess(state, actor, "customers"))
    throw Error("You do not have permission to manage companies.");
  const company = {
    ...input,
    name: input.name?.trim(),
    code: input.code?.trim().toUpperCase(),
    city: input.city?.trim(),
  };
  if (
    !company.id ||
    !company.name ||
    !company.code ||
    !company.city ||
    !["DE", "AT", "CH"].includes(company.country)
  )
    throw Error("Complete the company details.");
  if (
    state.companies.some(
      (c) =>
        c.id === company.id || c.code.trim().toUpperCase() === company.code,
    )
  )
    throw Error("Company code already exists.");
  if (
    !["Silver", "Gold", "Platinum"].includes(company.tier) ||
    typeof company.active !== "boolean" ||
    !Number.isFinite(company.discount) ||
    company.discount < 0 ||
    company.discount > 100 ||
    !Number.isFinite(company.approvalThreshold) ||
    company.approvalThreshold < 0 ||
    !Number.isFinite(company.creditLimit) ||
    company.creditLimit < 0
  )
    throw Error("Check the contract limits and discount.");
  const address = {
    street: input.billingAddress?.street?.trim(),
    postalCode: input.billingAddress?.postalCode?.trim(),
    city: company.city,
    country: company.country,
  };
  if (!address.street || !address.postalCode)
    throw Error("Enter a street and postal code.");
  company.billingAddress = address;
  company.addresses = [
    { ...address, id: "address-" + company.id, label: "Head office" },
  ];
  return {
    ...state,
    companies: [...state.companies, company],
    carts: { ...state.carts, [company.id]: [] },
    favorites: { ...state.favorites, [company.id]: [] },
    recentlyViewed: { ...state.recentlyViewed, [company.id]: [] },
  };
}
