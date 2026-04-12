import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ScreenData {
  page: string;
  entity: string | null;
  metadata: string | null;
}

interface ScreenContextType {
  screenData: ScreenData;
  setScreenData: (entity: string | null, metadata: Record<string, unknown>) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ScreenContext = createContext<ScreenContextType | undefined>(undefined);

export function ScreenProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [screenData, setScreenDataState] = useState<ScreenData>({
    page: location.pathname,
    entity: null,
    metadata: null,
  });

  // Atualiza page automaticamente quando a rota muda e limpa dados antigos
  useEffect(() => {
    setScreenDataState({ page: location.pathname, entity: null, metadata: null });
  }, [location.pathname]);

  const setScreenData = useCallback(
    (entity: string | null, metadata: Record<string, unknown>) => {
      setScreenDataState({
        page: location.pathname,
        entity,
        metadata: JSON.stringify(metadata),
      });
    },
    [location.pathname]
  );

  return (
    <ScreenContext.Provider value={{ screenData, setScreenData }}>
      {children}
    </ScreenContext.Provider>
  );
}

// ─── Hook para paginas registrarem seus dados ─────────────────────────────────

export function useScreenContext() {
  const ctx = useContext(ScreenContext);
  if (!ctx) throw new Error("useScreenContext deve ser usado dentro de <ScreenProvider>");
  return ctx;
}
