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
  return json.data; // ← Strapi retorna { data: { ...objetoDoRelatorio } }
}

export async function listarRelatorios() {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(`${baseUrl}/api/report-entries?sort=createdAt:desc`, {
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

  const url = `${baseUrl}/api/report-entries?filters[nome][$eq]=${nome}&populate=*`;

  // console.log("🌐 URL chamada:", url);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = await response.json();

  // console.log("🔍 JSON bruto vindo da API:");
  // console.log(JSON.stringify(json, null, 2));

  if (!json?.data?.length) {
    console.warn("⚠️ Nenhum relatório encontrado.");
    return null;
  }

  const item = json.data[0];

  // console.log("📦 Item retornado:", item);

  // SEU STRAPI NÃO USA ATTRIBUTES → retorna direto
  return item;
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
