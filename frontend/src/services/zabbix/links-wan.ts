import { getToken } from "../../utils/auth";

export interface LinkWanItem {
  firewall: string;
  link: string;
  trafego_mbps: number;
  capacidade_mbps: number;
  uso_percentual: number;

  ram_total_bytes: number;
  ram_available_bytes: number;
  ram_used_bytes: number;
  ram_used_percent: number;

  severidade: "baixo" | "medio" | "alto" | "critico";
}

export interface LinksWanResponse {
  total: number;
  links: LinkWanItem[];
}

export async function getZabbixLinksWan(): Promise<LinksWanResponse> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(
    `${baseUrl}/api/acesso/zabbix/links-wan`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    console.error("Erro ao buscar links WAN:", response.status);
    throw new Error("Erro ao buscar links WAN");
  }

  return response.json();
}
