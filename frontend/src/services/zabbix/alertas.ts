import { getToken } from "../../utils/auth";

export type AlertaZabbixItem = {
  eventid: string;
  horario: string;   // ex: "09:42"
  host: string;      // ex: "FW-CORE-01"
  problema: string;  // descrição do alerta
  severidade: "critico" | "alto" | "medio" | "baixo" | "info";
  duracao: string;   // ex: "17 min", "1h 12 min"
};

export interface AlertasZabbixResponse {
  total: number;
  alertas: AlertaZabbixItem[];
}

/**
 * Busca alertas ativos do Zabbix
 */
export async function getZabbixAlertas(
  limit = 10
): Promise<AlertasZabbixResponse> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = `${baseUrl}/api/acesso/zabbix/alertas?limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error(
      "Erro ao consultar alertas Zabbix:",
      response.status
    );
    throw new Error("Erro ao consultar alertas do Zabbix");
  }

  return response.json();
}
