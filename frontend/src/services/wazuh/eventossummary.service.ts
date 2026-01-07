// src/services/wazuh/eventossummary.service.ts
import { getToken } from "../../utils/auth";

export interface EventosSummary {
  labels: string[];
  values: number[];
}

export async function getEventosSummary(
  opts?: { from?: string; to?: string; dias?: number }
): Promise<EventosSummary> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = new URL(`${baseUrl}/api/acesso/wazuh/eventos-summary`);

  if (opts?.from && opts?.to) {
    url.searchParams.set("from", opts.from);
    url.searchParams.set("to", opts.to);
  } else if (opts?.dias) {
    url.searchParams.set("dias", String(opts.dias));
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar eventos summary");
  }

  const data = await response.json();
  return data?.eventos ?? { labels: [], values: [] };
}
