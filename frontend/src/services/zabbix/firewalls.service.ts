import { getToken } from "../../utils/auth";

export interface FirewallItem {
  id: string;
  name: string;
  ip: string | null;
  online: boolean;
  availability: string;

  // RAM
  ram_total_bytes: number;
  ram_available_bytes: number;
  ram_used_bytes: number;
  ram_used_percent: number;

  // CPU
  cpu: number | null;

  // Processos / Sessões
  processes: number | null;
  sessions: number | null;

  // TRÁFEGO
  traffic_in_mbps: number | null;
  traffic_out_mbps: number | null;
  traffic_total_mbps: number | null;
}

export async function getZabbixFirewalls(): Promise<FirewallItem[]> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = `${baseUrl}/api/acesso/zabbix/firewalls`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Erro ao consultar Zabbix:", response.status);
    throw new Error("Erro ao consultar Firewalls do Zabbix");
  }

  const data = await response.json();

  return Array.isArray(data.firewalls) ? data.firewalls : [];
}