import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getTenants, changeTenant, Tenant } from "../services/tenant/tenant.service";
import { useAuth } from "./AuthContext";

interface TenantContextType {
  tenantAtivo: Tenant | null;
  tenants: Tenant[];
  loading: boolean;
  trocarTenant: (id: number) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenantAtivo, setTenantAtivo] = useState<Tenant | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const { token } = useAuth();

  useEffect(() => {
    const carregarTenants = async () => {
      if (!token) {
        // se deslogou, limpa tudo
        setTenants([]);
        setTenantAtivo(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await getTenants();
        const lista = data.tenantsAcessiveis || [];
        const ativo = data.tenantAtivo || lista[0] || null;

        setTenants(lista);
        setTenantAtivo(ativo);
      } catch (err) {
        console.error("Erro ao carregar tenants:", err);
        setTenants([]);
        setTenantAtivo(null);
      } finally {
        setLoading(false);
      }
    };

    carregarTenants();
  }, [token]); // ✅ reexecuta quando o token muda (login/logout)

  const trocarTenant = async (id: number) => {
    setSwitching(true);
    const inicio = Date.now();

    try {
      await changeTenant(id);
      const data = await getTenants();
      setTenants(data.tenantsAcessiveis || []);
      setTenantAtivo(data.tenantAtivo);
    } catch (err) {
      console.error("Erro ao trocar tenant:", err);
    } finally {
      const elapsed = Date.now() - inicio;
      const restante = Math.max(800 - elapsed, 0);
      setTimeout(() => setSwitching(false), restante);
    }
  };

  return (
    <TenantContext.Provider value={{ tenantAtivo, tenants, loading, trocarTenant }}>
      {children}

      {switching && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999]">
          <div className="flex flex-col items-center text-gray-200">
            <svg
              className="animate-spin text-purple-400 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              width="50"
              height="50"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <p className="text-sm text-gray-300">Trocando tenant...</p>
          </div>
        </div>
      )}
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant deve ser usado dentro de <TenantProvider>");
  return ctx;
};