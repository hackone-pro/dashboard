// src/services/wazuh/topvulnerabilidades.service.ts
import { getToken } from "../../utils/auth";

export interface TopVulnerabilidade {
  key: string; // CVE, pacote ou agente
  total: number;
  severity: Record<string, number>; // Critical/High/Medium/Low...
}

/**
 * Busca o Top vulnerabilidades do backend Strapi.
 * @param by "cve" | "package" | "agent" (default: "cve")
 * @param size número de itens no top (default: 5)
 * @param dias "1" | "7" | "15" | "30" | "todos" (default: "todos")
 * @param agent nome do agente (opcional)
 */
export async function getTopVulnerabilidades(
  by: "cve" | "package" | "agent" = "cve",
  size: number = 5,
  dias: string = "todos",
  agent?: string
): Promise<TopVulnerabilidade[]> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = new URL(`${baseUrl}/api/acesso/wazuh/vulnerabilidades/top`);

  if (by) url.searchParams.set("by", by);
  if (size) url.searchParams.set("size", String(size));
  if (dias) url.searchParams.set("dias", dias);
  if (agent) url.searchParams.set("agent", agent); // ✅ NOVO

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let msg = "Erro ao buscar top vulnerabilidades";
    try {
      const err = await response.json();
      if (err?.error?.message) msg = err.error.message;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();
  const lista = Array.isArray(data?.topVulnerabilidades)
    ? data.topVulnerabilidades
    : [];

  // Normaliza o shape
  return lista.map((item: any) => ({
    key: String(item?.key ?? ""),
    total: Number(item?.total ?? item?.doc_count ?? 0),
    severity: Object.fromEntries(
      Object.entries(item?.severity ?? {}).map(([k, v]) => [k, Number(v)])
    ),
  }));
}
