// src/services/wazuh/topfirewall.service.ts
import { getToken } from "../../utils/auth";

export interface TopFirewallItem {
  gerador: string;
  ip: string | null;
  timestamp: string | null;
  total: number;
  severidade: {
    baixo: number;
    medio: number;
    alto: number;
    critico: number;
  };
}

/**
 * Busca os top firewalls (geradores) com breakdown por severidade.
 *
 * Regras:
 * - Se periodo (from/to) existir → ignora dias
 * - Caso contrário → usa dias
 */
export async function getTopFirewalls(
  dias: string = "7",
  periodo?: { from: string; to: string }
): Promise<TopFirewallItem[]> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = new URL(`${baseUrl}/api/acesso/wazuh/top-geradores`);

  // 🔹 PRIORIDADE TOTAL: calendário
  if (periodo?.from && periodo?.to) {
    url.searchParams.set("from", periodo.from);
    url.searchParams.set("to", periodo.to);
  } else if (dias) {
    url.searchParams.set("dias", dias);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let msg = "Erro ao buscar top firewalls";
    try {
      const err = await response.json();
      if (err?.error?.message) msg = err.error.message;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();
  const lista: any[] = Array.isArray(data?.topGeradores)
    ? data.topGeradores
    : [];

  // 🔹 normalização + tipagem explícita
  const normalizado: TopFirewallItem[] = lista
    .map((item: any): TopFirewallItem => ({
      gerador: String(item?.gerador ?? item?.key ?? ""),
      ip: item?.ip ? String(item.ip) : null,
      timestamp: item?.timestamp ? String(item.timestamp) : null,
      total: Number(item?.total ?? item?.doc_count ?? 0),
      severidade: {
        baixo: Number(item?.severidade?.baixo ?? 0),
        medio: Number(item?.severidade?.medio ?? 0),
        alto: Number(item?.severidade?.alto ?? 0),
        critico: Number(item?.severidade?.critico ?? 0),
      },
    }))
    .sort(
      (a: TopFirewallItem, b: TopFirewallItem) => b.total - a.total
    )
    .slice(0, 10);

  return normalizado;
}