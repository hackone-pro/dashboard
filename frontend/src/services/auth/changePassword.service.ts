// src/services/auth/changePassword.service.ts
import { getToken } from "../../utils/auth";

export async function changePassword(currentPassword: string, password: string, passwordConfirmation: string) {
  const token = getToken();

  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, password, passwordConfirmation }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error?.message || "Erro ao alterar senha");
  }

  return data; // normalmente vem { jwt, user } ou {} dependendo da versão do Strapi
}
