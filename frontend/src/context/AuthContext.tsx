import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getToken, setToken, clearToken } from "../utils/auth";

interface AuthContextType {
  token: string | null;
  login: (novoToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());

  const login = (novoToken: string) => {
    setToken(novoToken);
    setTokenState(novoToken);
  };

  const logout = () => {
    clearToken();          // remove token do localStorage
    setTokenState(null);   // limpa estado React
  
    // limpar dados adicionais
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
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
};
