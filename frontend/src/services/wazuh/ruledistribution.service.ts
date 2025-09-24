import { getToken } from "../../utils/auth";

export interface RuleDistribution {
  labels: string[];
  values: number[];
}

export async function getRuleDistribution(
  dias: string | number = "todos"
): Promise<RuleDistribution> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(
    `${baseUrl}/api/acesso/wazuh/rule-distribution?dias=${dias}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

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