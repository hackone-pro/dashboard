import { getToken } from "../../utils/auth";

export interface TopHostCPUItem {
  hostid: string;
  name: string;
  cpu: number;
  processes?: number | null;
  ram_used_gb: number | null;
  ram_total_gb: number | null;
}

/**
 * Busca os Top Hosts por uso de CPU no Zabbix
 * Endpoint: /api/acesso/zabbix/top-hosts-cpu
 */
export async function getTopHostsCPU(
  limit: number = 3
): Promise<TopHostCPUItem[]> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = `${baseUrl}/api/acesso/zabbix/top-hosts-cpu?limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error(
      "Erro ao consultar Top Hosts CPU do Zabbix:",
      response.status
    );
    throw new Error("Erro ao consultar Top Hosts CPU do Zabbix");
  }

  const data = await response.json();

  return Array.isArray(data.hosts) ? data.hosts : [];
}
