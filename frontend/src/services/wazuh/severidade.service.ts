// src/services/wazuh/severidade.service.ts
import { getToken } from "../../utils/auth";

export interface Severidade {
  critico: number;
  alto: number;
  medio: number;
  baixo: number;
  total: number;
}

export async function getSeveridadeWazuh(
  dias: string | number = "1",
  periodo?: { from: string; to: string }
): Promise<Severidade> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = new URL(`${baseUrl}/api/acesso/wazuh/severidade`);

  if (periodo) {
    url.searchParams.set("from", periodo.from);
    url.searchParams.set("to", periodo.to);
  } else {
    url.searchParams.set("dias", String(dias));
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar dados de severidade");
  }

  const data = await response.json();

  return {
    critico: data.severidade?.critico || 0,
    alto: data.severidade?.alto || 0,
    medio: data.severidade?.medio || 0,
    baixo: data.severidade?.baixo || 0,
    total: data.severidade?.total || 0,
  };
}
