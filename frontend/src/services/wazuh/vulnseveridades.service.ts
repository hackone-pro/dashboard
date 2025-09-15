// src/services/wazuh/vulnseveridades.service.ts
import { getToken } from "../../utils/auth";

export interface VulnSeveridades {
  critical: number;
  high: number;
  medium: number;
  low: number;
  pending: number; // "Pendentes (Avaliação)"
  total?: number;  // opcional: total de vulnerabilidades
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

  // Proteções contra respostas vazias
  const aggs = data?.aggregations ?? {};
  const bucketsSev = aggs?.severity?.buckets ?? {};
  const bucketsStatus = aggs?.status_counts?.buckets ?? {};

  const critical = Number(bucketsSev?.Critical?.doc_count ?? 0);
  const high     = Number(bucketsSev?.High?.doc_count ?? 0);
  const medium   = Number(bucketsSev?.Medium?.doc_count ?? 0);
  const low      = Number(bucketsSev?.Low?.doc_count ?? 0);

  // Em "Pending" entram Pending e Pending - Evaluation (sua query já soma via should).
  // Aqui usamos diretamente o doc_count do bucket Pending.
  const pending  = Number(bucketsStatus?.Pending?.doc_count ?? 0);

  const total    = Number(aggs?.total?.doc_count ?? (critical + high + medium + low)); // fallback

  return { critical, high, medium, low, pending, total };
}