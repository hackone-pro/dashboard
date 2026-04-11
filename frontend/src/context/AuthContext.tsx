import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getToken, setToken, clearToken } from "../utils/auth";

export interface JwtTenant {
  id: number;
  uid: string;
  plan: "essentials" | "full";
}

interface AuthContextType {
  token: string | null;
  user: any | null;
  jwtTenants: JwtTenant[];
  login: (novoToken: string, userData: any) => void;
  logout: () => void;
}

function decodeJwtTenants(token: string | null): JwtTenant[] {
  if (!token) return [];
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Array.isArray(payload.tenants) ? payload.tenants : [];
  } catch {
    return [];
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [user, setUser] = useState<any | null>(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [jwtTenants, setJwtTenants] = useState<JwtTenant[]>(() => decodeJwtTenants(getToken()));

  const login = (novoToken: string, userData: any) => {
    setToken(novoToken);
    setTokenState(novoToken);
    setJwtTenants(decodeJwtTenants(novoToken));

    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUser(null);
    setJwtTenants([]);

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
        setJwtTenants(decodeJwtTenants(event.newValue));
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
    <AuthContext.Provider value={{ token, user, jwtTenants, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
};
