import { getToken } from "../../utils/auth";

const API_URL = import.meta.env.VITE_API_URL;

export interface CreateUserPayload {
  nome: string;
  email: string;
  username: string;
  password: string;
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

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Erro ao criar usuário.");
  }

  return data;
}
