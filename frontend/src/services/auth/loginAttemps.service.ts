const API_URL = import.meta.env.VITE_API_URL;

export interface LoginResponse {
  jwt: string;
  user: any;
}

export interface MfaResponse {
  mfaRequired: true;
  mfaToken: string;
}

export type LoginApiResponse = LoginResponse | MfaResponse;

export async function loginAttempt(
  email: string,
  password: string,
  captchaToken?: string
): Promise<LoginApiResponse> {

  const res = await fetch(`${API_URL}/api/auth/login-attempts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, captchaToken }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Erro ao realizar login");
  }

  return data;
}