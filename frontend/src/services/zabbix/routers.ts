import { getToken } from "../../utils/auth";

/**
 * Severidades por roteador (firewall)
 */
export interface RouterSeveridade {
  name: string;
  high: number;
  average: number;
  warning: number;
  total: number;
}

export interface RoutersSeveridadeResponse {
  total: number;
  routers: RouterSeveridade[];
}

/**
 * Busca Top 5 roteadores (firewalls) por severidade no Zabbix
 */
export async function getZabbixRouters(
  limit: number = 5
): Promise<RoutersSeveridadeResponse> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = `${baseUrl}/api/acesso/zabbix/routers?limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Erro ao consultar roteadores Zabbix:", response.status);
    throw new Error("Erro ao consultar roteadores do Zabbix");
  }

  return response.json();
}
