import { getToken } from "../../utils/auth";

export interface TopUserItem {
  user: string;
  agent_id: string;
  agent_name: string;
  count: number;
}

export async function getTopUsers(
  dias: string | number = "todos"
): Promise<TopUserItem[]> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(
    `${baseUrl}/api/acesso/wazuh/top-users?dias=${dias}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    let msg = "Erro ao buscar top users";
    try {
      const err = await response.json();
      if (err?.error?.message) msg = err.error.message;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();
  const users = data?.topUsers ?? [];

  return users.map((u: any) => ({
    user: String(u.user ?? "Desconhecido"),
    agent_id: String(u.agent_id ?? "-"),
    agent_name: String(u.agent_name ?? "Desconhecido"),
    count: Number(u.count ?? 0),
  }));
}