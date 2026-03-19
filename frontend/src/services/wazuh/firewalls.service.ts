import { getToken } from "../../utils/auth";

export interface FirewallInventarioItem {
  id: string;
  nome: string;
  location: string | null;
  timestamp: string | null;
  ativo: boolean;
  logsRecentes: number;
}

export async function getFirewallsList(): Promise<FirewallInventarioItem[]> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(`${baseUrl}/api/acesso/wazuh/firewalls`, {
    headers: { Authorization: `Bearer ${token}` },
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

  return lista.map((item: any) => ({
    id: String(item?.id ?? ""),
    nome: String(item?.nome ?? ""),
    location: item?.location ?? null,
    timestamp: item?.timestamp ?? null,
    ativo: item?.ativo ?? false,
    logsRecentes: item?.logsRecentes ?? 0,
  }));
}

// Calcula tempo desde o último log sempre pelo timestamp real
export function formatarTempoInativo(timestamp: string | null): string {
  if (!timestamp) return "Sem logs registrados";

  const minutos = Math.floor(
    (Date.now() - new Date(timestamp).getTime()) / 60000
  );

  if (minutos < 1)    return "Agora mesmo";
  if (minutos < 60)   return `Inativo há ${minutos} min`;
  if (minutos < 1440) return `Inativo há ${Math.floor(minutos / 60)}h`;
  return `Inativo há ${Math.floor(minutos / 1440)} dia(s)`;
}