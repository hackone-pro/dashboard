// src/utils/auth.ts

export const login = (jwt: string) => {
  localStorage.setItem('token', jwt)
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}

export const getToken = (): string | null => {
  return localStorage.getItem('token');
};
