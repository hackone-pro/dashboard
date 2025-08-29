import { getToken } from "../../utils/auth";

export type CountrySeverityItem = {
  name: string;
  count: number;
  severidades: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
};

function normKey(k: string): "low" | "medium" | "high" | "critical" | null {
  const s = (k || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  // aceita PT e EN, com e sem acento
  if (s === "baixo" || s === "low") return "low";
  if (s === "medio" || s === "media" || s === "medium") return "medium";
  if (s === "alto" || s === "high") return "high";
  if (s === "critico" || s === "critica" || s === "critical") return "critical";
  return null;
}

export async function getTopCountriesWithSeverity(
  dias: string = "todos",
  size: number = 5
): Promise<CountrySeverityItem[]> {
  const token = getToken();
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/api/acesso/wazuh/top-paises?dias=${dias}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error("Erro ao buscar países com severidade");

  const json = await res.json();

  // aceita estrutura PT do seu backend:
  // { topPaises: [{ pais, total, severidades: [{ key, doc_count }, ...] }, ...] }
  const buckets: any[] =
    json?.topPaises ??
    json?.aggregations?.top_countries?.buckets ??
    json?.buckets ??
    [];

  const items = buckets.map((b: any) => {
    const sevBuckets: any[] = b?.severidades ?? b?.severidade?.buckets ?? [];
    let low = 0, medium = 0, high = 0, critical = 0;

    for (const sb of sevBuckets) {
      const nk = normKey(String(sb?.key ?? ""));
      const cnt = Number(sb?.doc_count ?? sb?.count ?? 0);
      if (nk === "low") low += cnt;
      else if (nk === "medium") medium += cnt;
      else if (nk === "high") high += cnt;
      else if (nk === "critical") critical += cnt;
    }

    return {
      name: b?.pais ?? b?.key ?? b?.country ?? "—",
      count: Number(b?.total ?? b?.doc_count ?? 0),
      severidades: { low, medium, high, critical },
    };
  });

  return items.slice(0, size);
}