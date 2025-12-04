// src/services/wazuh/agentesvulnerabilidades.service.ts
import { getToken } from "../../utils/auth";

export interface TopAgenteVulnerabilidade {
  agent: string;
  total: number;
  severity: Record<string, number>;
}

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

  // 🔥 Backend retorna diretamente um array de agentes
  const lista = Array.isArray(data) ? data : [];

  return lista.map((item: any) => ({
    agent: String(item.agent ?? "Desconhecido"),
    total: Number(item.total ?? 0),
    severity: item.severity ? { ...item.severity } : {}
  }));
}
