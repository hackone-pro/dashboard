// src/components/wazuh/EventosSummaryCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { getEventosSummary, EventosSummary } from "../../services/wazuh/eventossummary.service";
import GraficoAreaSimples from "../graficos/GraficoAreaSimples";
import { useTenant } from "../../context/TenantContext";

export type EventosSummaryCardRef = {
  carregar: () => void;
};

const EventosSummaryCard = forwardRef<EventosSummaryCardRef>((props, ref) => {
  const { tenantAtivo } = useTenant();
  const [data, setData] = useState<EventosSummary | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    if (!tenantAtivo) return;
    try {
      setCarregando(true);
      setErro(null);
      const res = await getEventosSummary();
      setData(res);
    } catch (err: any) {
      setErro(err.message ?? "Erro ao carregar dados");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [tenantAtivo]);

  useImperativeHandle(ref, () => ({
    carregar,
  }));

  if (carregando) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 w-40 bg-[#ffffff14] rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-10 bg-[#ffffff14] rounded animate-pulse" />
              <div className="flex-1 h-3 bg-[#ffffff14] rounded animate-pulse" />
              <div className="h-3 w-8 bg-[#ffffff14] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 items-stretch">
      <div className="rounded-xl p-4 h-64 border border-white/5 flex items-center justify-center w-full">
        {erro && <span className="text-red-400">{erro}</span>}
        {!carregando && !erro && data && (
          <GraficoAreaSimples
            labels={data.labels}
            values={data.values}
            descricaoTotal="Alertas"
          />
        )}
      </div>
    </div>
  );
});

export default EventosSummaryCard;