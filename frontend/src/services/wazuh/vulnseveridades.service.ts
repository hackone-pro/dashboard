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

export async function getVulnSeveridades(agent?: string): Promise<VulnSeveridades> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const params = new URLSearchParams();
  if (agent) params.append("agent", agent);

  const response = await fetch(
    `${baseUrl}/api/acesso/wazuh/vulnerabilidades/severidade?${params.toString()}`,
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
  const aggs = data?.aggregations ?? {};

  return {
    critical: aggs.Critical ?? 0,
    high: aggs.High ?? 0,
    medium: aggs.Medium ?? 0,
    low: aggs.Low ?? 0,
    pending: aggs.Pending ?? 0,
    total: aggs.Total ?? 0,
  };
}