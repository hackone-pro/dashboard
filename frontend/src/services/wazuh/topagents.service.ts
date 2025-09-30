// src/service/wazuh/topagents.service.ts
import { getToken } from "../../utils/auth";

export interface TopAgentItem {
  agent_name: string;
  total_alertas: number;
  score: number; // 0–100
  severidade: {
    Baixo: number;
    Médio: number;
    Alto: number;
    Crítico: number;
  };
}

/**
 * Busca os top agentes no Wazuh agregados por agente,
 * retornando: nome, total de alertas, score e severidade separada.
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

  const resultado: TopAgentItem[] = lista.map((item: any) => {
    // inicializa contadores
    const severidade = { Baixo: 0, Médio: 0, Alto: 0, Crítico: 0 };

    // percorre os buckets do backend
    (item?.severidades || []).forEach((s: any) => {
      const level = Number(s.key);
      if (level >= 0 && level <= 6) severidade.Baixo += s.doc_count;
      else if (level <= 11) severidade.Médio += s.doc_count;
      else if (level <= 14) severidade.Alto += s.doc_count;
      else severidade.Crítico += s.doc_count;
    });

    return {
      agent_name: item?.agente ?? "",
      total_alertas: Number(item?.total_alertas ?? 0),
      score: Number(item?.score ?? 0),
      severidade,
    };
  });

  return resultado;
}
