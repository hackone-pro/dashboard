import { getToken } from "../../utils/auth";

export type PaisItem = {
  pais: string;
  total: number;
  severidades?: { key: string; doc_count: number }[];
};

export async function getTopPaises(dias: string = "7"): Promise<PaisItem[]> {
  const token = getToken();

  const url = `${import.meta.env.VITE_API_URL}/api/acesso/wazuh/top-paises?dias=${encodeURIComponent(
    dias
  )}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Erro ao buscar top países");
  }

  const json = await res.json();
  const arr = Array.isArray(json?.topPaises) ? json.topPaises : [];
  // Garantia de no máximo 10
  return arr.slice(0, 10);
}