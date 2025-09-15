// src/services/wazuh/agentesvulnerabilidades.service.ts
import { getToken } from "../../utils/auth";

export interface TopAgenteVulnerabilidade {
  agent: string;                      // Nome do agente
  total: number;                      // Total de vulnerabilidades
  severity: Record<string, number>;   // Ex: { Critical: 2, High: 10, Medium: 5 }
}

/**
 * Busca os top agentes com mais vulnerabilidades.
 * @param size Quantidade de agentes a retornar (default 5)
 * @param dias Intervalo de tempo ("1" | "7" | "15" | "30" | "todos")
 */
export async function getTopAgentesVulnerabilidades(
  size: number = 5,
  dias: string = "todos"
): Promise<TopAgenteVulnerabilidade[]> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = new URL(`${baseUrl}/api/acesso/wazuh/vulnerabilidades/top-agentes`);
  if (size) url.searchParams.set("size", String(size));
  if (dias) url.searchParams.set("dias", dias);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let msg = "Erro ao buscar top agentes de vulnerabilidades";
    try {
      const err = await response.json();
      if (err?.error?.message) msg = err.error.message;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();
  const lista = Array.isArray(data?.topAgentes) ? data.topAgentes : [];

  // Normaliza saída
  return lista.map((item: any) => {
    const severity: Record<string, number> = {};
    if (Array.isArray(item?.por_severidade)) {
      for (const s of item.por_severidade) {
        severity[s.key] = Number(s.doc_count || 0);
      }
    } else if (item?.severity) {
      Object.assign(severity, item.severity);
    }

    return {
      agent: String(item?.key ?? item?.agent ?? "Desconhecido"),
      total: Number(item?.total ?? item?.doc_count ?? 0),
      severity,
    };
  });
}
