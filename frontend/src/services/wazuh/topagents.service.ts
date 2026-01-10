import { getToken } from "../../utils/auth";

export interface TopAgentItem {
  agente: string;
  agent_name: string;
  total_alertas: number;
  score: number; // 0–100
  severidade: {
    Baixo: number;
    Médio: number;
    Alto: number;
    Crítico: number;
  };
  modified: number;
  added: number;
  deleted: number;
}

export type TopAgentsFiltro =
  | { from: string; to: string }
  | { dias: string };

export async function getTopAgents(
  filtro?: TopAgentsFiltro
): Promise<TopAgentItem[]> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = new URL(`${baseUrl}/api/acesso/wazuh/top-agentes`);

  // ----------------------------------
  // PRIORIDADE: from / to
  // ----------------------------------
  if (filtro && "from" in filtro) {
    url.searchParams.set("from", filtro.from);
    url.searchParams.set("to", filtro.to);
  }
  // ----------------------------------
  // 🔁 FALLBACK: dias
  // ----------------------------------
  else if (filtro && "dias" in filtro) {
    url.searchParams.set("dias", filtro.dias);
  }

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
    const severidade = { Baixo: 0, Médio: 0, Alto: 0, Crítico: 0 };

    (item?.severidades || []).forEach((s: any) => {
      const level = Number(s.key);
      if (level >= 0 && level <= 6) severidade.Baixo += s.doc_count;
      else if (level <= 11) severidade.Médio += s.doc_count;
      else if (level <= 14) severidade.Alto += s.doc_count;
      else severidade.Crítico += s.doc_count;
    });

    return {
      agente: item?.agente ?? "",
      agent_name: item?.agente ?? "",
      total_alertas: Number(item?.total_alertas ?? 0),
      score: Number(item?.score ?? 0),
      severidade,
      modified: Number(item?.modified ?? 0),
      added: Number(item?.added ?? 0),
      deleted: Number(item?.deleted ?? 0),
    };
  });

  return resultado;
}
