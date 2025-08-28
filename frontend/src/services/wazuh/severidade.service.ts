// src/services/wazuh/severidade.service.ts
import { getToken } from "../../utils/auth";

export async function getSeveridadeWazuh() {
  const token = getToken();

  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/acesso/wazuh/severidade`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar dados de severidade");
  }

  const data = await response.json();

  // Transformar o retorno em formato direto
  const resultado = {
    baixo: 0,
    medio: 0,
    alto: 0,
    critico: 0,
    total: 0,
  };

  for (const item of data.severidade) {
    switch (item.key) {
      case "Low":
        resultado.baixo = item.doc_count;
        break;
      case "Medium":
        resultado.medio = item.doc_count;
        break;
      case "High":
        resultado.alto = item.doc_count;
        break;
      case "Critical":
        resultado.critico = item.doc_count;
        break;
    }
  }

  resultado.total = resultado.baixo + resultado.medio + resultado.alto + resultado.critico;

  return resultado;
}