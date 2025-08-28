// src/service/wazuh/topagentscis.service.ts
import { getToken } from "../../utils/auth";

export interface TopAgentCisItem {
  agent_name: string;
  total_eventos: number;
  media_score: number;       // média de rule.level (quanto menor, melhor)
  score_cis_percent: number; // 0–100 (normalização no backend)
}

/**
 * Busca Top agentes com menores scores CIS (via SCA).
 * @param dias "1" | "7" | "15" | "30" | "todos" (default "7")
 */
export async function getTopAgentsCis(dias: string = "7"): Promise<TopAgentCisItem[]> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = new URL(`${baseUrl}/api/acesso/wazuh/top-agentes-cis`);
  if (dias) url.searchParams.set("dias", dias);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let mensagem = "Erro ao buscar Top Agentes CIS";
    try {
      const err = await response.json();
      if (err?.error?.message) mensagem = err.error.message;
    } catch {}
    throw new Error(mensagem);
  }

  const data = await response.json();
  const lista = Array.isArray(data?.topAgentesCis) ? data.topAgentesCis : [];

  return lista.map((item: any) => ({
    agent_name: item?.agente ?? "",
    total_eventos: Number(item?.total_eventos ?? 0),
    media_score: Number(item?.media_score ?? 0),
    score_cis_percent: Number(item?.score_cis_percent ?? 0),
  }));
}
