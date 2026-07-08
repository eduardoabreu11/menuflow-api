type AsaasEnvironment = "sandbox" | "production";

function getAsaasEnvironment(): AsaasEnvironment {
  return process.env.ASAAS_ENV === "production" ? "production" : "sandbox";
}

function getDefaultAsaasBaseUrl(environment: AsaasEnvironment) {
  if (environment === "production") {
    return "https://api.asaas.com/v3";
  }

  return "https://api-sandbox.asaas.com/v3";
}

const environment = getAsaasEnvironment();

export const asaasConfig = {
  environment,
  apiKey: process.env.ASAAS_API_KEY ?? "",
  baseUrl:
    process.env.ASAAS_BASE_URL?.trim() ||
    getDefaultAsaasBaseUrl(environment),
  webhookToken: process.env.ASAAS_WEBHOOK_TOKEN ?? "",
};

export function ensureAsaasConfigured() {
  if (!asaasConfig.apiKey) {
    throw new Error("ASAAS_API_KEY não configurada");
  }

  if (!asaasConfig.baseUrl) {
    throw new Error("ASAAS_BASE_URL não configurada");
  }

  return asaasConfig;
}

export function ensureAsaasWebhookConfigured() {
  if (!asaasConfig.webhookToken) {
    throw new Error("ASAAS_WEBHOOK_TOKEN não configurado");
  }

  return asaasConfig;
}