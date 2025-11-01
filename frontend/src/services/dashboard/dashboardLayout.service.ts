import { getToken } from "../../utils/auth";

/**
 * 🔹 Tipagem do layout
 * Baseada no formato do react-grid-layout
 */
export interface WidgetLayout {
  i: string; // ID do widget (ex: grafico_risco)
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 🔹 Resposta vinda da API
 */
export interface DashboardLayoutResponse {
  id: number;
  layout: WidgetLayout[];
  is_default: boolean;
}

/**
 * 🔹 Busca o layout do usuário logado (ou o padrão global)
 */
export async function getDashboardLayout(): Promise<DashboardLayoutResponse> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(`${baseUrl}/api/custom-dashboards/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let msg = "Erro ao buscar layout da dashboard";
    try {
      const err = await response.json();
      msg = err.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return response.json();
}

/**
 * 🔹 Salva ou atualiza o layout do usuário logado
 */
export async function saveDashboardLayout(
  layout: WidgetLayout[]
): Promise<DashboardLayoutResponse> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(`${baseUrl}/api/custom-dashboards/me`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ layout }),
  });

  if (!response.ok) {
    let msg = "Erro ao salvar layout da dashboard";
    try {
      const err = await response.json();
      msg = err.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return response.json();
}

/**
 * 🔹 Restaura o layout padrão global
 */
export async function resetDashboardLayout(): Promise<DashboardLayoutResponse> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(`${baseUrl}/api/custom-dashboards/reset`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    let msg = "Erro ao restaurar layout padrão";
    try {
      const err = await response.json();
      msg = err.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return response.json();
}
