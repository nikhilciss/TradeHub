import React, { useState } from "react";
import { Sparkles, Save, FlaskConical, ShieldCheck } from "lucide-react";
import { useDemo } from "../../context/DemoContext";
import { Heading, Badge, Empty } from "../../components/UI";
import { defaultAIConfig } from "../../services/aiConfigService";
export function AIConfiguration() {
  const d = useDemo(),
    [config, setConfig] = useState({ ...d.state.aiConfig }),
    [secret, setSecret] = useState(""),
    [error, setError] = useState(""),
    [testing, setTesting] = useState(false),
    [fail, setFail] = useState(false);
  const set = (key, value) => setConfig({ ...config, [key]: value });
  const save = (e) => {
    e.preventDefault();
    try {
      d.saveAIConfig(config);
      setConfig({ ...config, status: "not_tested" });
      setSecret("");
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };
  const test = () => {
    try {
      d.saveAIConfig(config);
      setError("");
      setTesting(true);
      setSecret("");
      setTimeout(() => {
        try {
          const result = d.testAIConfig(config, fail);
          setConfig(result);
        } catch (err) {
          setError(err.message);
        } finally {
          setTesting(false);
        }
      }, 500);
    } catch (err) {
      setError(err.message);
    }
  };
  const field = (key, label, type = "text", extra = {}) => (
    <label>
      {d.t(label)}
      <input
        {...extra}
        type={type}
        value={config[key]}
        onChange={(e) =>
          set(key, type === "number" ? Number(e.target.value) : e.target.value)
        }
      />
    </label>
  );
  return (
    <>
      <Heading
        title={d.t("AI configuration")}
        eyebrow="ORDER INTELLIGENCE"
        action={<Badge value={testing ? "testing" : d.state.aiConfig.status} />}
      >
        {d.t(
          "Configure the ordering assistant and preview a future server-side AI integration.",
        )}
      </Heading>
      <div className="notice permanent">
        <ShieldCheck size={16} />{" "}
        {d.t(
          "Simulation only. Provider settings are saved locally; no AI API request is sent. Never enter a real API key.",
        )}
      </div>
      <form onSubmit={save}>
        <div className="two-columns">
          <section className="panel">
            <h2>{d.t("Provider connection")}</h2>
            {field("name", "Integration name", "text", { required: true })}
            <label>
              {d.t("AI provider")}
              <select
                value={config.provider}
                onChange={(e) => set("provider", e.target.value)}
              >
                <option value="local_demo">Local demo parser</option>
                <option value="openai">OpenAI · planned</option>
                <option value="azure_openai">Azure OpenAI · planned</option>
                <option value="custom">Custom provider · planned</option>
              </select>
            </label>
            {field("endpoint", "Demo API endpoint", "url", { required: true })}
            {field("model", "Model / deployment model", "text", {
              required: true,
            })}
            {config.provider === "azure_openai" && (
              <>
                {field("deployment", "Deployment name", "text", {
                  required: true,
                })}
                {field("apiVersion", "API version", "text", { required: true })}
              </>
            )}
            <label>
              {d.t("Temporary demo API key")}
              <input
                type="password"
                autoComplete="off"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="DEMO-ONLY"
              />
              <small>
                {d.t("Never saved to localStorage or exported snapshots.")}
              </small>
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => set("enabled", e.target.checked)}
              />
              {d.t("Enable ordering assistant")}
            </label>
          </section>
          <div>
            <section className="panel">
              <h2>{d.t("Ordering capabilities")}</h2>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={config.textOrders}
                  onChange={(e) => set("textOrders", e.target.checked)}
                />
                {d.t("Email / PDF text to reviewed order lines")}
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={config.descriptionSearch}
                  onChange={(e) => set("descriptionSearch", e.target.checked)}
                />
                {d.t("Description search preview")}
              </label>
              <p className="notice">
                {d.t(
                  "These switches immediately control the customer AI-assisted ordering page. PDF uploads and OCR remain future capabilities.",
                )}
              </p>
              <div className="summary-line">
                <span>{d.t("Human review before adding to cart")}</span>
                <Badge value="required" />
              </div>
              <div className="summary-line">
                <span>{d.t("Store raw order text in logs")}</span>
                <Badge value="disabled" />
              </div>
            </section>
            <section className="panel">
              <h2>{d.t("Future request settings")}</h2>
              <p>
                {d.t(
                  "Planning fields only; local parsing does not consume tokens or use model temperature.",
                )}
              </p>
              <div className="two-columns">
                {field("timeout", "Timeout (seconds)", "number", {
                  min: 1,
                  max: 120,
                  required: true,
                })}
                {field("maxTokens", "Maximum output tokens", "number", {
                  min: 100,
                  max: 16000,
                  required: true,
                })}
                {field("temperature", "Temperature", "number", {
                  min: 0,
                  max: 2,
                  step: 0.1,
                  required: true,
                })}
              </div>
            </section>
          </div>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="panel">
          <div className="inline">
            <button className="primary" disabled={testing}>
              <Save size={16} />
              {d.t("Save configuration")}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={testing}
              onClick={test}
            >
              <FlaskConical size={16} />
              {d.t(testing ? "testing" : "Test configuration")}
            </button>
            <button
              type="button"
              className="secondary"
              disabled={testing}
              onClick={() => {
                setConfig({ ...defaultAIConfig });
                setSecret("");
                setError("");
                d.saveAIConfig(defaultAIConfig);
              }}
            >
              {d.t("Reset configuration")}
            </button>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={fail}
                onChange={(e) => setFail(e.target.checked)}
              />
              {d.t("Simulate failure")}
            </label>
          </div>
          <small>
            {d.t("Last test")}:{" "}
            {d.state.aiConfig.lastTest
              ? new Date(d.state.aiConfig.lastTest).toLocaleString("de-DE")
              : d.t("Never")}
          </small>
        </div>
      </form>
      <section className="panel">
        <h2>{d.t("Configuration test history")}</h2>
        {d.state.aiLogs.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {["Date", "AI provider", "Status", "Details"].map((x) => (
                    <th key={x}>{d.t(x)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {d.state.aiLogs.map((l) => (
                  <tr key={l.id}>
                    <td>{new Date(l.date).toLocaleString("de-DE")}</td>
                    <td>{l.provider}</td>
                    <td>
                      <Badge value={l.status} />
                    </td>
                    <td className="wrap-cell">{d.t(l.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>{d.t("No configuration tests yet.")}</Empty>
        )}
      </section>
    </>
  );
}
