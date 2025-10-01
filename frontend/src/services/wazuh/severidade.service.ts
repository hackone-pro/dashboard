// src/services/wazuh/severidade.service.ts
import { getToken } from "../../utils/auth";

export interface Severidade {
  critico: number;
  alto: number;
  medio: number;
  baixo: number;
  total: number;
}

export async function getSeveridadeWazuh(dias: string | number = "1"): Promise<Severidade> {
  const token = getToken();

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/acesso/wazuh/severidade?dias=${dias}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao buscar dados de severidade");
  }

  const data = await response.json();

  // ✅ Backend já devolve no formato certo
  return {
    critico: data.severidade?.critico || 0,
    alto: data.severidade?.alto || 0,
    medio: data.severidade?.medio || 0,
    baixo: data.severidade?.baixo || 0,
    total: data.severidade?.total || 0,
  };
}
