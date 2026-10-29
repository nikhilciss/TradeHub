import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useDemo } from "../../context/DemoContext";
import { homeFor, roles } from "../../components/UI";
export function LoginPage({ admin = false }) {
  const d = useDemo(),
    nav = useNavigate(),
    [params] = useSearchParams();
  const presets = d.state.users.filter((u) =>
    admin
      ? ["admin", "inside_sales"].includes(u.role)
      : ["buyer", "customer_admin", "field_sales"].includes(u.role),
  );
  const [selected, setSelected] = useState(presets[0]?.id || ""),
    user = presets.find((u) => u.id === selected) || presets[0];
  const [email, setEmail] = useState(user?.email || ""),
    [password, setPassword] = useState(user?.password || ""),
    [error, setError] = useState("");
  const next = params.get("next"),
    safeNext =
      next && /^\/store(?:\/|\?|$)/.test(next) && !next.includes("\\")
        ? next
        : null;
  const submit = (e) => {
    e.preventDefault();
    if (!user?.active) return setError(d.t("This demo account is disabled."));
    if (email !== user.email || password !== user.password)
      return setError(d.t("Use the public demo credentials shown below."));
    d.login(user.id);
    nav(
      admin
        ? "/admin"
        : user.role === "field_sales"
          ? "/sales"
          : safeNext || "/store",
      { replace: true },
    );
  };
  return (
    <div className="login">
      <section className="login-story">
        <Link className="brand" to="/store">
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
        <Link className="hero-category-link" to="/store">
          ← {d.t("Continue shopping")}
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
                : "Log in to see your contract prices and place orders.",
            )}
          </p>
          <form onSubmit={submit}>
            <label>
              {d.t("Demo persona")}
              <select
                value={selected}
                onChange={(e) => {
                  setSelected(e.target.value);
                  const u = presets.find((u) => u.id === e.target.value);
                  setEmail(u.email);
                  setPassword(u.password);
                  setError("");
                }}
              >
                {presets.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} · {roles[u.role]}
                  </option>
                ))}
              </select>
            </label>
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
          <div className="login-links">
            <Link to="/store">{d.t("Continue shopping")}</Link>
            <Link to={admin ? "/login" : "/admin/login"}>
              {d.t(admin ? "Business customer login" : "Admin login")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
