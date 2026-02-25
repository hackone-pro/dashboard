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
}

export async function getAdminSummary(): Promise<AdminSummaryItem[]> {
  const token = getToken();

  const res = await fetch(
    `${API_URL}/api/admin/multitenant/summary`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Erro ao buscar summary");
  }

  return data.map((item: any) => ({
    tenantId: item.tenantId,
    organizacao: item.organizacao,
    ativos: item.summary?.ativos ?? 0,
    risco: item.summary?.risk ?? 0,
    incidentes_critico: item.summary?.critical_inc ?? 0,
    incidentes_alto: item.summary?.high_inc ?? 0,
    volume_gb: item.summary?.volume_gb ?? 0,
    logs: item.summary?.firewalls_offline ?? 0,
  }));
}