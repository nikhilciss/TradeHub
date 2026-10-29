import React, { useState } from "react";
import { Monitor, Server, Database, RefreshCw } from "lucide-react";
import { useDemo } from "../../context/DemoContext";
import { Heading, Modal, Badge, Empty } from "../../components/UI";
import {
  defaultConnection,
  defaultMappings,
  syncDefinitions,
} from "../../services/odooService";
export function OdooConsole() {
  const d = useDemo(),
    [tab, setTab] = useState("Overview"),
    [config, setConfig] = useState({ ...d.state.odoo }),
    [secret, setSecret] = useState(""),
    [error, setError] = useState(""),
    [failure, setFailure] = useState(false),
    [mapping, setMapping] = useState(null),
    [details, setDetails] = useState(null);
  const t = d.t,
    odoo = d.state.odoo,
    stamp = (value) =>
      value
        ? new Date(value).toLocaleString(d.lang === "de" ? "de-DE" : "en-GB")
        : t("Never");
  const change = (key, value) => setConfig({ ...config, [key]: value });
  const frequency = (name, value) => {
    if (!Number.isInteger(value) || value < 1 || value > 60) return;
    d.update((s) => ({
      ...s,
      odoo: {
        ...s.odoo,
        syncSettings: {
          ...s.odoo.syncSettings,
          [name]: { ...s.odoo.syncSettings[name], frequency: value },
        },
      },
    }));
  };
  const field = (key, label, type = "text", props = {}) => (
    <label>
      {t(label)}
      <input
        type={type}
        {...props}
        value={config[key]}
        onChange={(e) =>
          change(
            key,
            type === "number" ? Number(e.target.value) : e.target.value,
          )
        }
      />
    </label>
  );
  return (
    <>
      <Heading
        title={t("ERP configuration console")}
        eyebrow="ODOO 17 / INTEGRATION"
        action={
          <button
            className="primary"
            disabled={!odoo.enabled}
            onClick={() => d.sync("Full sync", failure)}
          >
            <RefreshCw size={16} />
            {t("Run full demo sync")}
          </button>
        }
      />
      <div className="notice permanent">
        <b>
          {t(
            "Demo Mode: Integration configuration and connection testing are simulated. No external ERP connection is established.",
          )}
        </b>
      </div>
      <div className="tabs">
        {[
          "Overview",
          "Connection",
          "Synchronization",
          "Data mapping",
          "Sync history",
        ].map((name) => (
          <button
            className={tab === name ? "active" : ""}
            key={name}
            onClick={() => setTab(name)}
          >
            {t(name)}
          </button>
        ))}
      </div>
      {tab === "Overview" && (
        <>
          <div className="stats integration-kpis">
            {[
              ["Connection status", t(odoo.connectionStatus)],
              ["Synced products", odoo.syncSettings.Products.records || 0],
              ["Synced customers", odoo.syncSettings.Customers.records || 0],
              [
                "Orders pending sync",
                d.state.orders.filter(
                  (o) => o.status === "submitted" && o.erpStatus === "pending",
                ).length,
              ],
              [
                "Failed operations",
                d.state.syncLogs.filter(
                  (l) => l.status === "error" && !l.retriedAt,
                ).length,
              ],
              ["Last successful sync", stamp(odoo.lastSync)],
            ].map(([label, value]) => (
              <div className="stat" key={label}>
                <div className="stat-label">{t(label)}</div>
                <strong>{value}</strong>
                <small>{t("Local demo only")}</small>
              </div>
            ))}
          </div>
          <section className="flow">
            <div>
              <Monitor />
              <span>EXPERIENCE</span>
              <h3>React B2B Storefront</h3>
              <p>Buyer / Admin</p>
            </div>
            <b>↔</b>
            <div>
              <Server />
              <span>FUTURE API</span>
              <h3>Express / Node adapter</h3>
              <p>Tenant permissions · queue · mapping</p>
            </div>
            <b>↔</b>
            <div>
              <Database />
              <span>SYSTEM OF RECORD</span>
              <h3>Odoo 17 ERP</h3>
              <p>Products · contracts · orders</p>
            </div>
          </section>
          <div className="two-columns">
            <section className="panel">
              <h2>{t("Synchronization")}</h2>
              <p>
                {t("Near-real-time order target; master data at least hourly.")}
              </p>
              <p>{t("Products and customers remain local sample records.")}</p>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={failure}
                  onChange={(e) => setFailure(e.target.checked)}
                />
                {t("Simulate failure")}
              </label>
              <div className="inline">
                <button
                  className="secondary"
                  onClick={() => d.sync("Products", failure)}
                >
                  {t("Manual sync")} · {t("Products")}
                </button>
                <button
                  className="secondary"
                  onClick={() => d.sync("Orders", failure)}
                >
                  {t("Manual sync")} · {t("Orders")}
                </button>
              </div>
            </section>
            <section className="panel">
              <h2>{t("Connection status")}</h2>
              <Badge value={odoo.connectionStatus} />
              <p>{odoo.url}</p>
              <button
                disabled={odoo.connectionStatus === "testing"}
                className="primary"
                onClick={() => d.simulateOdooConnection(failure)}
              >
                {t(
                  odoo.connectionStatus === "testing"
                    ? "testing"
                    : "Test connection",
                )}
              </button>
              <p>
                {d.lang === "de"
                  ? "Die bestehende WordPress-Seite bleibt unverändert. Die künftige Portal-Subdomain und Odoo-Felder sind mit dem ERP-Partner abzustimmen."
                  : "Existing WordPress remains unchanged. Future portal subdomain and exact Odoo fields require ERP partner validation."}
              </p>
            </section>
          </div>
        </>
      )}
      {tab === "Connection" && (
        <section className="panel">
          <h2>{t("Odoo ERP Connection Settings")}</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              try {
                d.updateOdooConfig(config);
                setSecret("");
                setError("");
              } catch (err) {
                setError(t(err.message));
              }
            }}
          >
            <div className="two-columns">
              {field("name", "Integration name", "text", { required: true })}
              <label>
                {t("Odoo version")}
                <select
                  value={config.version}
                  onChange={(e) => change("version", e.target.value)}
                >
                  <option value="17.0">17.0</option>
                </select>
              </label>
              {field("url", "Odoo base URL", "url", { required: true })}
              {field("database", "Database name", "text", { required: true })}
              <label>
                {t("Authentication method")}
                <select
                  value={config.authMethod}
                  onChange={(e) => change("authMethod", e.target.value)}
                >
                  <option value="username_api_key">
                    {t("Username / API key (future integration)")}
                  </option>
                  <option value="username_password_demo">
                    {t("Username / password (demo only)")}
                  </option>
                </select>
              </label>
              {field("user", "API username / login", "text", {
                required: true,
              })}
              <label>
                {t("Temporary demo credential")}
                <input
                  type="password"
                  autoComplete="off"
                  value={secret}
                  placeholder="DEMO-ONLY"
                  onChange={(e) => setSecret(e.target.value)}
                />
                <small>
                  {t(
                    "Only non-sensitive demo values. The masked value is never saved.",
                  )}
                </small>
              </label>
              <label>
                {t("Environment")}
                <select
                  value={config.environment}
                  onChange={(e) => change("environment", e.target.value)}
                >
                  {["Development", "Staging", "Production"].map((s) => (
                    <option key={s} value={s}>
                      {t(s)}
                    </option>
                  ))}
                </select>
              </label>
              {field("timeout", "Connection timeout", "number", {
                min: 1,
                max: 120,
                required: true,
              })}
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => change("enabled", e.target.checked)}
                />
                {t("Integration enabled")}
              </label>
            </div>
            <p className="notice">
              {d.lang === "de"
                ? "Authentifizierungsmethode und API-Verfügbarkeit hängen von der tatsächlichen Odoo-Bereitstellung ab. Diese Demo prüft keine Zugangsdaten."
                : "Authentication method and API availability depend on the actual Odoo deployment. This demo does not verify credentials."}
            </p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <div className="inline">
              <button className="primary">{t("Save configuration")}</button>
              <button
                className="secondary"
                type="button"
                disabled={odoo.connectionStatus === "testing"}
                onClick={() => {
                  try {
                    d.updateOdooConfig(config);
                    d.simulateOdooConnection(failure);
                    setError("");
                  } catch (err) {
                    setError(t(err.message));
                  }
                }}
              >
                {t("Test connection")}
              </button>
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  setConfig({ ...odoo, ...defaultConnection });
                  setSecret("");
                  setError("");
                  d.updateOdooConfig(defaultConnection);
                }}
              >
                {t("Reset configuration")}
              </button>
              <Badge value={odoo.connectionStatus} />
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={failure}
                onChange={(e) => setFailure(e.target.checked)}
              />
              {t("Simulate failure")}
            </label>
          </form>
        </section>
      )}
      {tab === "Synchronization" && (
        <section className="panel">
          <h2>{t("Data Synchronization Configuration")}</h2>
          <p>
            {t("Near-real-time order target; master data at least hourly.")}
          </p>
          <p>
            {d.lang === "de"
              ? "Intervalle sind gespeicherte Demo-Konfiguration; es laufen keine Hintergrundjobs."
              : "Intervals are saved demo configuration; no background jobs run."}
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {[
                    "Enabled",
                    "Entity",
                    "Direction",
                    "Frequency (minutes)",
                    "Last sync",
                    "Status",
                    "Actions",
                  ].map((k) => (
                    <th key={k}>{t(k)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {syncDefinitions.map(([name, direction]) => {
                  const settings = odoo.syncSettings[name];
                  return (
                    <tr key={name}>
                      <td>
                        <input
                          aria-label={`${t("Enabled")} ${t(name)}`}
                          type="checkbox"
                          checked={settings.enabled}
                          onChange={(e) => {
                            const enabled = e.target.checked;
                            d.update((s) => ({
                              ...s,
                              odoo: {
                                ...s.odoo,
                                modules: enabled
                                  ? [...new Set([...s.odoo.modules, name])]
                                  : s.odoo.modules.filter((m) => m !== name),
                                syncSettings: {
                                  ...s.odoo.syncSettings,
                                  [name]: { ...settings, enabled },
                                },
                              },
                            }));
                          }}
                        />
                      </td>
                      <td>
                        <b>{t(name)}</b>
                      </td>
                      <td>{direction}</td>
                      <td>
                        <input
                          className="frequency-input"
                          aria-label={`${t("Frequency (minutes)")} ${t(name)}`}
                          type="number"
                          min="1"
                          max="60"
                          value={settings.frequency}
                          onChange={(e) =>
                            frequency(name, Number(e.target.value))
                          }
                        />
                      </td>
                      <td>{stamp(settings.lastSync)}</td>
                      <td>
                        <Badge value={settings.status} />
                      </td>
                      <td>
                        <button
                          className="secondary compact"
                          disabled={!settings.enabled || !odoo.enabled}
                          onClick={() => d.sync(name, failure)}
                        >
                          {t("Manual sync")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={failure}
              onChange={(e) => setFailure(e.target.checked)}
            />
            {t("Simulate failure")}
          </label>
        </section>
      )}
      {tab === "Data mapping" && (
        <section className="panel">
          <div className="section-title">
            <h2>{t("Data mapping")}</h2>
            <button
              className="secondary"
              onClick={() =>
                d.update((s) => ({
                  ...s,
                  odoo: {
                    ...s.odoo,
                    mapping: structuredClone(defaultMappings),
                  },
                }))
              }
            >
              {t("Reset mappings")}
            </button>
          </div>
          <p>{t("Illustrative mappings; ERP partner validation required.")}</p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {[
                    "Enabled",
                    "Entity",
                    "Model",
                    "Field mappings",
                    "Actions",
                  ].map((k) => (
                    <th key={k}>{t(k)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {odoo.mapping.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <input
                        aria-label={`${t("Enabled")} ${t(m.entity)}`}
                        type="checkbox"
                        checked={m.enabled}
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          d.update((s) => ({
                            ...s,
                            odoo: {
                              ...s.odoo,
                              mapping: s.odoo.mapping.map((x) =>
                                x.id === m.id ? { ...x, enabled } : x,
                              ),
                            },
                          }));
                        }}
                      />
                    </td>
                    <td>{t(m.entity)}</td>
                    <td>
                      <code>{m.model}</code>
                    </td>
                    <td className="mapping-fields">{m.fields}</td>
                    <td>
                      <button
                        className="secondary compact"
                        onClick={() => setMapping({ ...m })}
                      >
                        {t("Edit")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            {d.lang === "de"
              ? "Preislisten-Hierarchie, Bestandsreservierungen, Mandantenbezug und Rechnungszugriff: Prüfung ausstehend."
              : "Pricelist hierarchy, stock reservations, company isolation and invoice access: validation pending."}
          </p>
        </section>
      )}
      {tab === "Sync history" && (
        <section className="panel">
          <div className="section-title">
            <h2>{t("Sync history")}</h2>
            <button
              className="secondary"
              onClick={() => d.sync("Full sync", failure)}
            >
              {t("Run full demo sync")}
            </button>
          </div>
          {d.state.syncLogs.length ? (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {[
                      "Sync ID",
                      "Entity",
                      "Direction",
                      "Started at",
                      "Completed at",
                      "Records processed",
                      "Success count",
                      "Failed count",
                      "Status",
                      "Actions",
                    ].map((k) => (
                      <th key={k}>{t(k)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.state.syncLogs.map((l) => (
                    <tr key={l.id}>
                      <td title={l.id}>{l.id.slice(0, 8)}</td>
                      <td>{t(l.entity)}</td>
                      <td>{l.direction}</td>
                      <td>{stamp(l.startedAt || l.date)}</td>
                      <td>{l.completedAt ? stamp(l.completedAt) : "—"}</td>
                      <td>{l.recordsProcessed}</td>
                      <td>{l.successCount}</td>
                      <td>{l.failedCount}</td>
                      <td>
                        <Badge value={l.status} />
                      </td>
                      <td>
                        <div className="inline">
                          <button
                            className="secondary compact"
                            onClick={() => setDetails(l)}
                          >
                            {t("Details")}
                          </button>
                          {l.status === "error" && !l.retriedAt && (
                            <button
                              className="text-link"
                              disabled={
                                l.entity !== "Connection test" &&
                                (!odoo.enabled ||
                                  !odoo.syncSettings[l.entity]?.enabled)
                              }
                              onClick={() => {
                                if (l.entity === "Connection test")
                                  d.simulateOdooConnection(false);
                                else d.sync(l.entity);
                                d.update((s) => ({
                                  ...s,
                                  syncLogs: s.syncLogs.map((x) =>
                                    x.id === l.id
                                      ? {
                                          ...x,
                                          retriedAt: new Date().toISOString(),
                                        }
                                      : x,
                                  ),
                                }));
                              }}
                            >
                              {t("Retry")}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty>{t("No records found.")}</Empty>
          )}
        </section>
      )}
      {mapping && (
        <Modal title={t("Edit mapping")} onClose={() => setMapping(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              d.update((s) => ({
                ...s,
                odoo: {
                  ...s.odoo,
                  mapping: s.odoo.mapping.map((m) =>
                    m.id === mapping.id ? mapping : m,
                  ),
                },
              }));
              setMapping(null);
              d.notify("Configuration saved");
            }}
          >
            <h3>{t(mapping.entity)}</h3>
            <label>
              {t("Model")}
              <input
                required
                value={mapping.model}
                onChange={(e) =>
                  setMapping({ ...mapping, model: e.target.value })
                }
              />
            </label>
            <label>
              {t("Field mappings")}
              <textarea
                required
                rows={5}
                value={mapping.fields}
                onChange={(e) =>
                  setMapping({ ...mapping, fields: e.target.value })
                }
              />
            </label>
            <p className="notice">
              {t("Illustrative mappings; ERP partner validation required.")}
            </p>
            <button className="primary">{t("Save")}</button>
          </form>
        </Modal>
      )}
      {details && (
        <Modal title={t("Details")} onClose={() => setDetails(null)}>
          <h3>
            {t(details.entity)} · <Badge value={details.status} />
          </h3>
          <p>{details.details}</p>
          <dl className="specifications">
            <dt>Sync ID</dt>
            <dd>{details.id}</dd>
            <dt>{t("Records processed")}</dt>
            <dd>{details.recordsProcessed}</dd>
            <dt>{t("Started at")}</dt>
            <dd>{stamp(details.startedAt)}</dd>
            <dt>{t("Completed at")}</dt>
            <dd>{stamp(details.completedAt)}</dd>
          </dl>
          <p className="notice">
            {t(
              "Demo Mode: Integration configuration and connection testing are simulated. No external ERP connection is established.",
            )}
          </p>
        </Modal>
      )}
    </>
  );
}
