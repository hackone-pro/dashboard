// src/services/azure-api/llm.service.ts

import axios from "axios";
import { getToken } from "../../utils/auth";

const CHAT_API_URL      = import.meta.env.VITE_CHAT_API_URL;
const CUSTOMERS_API_URL = import.meta.env.VITE_CUSTOMERS_API_URL;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ProviderType = 0 | 1 | 2 | 3 | 4;

export const PROVIDERS: { label: string; value: ProviderType }[] = [
  { label: "OpenAI",        value: 0 },
  { label: "Azure Foundry", value: 1 },
  { label: "DeepSeek",      value: 2 },
  { label: "Claude",        value: 3 },
  { label: "Gemini",        value: 4 },
];

// Payload para salvar na API de customers (conforme técnico)
export type LLMCustomerPayload = {
  providerType: ProviderType;
  model: string;
  apiKey: string;
  endpoint: string | null;
  systemPrompt: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Valida chave de API ──────────────────────────────────────────────────────

export async function validateApiKey(
  provider: ProviderType,
  apiKey: string,
  endpoint?: string
): Promise<boolean> {
  const { data } = await axios.post<boolean>(
    `${CHAT_API_URL}/api/llm/validate-key`,
    {
      provider,
      apiKey,
      endpoint: endpoint || null,
    },
    { headers: { ...authHeaders() } }
  );
  return data;
}

// ─── Busca modelos disponíveis ────────────────────────────────────────────────

export async function getAvailableModels(
  provider: ProviderType,
  apiKey: string,
  endpoint?: string
): Promise<string[]> {
  const params: Record<string, string> = {
    Provider: String(provider),
    ApiKey: apiKey,
  };

  if (endpoint) params.Endpoint = endpoint;

  const { data } = await axios.get<string[]>(
    `${CHAT_API_URL}/api/llm/models`,
    {
      params,
      headers: { ...authHeaders() },
    }
  );
  return data;
}

// ─── Salva configuração na API de customers ───────────────────────────────────

export async function saveLLMConfig(
  payload: LLMCustomerPayload
): Promise<void> {
  await axios.post(
    `${CUSTOMERS_API_URL}/api/customers/llm`,
    payload,
    { headers: { ...authHeaders() } }
  );
}