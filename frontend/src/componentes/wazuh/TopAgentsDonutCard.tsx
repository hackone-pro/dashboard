// src/components/wazuh/TopAgentsDonutCard.tsx
import { forwardRef, useImperativeHandle, useEffect, useState, useMemo } from "react";
import { getTopAgents, TopAgentItem } from "../../services/wazuh/topagents.service";
import GraficoDonutSimples from "../graficos/GraficoDonutSimples";

export type TopAgentsDonutCardRef = {
  carregar: () => void;
};

const TopAgentsDonutCard = forwardRef<TopAgentsDonutCardRef>((props, ref) => {
  const [dados, setDados] = useState<TopAgentItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const res = await getTopAgents("todos"); // 👈 default
      setDados(res);
    } catch (e: any) {
      setErro(e?.message ?? "Erro ao carregar dados de agentes");
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

  // 👉 Pega só os Top 5
  const top5 = useMemo(() => {
    return [...dados].sort((a, b) => b.total_alertas - a.total_alertas).slice(0, 5);
  }, [dados]);

  const labels = top5.map((a) => a.agente || a.agent_name || "Desconhecido");
  const series = top5.map((a) => a.total_alertas);

  // 👉 Extra para o tooltip
  const tooltipExtra = top5.reduce((acc, a) => {
    const nome = a.agente || a.agent_name || "Desconhecido";
    acc[nome] = {
      modified: a.modified ?? 0,
      added: a.added ?? 0,
      deleted: a.deleted ?? 0,
    };
    return acc;
  }, {} as Record<string, { modified: number; added: number; deleted: number }>);

  // Paleta fixa para 5 agentes
  const cores = ["#B91C1C", "#C2410C", "#CA8A04", "#92400E", "#4B5563"];


  if (erro) {
    return (
      <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2">
        {erro}
      </div>
    );
  }

  if (carregando) {
    return <div className="w-full h-52 rounded-xl bg-[#ffffff0a] animate-pulse" />;
  }

  if (series.length === 0) {
    return <div className="text-xs text-gray-400">Nenhum dado para exibir.</div>;
  }

  return (
    <div className="flex items-center">
      {/* Donut */}
      <div>
        <GraficoDonutSimples
          labels={labels}
          series={series}
          cores={cores}
          height={220}
          tooltipExtra={tooltipExtra} // 👈 passa os extras
        />
      </div>

      {/* Legenda ao lado */}
      <div className="flex flex-col gap-2 text-xs text-gray-400">
        {labels.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-xs"
              style={{ backgroundColor: cores[i % cores.length] }}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
});

export default TopAgentsDonutCard;
