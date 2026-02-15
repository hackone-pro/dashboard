import { getToken } from "../../utils/auth";

export interface RouterCPU {
  name: string;
  cpu_percent: number;
  severidade: "baixo" | "medio" | "alto" | "critico";
}

export interface RoutersCPUResponse {
  total: number;
  routers: RouterCPU[];
}

export async function getZabbixRouters(
  limit: number = 5
): Promise<RoutersCPUResponse> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = `${baseUrl}/api/acesso/zabbix/routers?limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao consultar roteadores CPU");
  }

  return response.json();
}
