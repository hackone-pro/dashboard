import { getToken } from "../../utils/auth";

export interface RuleDistribution {
  labels: string[];
  values: number[];
}

export async function getRuleDistribution(opts?: {
  from?: string;
  to?: string;
  dias?: number;
}): Promise<RuleDistribution> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = new URL(`${baseUrl}/api/acesso/wazuh/rule-distribution`);

  if (opts?.from && opts?.to) {
    url.searchParams.set("from", opts.from);
    url.searchParams.set("to", opts.to);
  } else if (opts?.dias) {
    url.searchParams.set("dias", String(opts.dias));
  }

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let msg = "Erro ao buscar rule distribution";
    try {
      const err = await response.json();
      if (err?.error?.message) msg = err.error.message;
    } catch {}
    throw new Error(msg);
  }

  const data = await response.json();
  const rules = data?.rules ?? [];

  return {
    labels: rules.map((r: any) => r.rule ?? "Desconhecido"),
    values: rules.map((r: any) => Number(r.count ?? 0)),
  };
}