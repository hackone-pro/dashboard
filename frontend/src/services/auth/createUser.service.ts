import { getToken } from "../../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

export interface CreateUserPayload {
  nome: string;
  email: string;
  username: string;
  owner_name_iris: string;
}

export interface CreateUserResponse {
  message: string;
  user: any;
}

export async function createUser(
  payload: CreateUserPayload
): Promise<CreateUserResponse> {
  const token = getToken();

  const res = await fetch(`${API_URL}/api/acesso/user/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json().catch(() => ({}));

  // 🔹 Captura a mensagem de erro real do Strapi, independente do formato
  if (!res.ok) {
    const msg =
      json?.message ||
      json?.error?.message ||
      json?.error ||
      "Erro ao criar usuário";
    throw new Error(msg);
  }

  return json;
}
