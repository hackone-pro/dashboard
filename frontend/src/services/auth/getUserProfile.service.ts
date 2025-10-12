import { getToken } from "../../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

export async function getUserProfile() {
  const token = getToken();

  if (!token) {
    throw new Error("Token não encontrado. Faça login novamente.");
  }

  const res = await fetch(`${API_URL}/api/users/me?populate=user_role`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Erro ao buscar dados do usuário");
  }

  return data;
}