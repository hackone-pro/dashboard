import axios from "axios";
import { getToken } from "../../utils/auth";

// 🔹 Tipos de dados conforme retorno do backend
export type ReportTotals = {
  sent: string;
  rcvd: string;
  total: string;
};

export type ReportTopUrl = [string, number];
export type ReportTopApp = [string, number];
export type ReportTopCat = [string, number];

export type ReportUser = {
  user: string;
  logs: number;
};

export type ReportIp = {
  ip: string;
  fmt: string;
};

export type ReportTabelaResumo = {
  "#": number;
  application: string;
  category: string;
  user: string;
  total_bytes: string;
};

// 🔹 Estrutura principal conforme o JSON retornado pelo backend
export type ReportData = {
  period: string;
  totals: ReportTotals;
  topUrls: ReportTopUrl[];
  topUsers?: ReportUser[];
  topIps?: ReportIp[];
  topApps?: ReportTopApp[]; // ✅ agora incluído
  topCats?: ReportTopCat[];
  tabelaResumo?: ReportTabelaResumo[];
};

// 🔹 URL base da API Strapi
const API_URL = import.meta.env.VITE_API_URL;

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
  try {
    const token = getToken();
    const response = await axios.get<any>(
      `${API_URL}/api/acesso/report/data/${cliente}?period=${period}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return normalizarResposta(response.data);
  } catch (err: any) {
    console.error("❌ Erro ao buscar relatório:", err.response?.data || err.message);
    throw err;
  }
}

// 🔹 Gerar relatório (POST /api/acesso/report)
export async function postReportData(
  cliente: string,
  period: string
): Promise<boolean> {
  try {
    const token = getToken();
    const response = await axios.post<any>(
      `${API_URL}/api/acesso/report`,
      {
        customer: cliente,
        period: Number(period),
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.status === 200 || response.status === 201;
  } catch (err: any) {
    console.error("❌ Erro ao gerar relatório:", err.response?.data || err.message);
    return false;
  }
}
