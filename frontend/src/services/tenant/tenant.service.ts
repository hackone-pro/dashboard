// src/services/tenant/tenant.service.ts
import axios from "axios";
import { getToken } from "../../utils/auth";

export interface Tenant {
  id: number;
  cliente_name: string;
}

export interface TenantResponse {
  tenantAtivo: Tenant | null;
  tenantsAcessiveis: Tenant[];
}

const API_URL = import.meta.env.VITE_API_URL;

/**
 * 🔹 Busca os tenants acessíveis e o tenant ativo do usuário logado
 */
export async function getTenants(): Promise<TenantResponse> {
  const token = getToken();

  try {
    const response = await axios.get<TenantResponse>(
      `${API_URL}/api/acesso/user/tenants`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    const msg =
      error?.response?.data?.error?.message || "Erro ao buscar tenants";
    console.error("Erro ao buscar tenants:", msg);
    throw new Error(msg);
  }
}

/**
 * 🔹 Troca o tenant ativo do usuário
 */
export async function changeTenant(id: number): Promise<void> {
  const token = getToken();

  try {
    await axios.patch(
      `${API_URL}/api/acesso/user/tenant/${id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (error: any) {
    const msg =
      error?.response?.data?.error?.message || "Erro ao trocar tenant";
    console.error("Erro ao trocar tenant:", msg);
    throw new Error(msg);
  }
}
