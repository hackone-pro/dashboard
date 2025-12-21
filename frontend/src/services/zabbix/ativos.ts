import { getToken } from "../../utils/auth";

/**
 * Tipos do retorno de ativos do Zabbix
 */
export interface ZabbixGrupoAtivo {
  groupid: string;
  name: string;
  total: number;
}

export interface ZabbixAtivosResponse {
  total: number;
  grupos: ZabbixGrupoAtivo[];
}

/**
 * Busca ativos monitorados no Zabbix (por host group)
 */
export async function getZabbixAtivos(): Promise<ZabbixAtivosResponse> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = `${baseUrl}/api/acesso/zabbix/ativos`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Erro ao consultar ativos Zabbix:", response.status);
    throw new Error("Erro ao consultar ativos do Zabbix");
  }

  return response.json();
}
