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

// ─── LLM Purpose ─────────────────────────────────────────────────────────────

export type LLMPurpose = "chat" | "analysis";

export const LLM_PURPOSE_MAP: Record<LLMPurpose, number> = {
  chat: 0,
  analysis: 1,
};

export type LLMConfigEntry = {
  id: string;
  providerType: ProviderType;
  model: string;
  apiKey: string | null;
  endpoint: string | null;
};

export type LLMConfigResponse = {
  chat: LLMConfigEntry | null;
  analysis: LLMConfigEntry | null;
};

// Formato bruto retornado pela API
type LLMConfigRaw = {
  id: string;
  tenantId: string;
  llmProvider: number | null;
  purpose: number | null;
  apiKey: string | null;
  model: string;
  endpoint: string | null;
  systemPrompt: string | null;
  created: string;
  lastModified: string | null;
};

export type LLMCustomerPayload = {
  purpose: number;
  providerType: ProviderType;
  model: string;
  apiKey: string;
  endpoint: string | null;
  systemPrompt: string | null;
};

export type LLMUpdatePayload = {
  llmProvider: number;
  purpose: number;
  model: string;
  apiKey: string;
  endpoint: string | null;
  systemPrompt: string | null;
};

// ─── Busca configuracao LLM do tenant ────────────────────────────────────────

function rawToEntry(raw: LLMConfigRaw): LLMConfigEntry | null {
  if (raw.llmProvider === null) return null;
  return {
    id: raw.id,
    providerType: raw.llmProvider as ProviderType,
    model: raw.model,
    apiKey: raw.apiKey,
    endpoint: raw.endpoint,
  };
}

export async function getLLMConfig(): Promise<LLMConfigResponse> {
  const { data } = await axios.get<LLMConfigRaw[]>(
    `${CUSTOMERS_API_URL}/api/customers/llm`,
    { headers: serviceHeaders() }
  );

  const chatRaw = data.find((c) => c.purpose === 0);
  const analysisRaw = data.find((c) => c.purpose === 1);

  return {
    chat: chatRaw ? rawToEntry(chatRaw) : null,
    analysis: analysisRaw ? rawToEntry(analysisRaw) : null,
  };
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
): Promise<void> {
  await axios.post(
    `${CUSTOMERS_API_URL}/api/customers/llm`,
    payload,
    { headers: serviceHeaders() }
  );
}

// ─── Atualiza configuração existente ─────────────────────────────────────────

export async function updateLLMConfig(
  id: string,
  payload: LLMUpdatePayload
): Promise<void> {
  await axios.put(
    `${CUSTOMERS_API_URL}/api/customers/llm/${id}`,
    payload,
    { headers: serviceHeaders() }
  );
}