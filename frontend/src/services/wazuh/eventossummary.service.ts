import { getToken } from "../../utils/auth";

export interface EventosSummary {
  labels: string[];
  values: number[];
}

export async function getEventosSummary(
  dias: string | number = "todos" // 👈 parâmetro opcional
): Promise<EventosSummary> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(
    `${baseUrl}/api/acesso/wazuh/eventos-summary?dias=${dias}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    let msg = "Erro ao buscar eventos summary";
    try {
      const err = await response.json();
      if (err?.error?.message) msg = err.error.message;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();
  const eventos = data?.eventos ?? { labels: [], values: [] };

  return {
    labels: Array.isArray(eventos.labels) ? eventos.labels : [],
    values: Array.isArray(eventos.values) ? eventos.values : [],
  };
}