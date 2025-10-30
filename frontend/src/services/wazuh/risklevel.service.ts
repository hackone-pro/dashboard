// src/services/wazuh/risklevel.service.ts
import { getToken } from "../../utils/auth";

export interface Severidades {
  baixo: number;
  medio: number;
  alto: number;
  critico: number;
  total: number;
}

export interface RiskLevelResposta {
  severidades: Severidades;
  indiceRisco: number;
}

export async function getRiskLevel(dias: string | number = "1"): Promise<RiskLevelResposta> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const response = await fetch(`${baseUrl}/api/acesso/wazuh/risklevel?dias=${dias}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let msg = "Erro ao buscar RiskLevel";
    try {
      const err = await response.json();
      msg = err.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return response.json();
}
