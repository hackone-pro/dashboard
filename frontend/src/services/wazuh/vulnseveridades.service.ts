// src/services/wazuh/vulnseveridades.service.ts
import { getToken } from "../../utils/auth";

export interface VulnSeveridades {
  critical: number;
  high: number;
  medium: number;
  low: number;
  pending: number;
  total?: number;
}

export async function getVulnSeveridades(): Promise<VulnSeveridades> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(
    `${baseUrl}/api/acesso/wazuh/vulnerabilidades/severidade`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    let msg = "Erro ao buscar severidades de vulnerabilidades";
    try {
      const err = await response.json();
      if (err?.error?.message) msg = err.error.message;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();

  // 🔹 Caminho real dos dados
  const buckets = data?.aggregations?.severity?.buckets ?? {};
  const total = data?.aggregations?.total?.doc_count ?? 0;

  return {
    critical: buckets.Critical?.doc_count ?? 0,
    high: buckets.High?.doc_count ?? 0,
    medium: buckets.Medium?.doc_count ?? 0,
    low: buckets.Low?.doc_count ?? 0,
    pending: buckets.Pending?.doc_count ?? 0,
    total,
  };
}
