import axios from "axios";

// 🔹 Tipos de dados conforme retorno do backend
export type ReportTotals = {
  sent: string;
  rcvd: string;
  total: string;
};

export type ReportTopUrl = [string, number];

export type ReportData = {
  period: string;
  totals: ReportTotals;
  topUrls: ReportTopUrl[];
  topUsers?: { user: string; logs: number }[];
  topIps?: { ip: string; fmt: string }[];
  tabelaResumo?: any[];
};

// 🔹 URL base da API Strapi
const API_URL = import.meta.env.VITE_API_URL; // Ex: http://localhost:1337

// 🔹 Função auxiliar para normalizar o retorno
function normalizarResposta(res: any): ReportData | null {
  if (res && typeof res === "object" && res.data) {
    return res.data as ReportData;
  }
  if (res && typeof res === "object" && res.period) {
    return res as ReportData;
  }
  return null;
}

// 🔹 Buscar relatório completo (GET /api/acesso/report/data/:cliente?period=X)
export async function getReportData(
  cliente: string,
  period: string
): Promise<ReportData | null> {
  const response = await axios.get<any>(
    `${API_URL}/api/acesso/report/data/${cliente}?period=${period}`
  );

  return normalizarResposta(response.data);
}

// 🔹 Gerar relatório (POST /api/acesso/report)
export async function postReportData(
  cliente: string,
  period: string
): Promise<boolean> {
  const response = await axios.post<any>(
    `${API_URL}/api/acesso/report`,
    {
      customer: cliente,
      period: Number(period),
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.status === 200 || response.status === 201;
}
