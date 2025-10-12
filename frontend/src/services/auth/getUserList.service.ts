import { getToken } from "../../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

export async function getUserList() {
  const token = getToken();

  if (!token) {
    throw new Error("Token não encontrado. Faça login novamente.");
  }

  const res = await fetch(`${API_URL}/api/acesso/user/list`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Erro ao buscar lista de usuários.");
  }

  // Garante retorno sempre em formato de array
  return data?.usuarios || [];
}
