// src/utils/auth.ts

const TOKEN_KEY = "token";
const USER_KEY = "user";

// 🔹 Salva o token JWT
export function setToken(jwt: string): void {
  localStorage.setItem(TOKEN_KEY, jwt);
}

// 🔹 Lê o token JWT
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// 🔹 Remove o token e dados de usuário
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// 🔹 Retorna se está autenticado
export function isAuthenticated(): boolean {
  return !!localStorage.getItem(TOKEN_KEY);
}

// 🔹 (Alias opcionais, caso outras partes do app usem)
export const login = (jwt: string) => setToken(jwt);
export const logout = () => clearToken();
