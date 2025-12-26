// src/services/auth/login-attempts.service.ts

const API_URL = import.meta.env.VITE_API_URL;

export type LoginResponse =
  | {
      mfaRequired: true;
      mfaToken: string;
    }
  | {
      jwt: string;
      user: any;
    };

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
