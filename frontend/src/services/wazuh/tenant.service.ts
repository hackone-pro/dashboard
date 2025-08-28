// src/services/wazuh/tenant.service.ts
import { getToken } from "../../utils/auth";

export async function getTenant() {
  const token = getToken();

  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/acesso/wazuh/tenant`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar dados do tenant");
  }

  const data = await response.json();

  return data; // Ex: { id, owner_name, ativa, ... }
}