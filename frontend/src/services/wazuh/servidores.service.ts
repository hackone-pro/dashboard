import { getToken } from "../../utils/auth";

export interface ServidorItem {
  id: string;
  nome: string;
  ip: string | null;
  timestamp: string | null;
}

export async function getServidoresList(): Promise<ServidorItem[]> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = `${baseUrl}/api/acesso/wazuh/servidores`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Erro ao buscar servidores");

  const data = await response.json();
  return Array.isArray(data.servidores) ? data.servidores : [];
}