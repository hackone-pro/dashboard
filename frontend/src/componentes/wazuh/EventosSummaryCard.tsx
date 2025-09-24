// src/components/wazuh/EventosSummaryCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { getEventosSummary, EventosSummary } from "../../services/wazuh/eventossummary.service";
import GraficoAreaSimples from "../graficos/GraficoAreaSimples";

export type EventosSummaryCardRef = {
  carregar: () => void;
};

const EventosSummaryCard = forwardRef<EventosSummaryCardRef>((props, ref) => {
  const [data, setData] = useState<EventosSummary | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
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
  }, []);

  useImperativeHandle(ref, () => ({
    carregar,
  }));

  if (carregando) {
    return <div className="w-full h-52 rounded-xl bg-[#ffffff0a] animate-pulse" />;
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
