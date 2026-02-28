import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getToken, setToken, clearToken } from "../utils/auth";

interface AuthContextType {
  token: string | null;
  user: any | null;
  login: (novoToken: string, userData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [user, setUser] = useState<any | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (novoToken: string, userData: any) => {
    setToken(novoToken);
    setTokenState(novoToken);

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUser(null);

    localStorage.removeItem("user");
    localStorage.removeItem("remember_email");

    sessionStorage.removeItem("mfa_token");
    sessionStorage.removeItem("mfa_email");
  };

  // Caso o token mude em outra aba
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "token") {
        setTokenState(event.newValue);
      }
      if (event.key === "user") {
        const newUser = event.newValue;
        setUser(newUser ? JSON.parse(newUser) : null);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
};