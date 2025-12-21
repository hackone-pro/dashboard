import { getToken } from "../../utils/auth";

/**
 * Tipos de VPN vindos do Zabbix
 */
export interface ZabbixVpnItem {
  nome: string;
  firewall: string;
  status: "up" | "down";
}

export interface ZabbixVpnResponse {
  total: number;
  vpns: ZabbixVpnItem[];
}

/**
 * Busca VPNs monitoradas no Zabbix (status dos túneis)
 */
export async function getZabbixVpn(): Promise<ZabbixVpnResponse> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = `${baseUrl}/api/acesso/zabbix/vpn`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Erro ao consultar VPNs do Zabbix:", response.status);
    throw new Error("Erro ao consultar VPNs do Zabbix");
  }

  return response.json();
}
