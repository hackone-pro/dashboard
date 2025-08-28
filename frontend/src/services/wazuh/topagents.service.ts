// src/service/wazuh/topagents.service.ts
import { getToken } from "../../utils/auth";

export interface TopAgentItem {
  agent_name: string;
  total_alertas: number;
  score: number; // 0–100
}

/**
 * Busca os top agentes no Wazuh agregados por agente,
 * retornando apenas: nome, total de alertas e score.
 * @param dias "1" | "7" | "15" | "30" | "todos" (default "7")
 */
export async function getTopAgents(dias: string = "7"): Promise<TopAgentItem[]> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = new URL(`${baseUrl}/api/acesso/wazuh/top-agentes`);
  if (dias) url.searchParams.set("dias", dias);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let mensagem = "Erro ao buscar top agentes";
    try {
      const err = await response.json();
      if (err?.error?.message) mensagem = err.error.message;
    } catch {
      /* ignore */
    }
    throw new Error(mensagem);
  }

  const data = await response.json();

  const lista = Array.isArray(data?.topAgentes) ? data.topAgentes : [];

  const resultado: TopAgentItem[] = lista.map((item: any) => ({
    agent_name: item?.agente ?? "",
    total_alertas: Number(item?.total_alertas ?? 0),
    score: Number(item?.score ?? 0),
  }));

  return resultado;
}