import { getToken } from "../../utils/auth";
import { toastSuccess, toastError } from "../../utils/toast";

export interface ReportEntry {
  id: number;
  tenant: string;
  period: string;
  sections: string[];
  progress: string;
  snapshot: any;
  createdAt: string;
  updatedAt: string;
}

export async function gerarRelatorio(
  period: string,
  sections: string[]
): Promise<ReportEntry> {

  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(`${baseUrl}/api/report-entry/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ period, sections }),
  });

  if (!response.ok) {
    let msg = "Erro ao gerar relatório";
    try {
      const err = await response.json();
      if (err?.error?.message) msg = err.error.message;
    } catch {}
    throw new Error(msg);
  }

  const json = await response.json();
  return json.data; // ← Strapi retorna { data: { ...objetoDoRelatorio } }
}
