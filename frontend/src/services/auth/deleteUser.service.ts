import { getToken } from "../../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

export async function deleteUser(userId: number) {
  const token = getToken();
  if (!token) {
    throw new Error("Token não encontrado. Faça login novamente.");
  }

  const res = await fetch(`${API_URL}/api/acesso/user/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  // ✅ se o status HTTP for erro, pega a mensagem do Strapi corretamente
  if (!res.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      "Erro ao excluir usuário.";
    throw new Error(msg);
  }

  return data;
}
