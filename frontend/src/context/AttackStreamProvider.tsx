import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useTenant } from "./TenantContext";
import { getTopPaisesGeoRange } from "../services/wazuh/toppaises.service";

type AttackEvent = {
  _id: string;
  origem?: any;
  destino?: any;
  rule?: any;
  ts: number;
};

type AttackStreamContextType = {
  events: AttackEvent[];
  newEvents: AttackEvent[];
  ready: boolean;
};

const AttackStreamContext = createContext<AttackStreamContextType | undefined>(
  undefined
);

export function AttackStreamProvider({ children }: { children: ReactNode }) {
  const { tenantAtivo } = useTenant();

  const [events, setEvents] = useState<AttackEvent[]>([]);
  const [newEvents, setNewEvents] = useState<AttackEvent[]>([]);
  const [ready, setReady] = useState(false);

  const seenRef = useRef<Set<string>>(new Set());

  /* ============================
     FETCH — A CADA 5s
  ============================ */
  useEffect(() => {
    if (!tenantAtivo) return;

    let ativo = true;

    const carregar = async () => {
      try {
        const flows = await getTopPaisesGeoRange("30s");
        if (!ativo) return;

        const novos: AttackEvent[] = [];

        flows.forEach((f: any) => {
          const oLat = f.origem?.lat;
          const oLng = f.origem?.lng;
          const dLat = f.destino?.lat;
          const dLng = f.destino?.lng;
        
          // 🌍 1. GEO obrigatório
          if (
            oLat == null ||
            oLng == null ||
            dLat == null ||
            dLng == null
          ) {
            return;
          }
        
          // 2. Ignora se origem e destino são o mesmo ponto
          if (oLat === dLat && oLng === dLng) {
            return;
          }
        
          // 🔑 3. Identificador da regra (MITRE ou description)
          const ruleKey =
            f.rule?.mitre?.technique?.join?.(",") ||
            f.rule?.mitre?.technique ||
            f.rule?.description;
        
          // ❌ Sem regra identificável, ignora
          if (!ruleKey) return;
        
          // 🆔 4. ID estável
          const id = `${ruleKey}-${f.origem.ip}-${f.destino.ip}-${f.destino.devname}`;
        
          if (!seenRef.current.has(id)) {
            seenRef.current.add(id);
        
            novos.push({
              ...f,
              _id: id,
              ts: Date.now(), // usado para controle visual no mapa
            });
          }
        });
        

        if (novos.length) {
          setNewEvents(novos);
          setEvents((prev) => [...novos, ...prev].slice(0, 300));
        } else {
          setNewEvents([]);
        }

        if (!ready) setReady(true);
      } catch (e) {
        console.error("AttackStream error:", e);
      }
    };

    carregar();
    const interval = setInterval(carregar, 5000);

    return () => {
      ativo = false;
      clearInterval(interval);
    };
  }, [tenantAtivo]);

  return (
    <AttackStreamContext.Provider
      value={{
        events,
        newEvents,
        ready,
      }}
    >
      {children}
    </AttackStreamContext.Provider>
  );
}

/* ============================
   HOOK
============================ */
export function useAttackStream() {
  const ctx = useContext(AttackStreamContext);
  if (!ctx) {
    throw new Error(
      "useAttackStream deve ser usado dentro de AttackStreamProvider"
    );
  }
  return ctx;
}
