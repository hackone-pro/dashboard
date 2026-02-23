import { getToken } from "../../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

export interface AdminSummaryItem {
  tenantId: number;
  organizacao: string;
  ativos: number;
  risco: number;
  incidentes_critico: number;
  incidentes_alto: number;
  volume_gb: number;
  logs: number;
  snapshot_at?: string | null;
}

export async function getAdminSummary(tenantId?: number): Promise<AdminSummaryItem[]> {
  const token = getToken();

  const queryParams = new URLSearchParams({
    populate: "tenant",
    "filters[period][$eq]": "1",
    sort: "risk:desc",
  });

  if (tenantId) {
    queryParams.append("filters[tenant][id][$eq]", String(tenantId));
  }

  const res = await fetch(
    `${API_URL}/api/tenant-summaries?${queryParams.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      json?.error?.message || "Erro ao buscar tenant summaries"
    );
  }

  const data = json?.data ?? [];

  const filtrado = data.filter(
    (item: any) =>
      item?.tenant &&
      item?.tenant?.id &&
      item?.tenant?.organizacao
  );

  const map = new Map<number, any>();

  for (const item of filtrado) {
    const tId = item.tenant.id;

    if (!map.has(tId)) {
      map.set(tId, item);
    }
  }

  const unicos = Array.from(map.values());

  return unicos.map((item: any) => ({
    tenantId: item.tenant.id,
    organizacao: item.tenant.organizacao,
    ativos: item.ativos ?? 0,
    risco: item.risk ?? 0,
    incidentes_critico: item.critical_inc ?? 0,
    incidentes_alto: item.high_inc ?? 0,
    volume_gb: item.volume_gb ?? 0,
    logs: item.logs_offline ?? 0,
    snapshot_at: item.snapshot_at ?? null,
  }));
}