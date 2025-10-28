import { getToken } from "../../utils/auth";

export interface Tenant {
  id: number;
  cliente_name: string;
}

export interface TenantResponse {
  tenantAtivo: Tenant | null;
  tenantsAcessiveis: Tenant[];
}

/**
 * 🔹 Busca os tenants acessíveis e o tenant ativo do usuário logado
 */
export async function getTenants(): Promise<TenantResponse> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(`${baseUrl}/api/acesso/user/tenants`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let msg = "Erro ao buscar tenants";
    try {
      const err = await response.json();
      msg = err.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return response.json();
}

/**
 * 🔹 Troca o tenant ativo do usuário
 */
export async function changeTenant(id: number): Promise<void> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(`${baseUrl}/api/acesso/user/tenant/${id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let msg = "Erro ao trocar tenant";
    try {
      const err = await response.json();
      msg = err.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }
}
