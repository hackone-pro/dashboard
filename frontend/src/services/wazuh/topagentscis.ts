import { getToken } from "../../utils/auth";

export interface TopAgentCisItem {
  agent_name: string;
  total_eventos: number;
  media_score: number;
  score_cis_percent: number;
}

/**
 * Busca Top agentes com menores scores CIS (via SCA).
 * Aceita filtro por dias OU período absoluto (calendário).
 */
export async function getTopAgentsCis(
  dias?: string,
  periodo?: { from: string; to: string }
): Promise<TopAgentCisItem[]> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = new URL(`${baseUrl}/api/acesso/wazuh/top-agentes-cis`);

  // 🔹 Prioridade para calendário
  if (periodo?.from && periodo?.to) {
    url.searchParams.set("from", periodo.from);
    url.searchParams.set("to", periodo.to);
  } else if (dias) {
    url.searchParams.set("dias", dias);
  }

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
  const lista = Array.isArray(data?.topAgentesCis)
    ? data.topAgentesCis
    : [];

  return lista.map((item: any) => ({
    agent_name: item?.agente ?? "",
    total_eventos: Number(item?.total_eventos ?? 0),
    media_score: Number(item?.media_score ?? 0),
    score_cis_percent: Number(item?.score_cis_percent ?? 0),
  }));
}
