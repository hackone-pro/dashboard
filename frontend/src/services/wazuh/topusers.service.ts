import { getToken } from "../../utils/auth";

export interface TopUserItem {
  user: string;
  agent_id: string;
  agent_name: string;
  count: number;
}

export type TopUsersFiltro =
  | { from: string; to: string }
  | { dias: number };

export async function getTopUsers(
  filtro?: TopUsersFiltro
): Promise<TopUserItem[]> {

  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = new URL(`${baseUrl}/api/acesso/wazuh/top-users`);

  if (filtro && "from" in filtro) {
    url.searchParams.set("from", filtro.from);
    url.searchParams.set("to", filtro.to);
  } else if (filtro && "dias" in filtro) {
    url.searchParams.set("dias", String(filtro.dias));
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar top users");
  }

  const data = await response.json();
  return data?.topUsers ?? [];
}
