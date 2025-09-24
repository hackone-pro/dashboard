import { getToken } from "../../utils/auth";

export interface OvertimeEventos {
  labels: string[];
  datasets: { name: string; data: number[] }[];
}

export async function getOvertimeEventos(
    dias: string | number = "todos" // 👈 parâmetro opcional
  ): Promise<OvertimeEventos> {
    const token = getToken();
    const baseUrl = import.meta.env.VITE_API_URL;
  
    const response = await fetch(
      `${baseUrl}/api/acesso/wazuh/overtime?dias=${dias}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  
    if (!response.ok) {
      let msg = "Erro ao buscar eventos overtime";
      try {
        const err = await response.json();
        if (err?.error?.message) msg = err.error.message;
      } catch {}
      throw new Error(msg);
    }
  
    const data = await response.json();
    const overtime = data?.overtime ?? { labels: [], datasets: [] };
  
    return {
      labels: Array.isArray(overtime.labels) ? overtime.labels : [],
      datasets: Array.isArray(overtime.datasets) ? overtime.datasets : [],
    };
  }
  
