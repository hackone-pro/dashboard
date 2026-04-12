// src/services/azure-api/llm.service.ts

import axios from "axios";
import { serviceHeaders } from "./headers";

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
export type LLMPurpose = "chat" | "analysis";

export type LLMConfigEntry = {
  providerType: ProviderType;
  model: string;
  apiKey: string;
  endpoint: string | null;
};

export type LLMConfigResponse = {
  chat: LLMConfigEntry | null;
  analysis: LLMConfigEntry | null;
};

export type LLMCustomerPayload = {
  purpose: LLMPurpose;
  providerType: ProviderType;
  model: string;
  apiKey: string;
  endpoint: string | null;
  systemPrompt: string | null;
};

// ─── Busca configuracao LLM do tenant ────────────────────────────────────────

export async function getLLMConfig(): Promise<LLMConfigResponse> {
  const { data } = await axios.get<LLMConfigResponse>(
    `${CUSTOMERS_API_URL}/api/customers/llm`,
    { headers: serviceHeaders() }
  );
  return data;
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
    { headers: serviceHeaders() }
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
      headers: serviceHeaders(),
    }
  );
  return data;
}

// ─── Salva configuração na API de customers ───────────────────────────────────

export async function saveLLMConfig(
  payload: LLMCustomerPayload
): Promise<string> { // ← era void, agora retorna string (clientId)
  const { data } = await axios.post<string>(
    `${CUSTOMERS_API_URL}/api/customers/llm`,
    payload,
    { headers: serviceHeaders() }
  );
  return data; // ← retorna o clientId gerado
}