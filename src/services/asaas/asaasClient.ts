import { asaasConfig, ensureAsaasConfigured } from "../../config/asaas.js";
import { AppError } from "../../utils/AppError.js";

type AsaasRequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type AsaasRequestOptions = {
  method?: AsaasRequestMethod | undefined;
  body?: unknown;
  headers?: Record<string, string> | undefined;
};

type AsaasErrorResponse = {
  errors?: Array<{
    code?: string;
    description?: string;
  }>;
};

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

function getAsaasErrorMessage(data: unknown) {
  if (
    typeof data === "object" &&
    data !== null &&
    "errors" in data &&
    Array.isArray((data as AsaasErrorResponse).errors)
  ) {
    const errors = (data as AsaasErrorResponse).errors ?? [];

    const descriptions = errors
      .map((error) => error.description)
      .filter(Boolean);

    if (descriptions.length > 0) {
      return descriptions.join(" | ");
    }
  }

  return "Erro ao comunicar com o Asaas";
}

export async function asaasRequest<T>(
  path: string,
  options: AsaasRequestOptions = {},
): Promise<T> {
  const config = ensureAsaasConfigured();

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "MenuFlow API",
    access_token: config.apiKey,
    ...(options.headers ?? {}),
  };

  const requestConfig: RequestInit = {
    method: options.method ?? "GET",
    headers: requestHeaders,
  };

  if (options.body !== undefined) {
    requestConfig.body = JSON.stringify(options.body);
  }

  let response: Response;

  try {
    response = await fetch(
      `${config.baseUrl}${normalizePath(path)}`,
      requestConfig,
    );
  } catch {
    throw new AppError("Não foi possível conectar ao Asaas", 502);
  }

  const responseText = await response.text();

  let responseData: unknown = null;

  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
  }

  if (!response.ok) {
    const message = getAsaasErrorMessage(responseData);

    throw new AppError(message, response.status >= 500 ? 502 : 400);
  }

  return responseData as T;
}

export function getAsaasEnvironmentInfo() {
  return {
    environment: asaasConfig.environment,
    baseUrl: asaasConfig.baseUrl,
    configured: Boolean(asaasConfig.apiKey),
  };
}