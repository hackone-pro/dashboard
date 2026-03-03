import { getToken } from "../../utils/auth";

export type SwitchStatusItem = {
  hostid: string;
  name: string;
  status: "online" | "offline";
};

export interface SwitchesStatusResponse {
  total: number;
  online: number;
  offline: number;
  switches: SwitchStatusItem[];
}

export async function getZabbixSwitchesStatus(): Promise<SwitchesStatusResponse> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = `${baseUrl}/api/acesso/zabbix/switches/status`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Erro ao consultar switches status:", response.status);
    throw new Error("Erro ao consultar status dos switches no Zabbix");
  }

  return response.json();
}