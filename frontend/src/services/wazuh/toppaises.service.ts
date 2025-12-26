import { getToken } from "../../utils/auth";

export type PaisItem = {
  pais: string;
  total: number;
  severidades?: { key: string; doc_count: number }[];
};

export type LiveAttackItem = {
  tecnica?: string;
  origem: {
    pais: string;
    city?: string;
  };
  destino: {
    pais: string;
    city?: string;
    devname?: string;
  };
};

export async function getTopPaises(dias: string = "30"): Promise<PaisItem[]> {
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

export async function getTopPaisesGeo(dias: string = "todos"): Promise<LiveAttackItem[]> {
  const token = getToken();

  const url = `${import.meta.env.VITE_API_URL}/api/acesso/wazuh/top-paises-geo?dias=${encodeURIComponent(
    dias
  )}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Erro ao buscar ataques geográficos");
  }

  const json = await res.json();

  return Array.isArray(json?.flows) ? json.flows : [];
}

export async function getTopPaisesGeoRange(
  range: string = "30s"
): Promise<LiveAttackItem[]> {
  const token = getToken();

  const url = `${import.meta.env.VITE_API_URL}/api/acesso/wazuh/top-paises-geo?range=${encodeURIComponent(
    range
  )}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error("Erro ao buscar ataques geográficos (range)");
  }

  const json = await res.json();
  return Array.isArray(json?.flows) ? json.flows : [];
}
