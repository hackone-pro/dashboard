import { getToken } from "../../utils/auth";

export interface SeveridadeResponse {
  total: number;
  severity: {
    warning: number;
    high: number;
    disaster: number;
  };
}

export async function getZabbixSeveridade(): Promise<SeveridadeResponse> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = `${baseUrl}/api/acesso/zabbix/severidade`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Erro ao consultar severidade Zabbix:", response.status);
    throw new Error("Erro ao consultar severidade do Zabbix");
  }

  return response.json();
}