// src/services/wazuh/anovulnerabilidades.service.ts
import { getToken } from "../../utils/auth";

export interface AnoVulnerabilidade {
  ano: string;                       // Ex: "2025"
  total: number;                     // Total de vulnerabilidades no ano
  severity: Record<string, number>;  // Ex: { Critical: 4, High: 42, Medium: 15 }
}

/**
 * Busca vulnerabilidades agrupadas por ano de publicação.
 * @param dias Intervalo de tempo ("1" | "7" | "15" | "30" | "todos")
 */
 export async function getAnoVulnerabilidades(
  dias: string = "todos",
  agent?: string
): Promise<AnoVulnerabilidade[]> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = new URL(`${baseUrl}/api/acesso/wazuh/vulnerabilidades/por-ano`);
  if (dias) url.searchParams.set("dias", dias);
  if (agent) url.searchParams.set("agent", agent);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let msg = "Erro ao buscar vulnerabilidades por ano";
    try {
      const err = await response.json();
      if (err?.error?.message) msg = err.error.message;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();
  const lista = Array.isArray(data?.porAno) ? data.porAno : [];

  // Normaliza saída
  return lista
  .sort((a: any, b: any) => Number(b.ano) - Number(a.ano))
  .slice(0, 5)
  .map((item: any) => ({
    ano: String(item?.ano ?? "Desconhecido"),
    total: Number(item?.total ?? 0),
    severity: item?.severity ?? {},
  }));
}
