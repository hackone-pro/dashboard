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

export interface PeriodoFiltro {
  from: string;
  to: string;
}

export async function getRiskLevel(
  dias: string | number = "1",
  periodo?: PeriodoFiltro
): Promise<RiskLevelResposta> {
  const token = getToken();
  const baseUrl = import.meta.env.VITE_API_URL;

  const url = new URL(`${baseUrl}/api/acesso/wazuh/risklevel`);

  // 🔥 REGRA FINAL (IMPORTANTE)
  if (periodo?.from && periodo?.to) {
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
    let msg = "Erro ao buscar RiskLevel";
    try {
      const err = await response.json();
      msg = err.error?.message || msg;
    } catch {}
    throw new Error(msg);
  }

  return response.json();
}
