import { getToken } from "../../utils/auth";

export async function getZabbixAtivo(): Promise<{ enabled: boolean }> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(
    `${baseUrl}/api/acesso/zabbix-config/ativo`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao validar Zabbix");
  }

  return response.json();
}
