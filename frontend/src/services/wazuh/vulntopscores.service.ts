// src/services/wazuh/topscoresvulnerabilidades.service.ts
import { getToken } from "../../utils/auth";

export interface TopScoreItem {
  score: string;  // CVSS base score já formatado (ex: "7.8", "5.5")
  total: number;  // Quantidade de vulnerabilidades com esse score
}

/**
 * Busca os top pacotes (packages) com mais vulnerabilidades.
 * @param size Quantidade de pacotes a retornar (default 5)
 * @param dias Intervalo de tempo ("1" | "7" | "15" | "30" | "todos")
 */
export async function getTopScoresVulnerabilidades(
  size: number = 5,
  dias: string = "todos"
): Promise<TopScoreItem[]> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = new URL(`${baseUrl}/api/acesso/wazuh/vulnerabilidades/top-scores`);
  if (size) url.searchParams.set("size", String(size));
  if (dias) url.searchParams.set("dias", dias);

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
    let raw = parseFloat(item?.score ?? "0"); // transforma em número
    let formatted = isNaN(raw) ? "0" : raw.toFixed(1); // formata 1 casa decimal
    return {
      score: formatted,
      total: Number(item?.total ?? 0),
    };
  });
}
