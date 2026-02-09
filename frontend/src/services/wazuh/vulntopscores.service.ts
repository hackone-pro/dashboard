// src/services/wazuh/topscoresvulnerabilidades.service.ts
import { getToken } from "../../utils/auth";

export interface TopScoreItem {
  score: string;  // CVSS base score formatado (ex: "7.8")
  total: number;  // Quantidade de vulnerabilidades
}

/**
 * Busca os Top Scores (CVSS) de vulnerabilidades.
 * @param size Quantidade de scores a retornar (default 5)
 * @param dias Intervalo de tempo ("1" | "7" | "15" | "30" | "todos")
 * @param agent Nome do agente (opcional)
 */
export async function getTopScoresVulnerabilidades(
  size: number = 5,
  dias: string = "todos",
  agent?: string
): Promise<TopScoreItem[]> {

  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = new URL(
    `${baseUrl}/api/acesso/wazuh/vulnerabilidades/top-scores`
  );

  url.searchParams.set("size", String(size));
  url.searchParams.set("dias", dias);

  if (agent) {
    url.searchParams.set("agent", agent);
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let msg = "Erro ao buscar top scores de vulnerabilidades";
    try {
      const err = await response.json();
      if (err?.error?.message) msg = err.error.message;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();
  const lista = Array.isArray(data?.topScores) ? data.topScores : [];

  return lista.map((item: any) => {
    const raw = parseFloat(item?.score ?? "0");
    return {
      score: isNaN(raw) ? "0.0" : raw.toFixed(1),
      total: Number(item?.total ?? 0),
    };
  });
}