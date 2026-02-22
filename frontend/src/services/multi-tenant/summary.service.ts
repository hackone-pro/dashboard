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
    `${API_URL}/api/tenant-summaries?populate=tenant&filters[period][$eq]=1&sort=risk:desc`,
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

  // 🔥 FILTRA TENANTS NULOS OU SEM ORGANIZAÇÃO
  const filtrado = data.filter(
    (item: any) =>
      item.tenant &&
      item.tenant.organizacao &&
      item.risk !== null
  );

  return filtrado.map((item: any) => ({
    tenantId: item.tenant.id,
    organizacao: item.tenant.organizacao,
    ativos: 0, // se quiser buscar depois
    risco: item.risk ?? 0,
    incidentes_critico: item.critical_inc ?? 0,
    incidentes_alto: item.high_inc ?? 0,
    volume_gb: item.volume_gb ?? 0,
    logs: item.logs_offline ?? 0,
  }));
}