import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export type UpdateCasePayload = {
  caseId: number;
  status?: "open" | "closed";
  severity?: number;
  outcome?: string;
  owner?: string;
  notas?: string;
  descricaoAtual?: string;
};

export async function updateCasoIris(
  token: string,
  payload: UpdateCasePayload
) {

  const response = await axios.post(
    `${API_URL}/api/acesso/iris/manage/cases/update`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
}