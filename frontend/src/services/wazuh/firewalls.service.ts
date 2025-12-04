import { getToken } from "../../utils/auth";

export interface FirewallInventarioItem {
  id: string;
  nome: string;
  location: string | null;
}

/**
 * Busca a lista completa de firewalls do tenant.
 */
export async function getFirewallsList(): Promise<FirewallInventarioItem[]> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = `${baseUrl}/api/acesso/wazuh/firewalls`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let msg = "Erro ao buscar lista de firewalls";
    try {
      const err = await response.json();
      if (err?.error?.message) msg = err.error.message;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();
  const lista = Array.isArray(data?.firewalls) ? data.firewalls : [];

  // Normaliza os campos recebidos
  const normalizado = lista.map((item: any) => ({
    id: String(item?.id ?? ""),
    nome: String(item?.nome ?? ""),
    location: item?.location ?? null,
  }));

  return normalizado;
}