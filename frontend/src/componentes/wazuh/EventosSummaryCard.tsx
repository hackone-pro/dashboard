// src/components/wazuh/EventosSummaryCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import {
  getEventosSummary,
  EventosSummary,
} from "../../services/wazuh/eventossummary.service";
import GraficoAreaSimples from "../graficos/GraficoAreaSimples";
import { useTenant } from "../../context/TenantContext";

export type EventosSummaryCardRef = {
  carregar: (opts?: {
    from?: string;
    to?: string;
    dias?: number;
  }) => void;
};

interface EventosSummaryCardProps {
  onDadosCarregados?: (totalEventos: number) => void;
}

const EventosSummaryCard = forwardRef<EventosSummaryCardRef, EventosSummaryCardProps>((props, ref) => {
  const { tenantAtivo } = useTenant();
  const [data, setData] = useState<EventosSummary | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async (opts?: {
    from?: string;
    to?: string;
    dias?: number;
  }) => {
    if (!tenantAtivo) return;

    try {
      setCarregando(true);
      setErro(null);

      const res = await getEventosSummary(
        opts?.from && opts?.to
          ? { from: opts.from, to: opts.to }
          : { dias: opts?.dias ?? 1 }
      );

      setData(res);
      const total = res.values.reduce((acc, v) => acc + v, 0);
      props.onDadosCarregados?.(total);
    } catch (err: any) {
      setErro(err.message ?? "Erro ao carregar dados");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar({ dias: 1 }); // padrão: últimas 24h
  }, [tenantAtivo]);

  useImperativeHandle(ref, () => ({
    carregar,
  }));

  if (carregando) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
        {/* Header fake */}
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 w-40 bg-[#ffffff14] rounded animate-pulse" />
        </div>
  
        {/* Gráfico fake */}
        <div className="space-y-3 mt-4">
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
    <div className="rounded-xl p-4 h-64 border border-white/5 flex items-center justify-center w-full">
      {erro && <span className="text-red-400">{erro}</span>}
      {!erro && data && (
        <GraficoAreaSimples
          labels={data.labels}
          values={data.values}
          descricaoTotal="Alertas"
        />
      )}
    </div>
  );
});

export default EventosSummaryCard;
