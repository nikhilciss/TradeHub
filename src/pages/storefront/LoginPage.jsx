import { profileFor, staffLanding } from "../../services/roleService";
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useDemo } from "../../context/DemoContext";
import {
  authenticateDemo,
  safeStoreDestination,
} from "../../services/accessService";
export function LoginPage({ admin = false }) {
  const d = useDemo(),
    nav = useNavigate(),
    [params] = useSearchParams();
  const user = d.state.users.find(
    (u) => u.active && u.role === (admin ? "admin" : "buyer"),
  );
  const [email, setEmail] = useState(user?.email || ""),
    [password, setPassword] = useState(user?.password || ""),
    [error, setError] = useState("");
  const next = safeStoreDestination(params.get("next"));
  const submit = (e) => {
    e.preventDefault();
    try {
      const account = authenticateDemo(d.state, email, password, admin);
      d.login(account.id);
      nav(
        admin && account.role !== "field_sales"
          ? staffLanding(d.state, account)
          : "/companies?next=" + encodeURIComponent(next),
        { replace: true },
      );
    } catch (err) {
      setError(d.t(err.message));
    }
  };
  return (
    <div className="login">
      <section className="login-story">
        <Link className="brand" to={admin ? "/admin/login" : "/login"}>
          tradehub<span className="brand-dot">.</span>
        </Link>
        <div>
          <div className="eyebrow">
            {admin ? "INTERNAL OPERATIONS" : "YOUR BUSINESS. BETTER CONNECTED."}
          </div>
          <h1>
            {admin
              ? d.lang === "de"
                ? "Ein Überblick. Alle Abläufe."
                : "One view. Every operation."
              : d.lang === "de"
                ? "Ihr Sortiment. Ihre Preise. Ihr Geschäft."
                : "Your products. Your prices. Your business."}
          </h1>
          <p>
            {d.t(
              admin
                ? "ERP configuration console"
                : "Professional supply, personal service.",
            )}
          </p>
        </div>
        <Link
          className="hero-category-link"
          to={admin ? "/admin/login" : "/login"}
        >
          {d.t("Secure business workspace")}
        </Link>
      </section>
      <section className="login-form">
        <div className="login-card">
          <div className="section-title">
            <span className="badge synced">{d.t("Local demo only")}</span>
            <button
              className="language"
              onClick={() => d.setLang(d.lang === "en" ? "de" : "en")}
            >
              {d.lang.toUpperCase()} / {d.lang === "en" ? "DE" : "EN"}
            </button>
          </div>
          <h2>{d.t(admin ? "Admin login" : "Business customer login")}</h2>
          <p>
            {d.t(
              admin
                ? "Sign in to manage catalog, orders and ERP configuration."
                : "Sign in, choose your company, then start ordering.",
            )}
          </p>
          {admin && (
            <div className="staff-login-options">
              <span className="staff-options-label">
                {d.t("Choose a demo staff account")}
              </span>
              {d.state.users
                .filter(
                  (u) =>
                    u.active &&
                    ["admin", "inside_sales", "field_sales"].includes(u.role) &&
                    profileFor(d.state, u)?.active,
                )
                .map((u) => (
                  <button
                    type="button"
                    key={u.id}
                    className={
                      email === u.email
                        ? "staff-option selected"
                        : "staff-option"
                    }
                    aria-pressed={email === u.email}
                    onClick={() => {
                      setEmail(u.email);
                      setPassword(u.password);
                      setError("");
                    }}
                  >
                    <strong>{profileFor(d.state, u).name}</strong>
                    <span>{u.name}</span>
                  </button>
                ))}
            </div>
          )}
          <form onSubmit={submit}>
            <label>
              {d.t("Email")}
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              {d.t("Public demo password")}
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <div className="notice">
              {d.t("Public demo credentials. No real authentication.")}
              <br />
              {d.t("Demo only · browser-local data")}
            </div>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button className="primary full">
              {d.t("Log in")} <ArrowRight size={17} />
            </button>
          </form>
          {
            <div className="staff-login-footer">
              <Link
                className="secondary full staff-login-entry"
                to={admin ? "/login" : "/admin/login"}
              >
                {d.t(admin ? "Back to B2B customer login" : "Admin login")}
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          }
        </div>
      </section>
    </div>
  );
}
