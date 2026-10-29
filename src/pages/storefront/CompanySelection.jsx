import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, ArrowRight, LogOut, ShieldCheck } from "lucide-react";
import { useDemo } from "../../context/DemoContext";
import { safeStoreDestination } from "../../services/accessService";
export function CompanySelection() {
  const d = useDemo(),
    navigate = useNavigate(),
    [params] = useSearchParams();
  return (
    <div className="company-selection">
      <header>
        <Link className="shop-logo" to="/companies">
          tradehub<span className="brand-dot">.</span>
        </Link>
        <div className="inline">
          <button
            className="language"
            onClick={() => d.setLang(d.lang === "en" ? "de" : "en")}
          >
            {d.lang.toUpperCase()} / {d.lang === "en" ? "DE" : "EN"}
          </button>
          <button
            className="secondary"
            onClick={() => {
              d.login("");
              navigate("/login");
            }}
          >
            <LogOut size={16} />
            {d.t("Sign out")}
          </button>
        </div>
      </header>
      <main>
        <span className="eyebrow">{d.t("YOUR BUSINESS WORKSPACES")}</span>
        <h1>{d.t("Choose your company")}</h1>
        <p>
          {d.t("Signed in as")} <b>{d.identity.email}</b>
        </p>
        <p>
          {d.t(
            "Select a linked company to access its catalog, contract prices and orders.",
          )}
        </p>
        <div className="company-grid">
          {d.accessibleCompanies.map(({ company, role }) => (
            <button
              className="company-card"
              key={company.id}
              onClick={() => {
                d.setCompanyId(company.id);
                navigate(
                  d.identity.role === "field_sales"
                    ? "/sales"
                    : safeStoreDestination(params.get("next")),
                  { replace: true },
                );
              }}
            >
              <span className="company-monogram">
                <Building2 size={25} />
              </span>
              <small>
                {company.code} · {company.country}
              </small>
              <h2>{company.name}</h2>
              <p>
                {company.city} · {company.tier}
              </p>
              <span className="company-role">
                <ShieldCheck size={14} />
                {d.t(
                  role === "customer_admin"
                    ? "Customer administrator"
                    : role === "buyer"
                      ? "Buyer"
                      : "Field sales",
                )}
              </span>
              <span className="company-enter">
                {d.t("Enter company workspace")}
                <ArrowRight size={18} />
              </span>
            </button>
          ))}
        </div>
        {!d.accessibleCompanies.length && (
          <section className="panel empty">
            <Building2 size={32} />
            <h2>{d.t("No active company access")}</h2>
            <p>
              {d.t(
                "Your account has no approved company memberships. Contact your company administrator.",
              )}
            </p>
          </section>
        )}
        <div className="notice">
          {d.t(
            "Each company has its own cart, prices, orders, invoices and purchasing permissions.",
          )}
          <br />
          {d.t("Demo only · browser-local data")}
        </div>
      </main>
    </div>
  );
}
