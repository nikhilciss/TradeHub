export const defaultAIConfig = {
  enabled: true,
  provider: "local_demo",
  name: "TradeHub order assistant",
  endpoint: "https://ai-demo.example.invalid",
  model: "demo-order-parser",
  deployment: "",
  apiVersion: "demo",
  timeout: 30,
  maxTokens: 1500,
  temperature: 0.2,
  textOrders: true,
  descriptionSearch: true,
  requireReview: true,
  retainInput: false,
  status: "not_tested",
  lastTest: null,
};
export function sanitizeAIConfig(input) {
  const config = Object.fromEntries(
    Object.keys(defaultAIConfig).map((key) => [
      key,
      input[key] ?? defaultAIConfig[key],
    ]),
  );
  if (!config.name.trim() || !config.model.trim())
    throw Error("Integration name and model are required.");
  if (
    !["local_demo", "openai", "azure_openai", "custom"].includes(
      config.provider,
    )
  )
    throw Error("Invalid AI provider.");
  let url;
  try {
    url = new URL(config.endpoint);
  } catch {
    throw Error("Enter a valid demo endpoint.");
  }
  if (
    url.protocol !== "https:" ||
    !url.hostname.endsWith(".invalid") ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw Error("Use an HTTPS .invalid demo endpoint without credentials.");
  if (config.provider === "azure_openai" && !config.deployment.trim())
    throw Error("Azure deployment name is required.");
  if (
    !Number.isInteger(config.timeout) ||
    config.timeout < 1 ||
    config.timeout > 120 ||
    !Number.isInteger(config.maxTokens) ||
    config.maxTokens < 100 ||
    config.maxTokens > 16000 ||
    !Number.isFinite(config.temperature) ||
    config.temperature < 0 ||
    config.temperature > 2
  )
    throw Error("Check timeout, token limit and temperature.");
  for (const key of ["enabled", "textOrders", "descriptionSearch"])
    if (typeof config[key] !== "boolean")
      throw Error("Invalid AI feature setting.");
  return { ...config, requireReview: true, retainInput: false };
}
export function testAIConfiguration(config, fail = false) {
  const now = new Date().toISOString();
  return {
    ...sanitizeAIConfig(config),
    status: !config.enabled || fail ? "error" : "simulated_success",
    lastTest: now,
  };
}
