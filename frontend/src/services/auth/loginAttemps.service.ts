import { getToken } from "../../utils/auth"; // se precisar do token
const API_URL = import.meta.env.VITE_API_URL;

export interface LoginResponse {
  jwt: string;
  user: any;
}

export async function loginAttempt(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/api/auth/login-attempts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Erro ao realizar login");
  }

  return data;
}