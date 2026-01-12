import { getToken } from "../../utils/auth";

export interface TopAgentSyscheckItem {
  agente: string;
  total_alertas: number;
  score: number;
  modified: number;
  added: number;
  deleted: number;
}

export async function getTopAgentsSyscheck(opts?: {
  from?: string;
  to?: string;
  dias?: string | number;
}): Promise<TopAgentSyscheckItem[]> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = new URL(`${baseUrl}/api/acesso/wazuh/top-agentes-syscheck`);

  if (opts?.from) url.searchParams.set("from", opts.from);
  if (opts?.to) url.searchParams.set("to", opts.to);
  if (opts?.dias) url.searchParams.set("dias", String(opts.dias));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let msg = "Erro ao buscar top agentes (syscheck)";
    try {
      const err = await response.json();
      if (err?.error?.message) msg = err.error.message;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();
  return Array.isArray(data?.topAgentes) ? data.topAgentes : [];
}
