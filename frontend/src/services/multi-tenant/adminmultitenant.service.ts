import { getToken } from "../../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

export interface AdminTenant {
  tenantId: number;
  organizacao: string;
  role: string;
}

export async function getAdminTenants(): Promise<AdminTenant[]> {
  const token = getToken();

  const res = await fetch(`${API_URL}/api/admin/multitenant/tenants`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Erro ao buscar tenants admin");
  }

  return data;
}