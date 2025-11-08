// src/components/wazuh/TopAgentsDonutCard.tsx
import { forwardRef, useImperativeHandle, useEffect, useState, useMemo } from "react";
import { getTopAgents, TopAgentItem } from "../../services/wazuh/topagents.service";
import GraficoDonutSimples from "../graficos/GraficoDonutSimples";
import { useTenant } from "../../context/TenantContext";

export type TopAgentsDonutCardRef = {
  carregar: () => void;
};

const TopAgentsDonutCard = forwardRef<TopAgentsDonutCardRef>((props, ref) => {
  const { tenantAtivo } = useTenant();
  const [dados, setDados] = useState<TopAgentItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    if (!tenantAtivo) return;
    try {
      setCarregando(true);
      setErro(null);
      const res = await getTopAgents("todos");
      setDados(res);
    } catch (e: any) {
      setErro(e?.message ?? "Erro ao carregar dados de agentes");
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

  const top5 = useMemo(() => {
    return [...dados].sort((a, b) => b.total_alertas - a.total_alertas).slice(0, 5);
  }, [dados]);

  const labels = top5.map((a) => a.agente || a.agent_name || "Desconhecido");
  const series = top5.map((a) => a.total_alertas);

  const tooltipExtra = top5.reduce((acc, a) => {
    const nome = a.agente || a.agent_name || "Desconhecido";
    acc[nome] = {
      modified: a.modified ?? 0,
      added: a.added ?? 0,
      deleted: a.deleted ?? 0,
    };
    return acc;
  }, {} as Record<string, { modified: number; added: number; deleted: number }>);

  const cores = ["#6B7280", "#A8A29E", "#D6D3D1", "#78716C", "#57534E"];

  if (erro) {
    return (
      <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2">
        {erro}
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="flex items-center">
        <div className="w-[220px] h-[220px] rounded-full bg-[#ffffff0a] animate-pulse" />
        <div className="flex flex-col gap-2 ml-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-xs bg-[#ffffff14] animate-pulse" />
              <div className="h-3 w-24 bg-[#ffffff14] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (series.length === 0) {
    return <div className="text-xs text-gray-400">Nenhum dado para exibir.</div>;
  }

  return (
    <div className="flex items-center">
      <div>
        <GraficoDonutSimples
          labels={labels}
          series={series}
          cores={cores}
          height={220}
          tooltipExtra={tooltipExtra}
        />
      </div>

      <div className="flex flex-col gap-2 text-xs text-gray-400 ml-6">
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