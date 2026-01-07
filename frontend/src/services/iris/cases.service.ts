import axios from "axios";

// Tipo de incidente conforme retorno da API IRIS
export type Incidente = {
  case_id: number;
  case_name: string;
  case_description: string;
  case_open_date: string;
  classification_id: number | null;
  classification: string | null;
  opened_by: string;
  client_name: string;

  // 👇 adicionados (existem no payload real)
  owner?: string;
  state_name?: string;        // "Open" | "Resolved" | "Assigned" | ...
  case_close_date?: string;   // pode vir vazio
  case_uuid?: string;
  case_soc_id?: string;
};

const API_URL = import.meta.env.VITE_API_URL; // Ex: http://localhost:1337

// 🔹 Função auxiliar para normalizar o retorno
function normalizarResposta(res: any): Incidente[] {
  if (Array.isArray(res)) {
    return res as Incidente[];
  }
  if (res && Array.isArray(res.data)) {
    return res.data as Incidente[];
  }
  return [];
}

export async function getTodosCasos(
  token: string,
  payload?: { from?: string; to?: string }
): Promise<Incidente[]> {

  const params: any = {};
  if (payload?.from) params.from = payload.from;
  if (payload?.to) params.to = payload.to;

  const response = await axios.get<any>(
    `${API_URL}/api/acesso/iris/manage/cases/list`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params,
    }
  );

  return normalizarResposta(response.data);
}

export async function getCasosRecentes(range: string, token: string): Promise<Incidente[]> {
  const response = await axios.get<any>(
    `${API_URL}/api/acesso/iris/manage/cases/recent?range=${range}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return normalizarResposta(response.data);
}
