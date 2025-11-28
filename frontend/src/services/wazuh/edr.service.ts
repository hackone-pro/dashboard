import { getToken } from "../../utils/auth";

export interface EdrItem {
  deviceName: string;
  timestamp: string;
}

export async function getEdrList(): Promise<EdrItem[]> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = `${baseUrl}/api/acesso/wazuh/edr`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error("Erro ao buscar eventos EDR");

  const data = await response.json();

  // Garante consistência
  return Array.isArray(data.edr) ? data.edr : [];
}
