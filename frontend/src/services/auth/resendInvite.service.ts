import { getToken } from "../../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

export async function resendInvite(userId: number) {
  const token = getToken();

  if (!token) {
    throw new Error("Token não encontrado. Faça login novamente.");
  }

  const res = await fetch(`${API_URL}/api/acesso/user/resend/${userId}`, {
    method: "POST", // 👈 importante
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Erro ao reenviar convite.");
  }

  return data;
}
