import { getToken } from "../../utils/auth";

export type TopSwitchCPUItem = {
  hostid: string;
  name: string;
  cpu: number;
  severity: "critico" | "alto" | "medio" | "baixo";
};

export async function getTopSwitchesCPU(
  limit = 5
): Promise<TopSwitchCPUItem[]> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const res = await fetch(
    `${baseUrl}/api/acesso/zabbix/top-switches-cpu?limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Erro ao buscar Top Switches CPU");
  }

  const data = await res.json();
  return Array.isArray(data.switches) ? data.switches : [];
}