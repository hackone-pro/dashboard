import { getToken } from "../../utils/auth";

export interface OvertimeEventos {
  labels: string[];
  datasets: { name: string; data: number[] }[];
}

export type OvertimeFiltro =
  | { from: string; to: string }
  | { dias: number };

export async function getOvertimeEventos(
  filtro?: OvertimeFiltro
): Promise<OvertimeEventos> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  let from: string | undefined;
  let to: string | undefined;

  // 🔥 CONVERSÃO DE DIAS → FROM / TO
  if (filtro && "dias" in filtro) {
    const now = new Date();
    const start = new Date();
    start.setDate(now.getDate() - filtro.dias);
    start.setHours(0, 0, 0, 0);

    from = start.toISOString();
    to = now.toISOString();
  }

  if (filtro && "from" in filtro && "to" in filtro) {
    from = filtro.from;
    to = filtro.to;
  }

  // fallback absoluto (segurança)
  if (!from || !to) {
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    from = start.toISOString();
    to = now.toISOString();
  }

  const url = new URL(`${baseUrl}/api/acesso/wazuh/overtime`);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar eventos overtime");
  }

  const data = await response.json();
  const overtime = data?.overtime ?? { labels: [], datasets: [] };

  return {
    labels: overtime.labels ?? [],
    datasets: overtime.datasets ?? [],
  };
}
