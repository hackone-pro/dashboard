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
    } catch { }
    throw new Error(msg);
  }

  const json = await response.json();
  return json.data;
}

export async function listarRelatorios() {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(`${baseUrl}/api/report-entries`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao carregar relatórios");
  }

  const data = await response.json();
  return data.data || [];
}

export async function buscarRelatorioPorNome(nome: string) {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  // ← rota search que retorna snapshot completo com JSON já parseado
  const url = `${baseUrl}/api/report-entries/search?nome=${encodeURIComponent(nome)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar relatório");
  }

  const json = await response.json();

  if (!json?.data) {
    console.warn("⚠️ Nenhum relatório encontrado.");
    return null;
  }

  return json.data;
}

export async function deletarRelatorio(id: number) {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(`${baseUrl}/api/report-entries/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao deletar relatório");
  }

  return true;
}