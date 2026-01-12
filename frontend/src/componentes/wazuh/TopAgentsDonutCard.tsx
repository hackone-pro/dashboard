// src/components/wazuh/TopAgentsDonutCard.tsx
import {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useState,
  useMemo,
} from "react";

import GraficoDonutSimples from "../graficos/GraficoDonutSimples";
import { useTenant } from "../../context/TenantContext";

import {
  getTopAgentsSyscheck,
  TopAgentSyscheckItem,
} from "../../services/wazuh/topagentesyscheck.service";

export type TopAgentsDonutCardRef = {
  carregar: (opts?: {
    from?: string;
    to?: string;
    dias?: number;
  }) => void;
};

const TopAgentsDonutCard = forwardRef<TopAgentsDonutCardRef>((_, ref) => {
  const { tenantAtivo } = useTenant();

  const [dados, setDados] = useState<TopAgentSyscheckItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // --------------------------------------------------
  // CARREGAR DADOS
  // --------------------------------------------------
  const carregar = async (opts?: {
    from?: string;
    to?: string;
    dias?: number;
  }) => {
    if (!tenantAtivo) return;

    try {
      setCarregando(true);
      setErro(null);

      const res = await getTopAgentsSyscheck(
        opts?.from && opts?.to
          ? { from: opts.from, to: opts.to }
          : { dias: opts?.dias ?? 1 } // fallback: últimas 24h
      );

      setDados(res);
    } catch (e: any) {
      setErro(e?.message ?? "Erro ao carregar dados de agentes");
    } finally {
      setCarregando(false);
    }
  };

  // --------------------------------------------------
  // LOAD PADRÃO (ÚLTIMAS 24H)
  // --------------------------------------------------
  useEffect(() => {
    carregar({ dias: 1 });
  }, [tenantAtivo]);

  // --------------------------------------------------
  // 🔌 EXPÕE MÉTODO PARA O PAI
  // --------------------------------------------------
  useImperativeHandle(ref, () => ({
    carregar,
  }));

  // --------------------------------------------------
  // TOP 5
  // --------------------------------------------------
  const top5 = useMemo(() => {
    return [...dados]
      .sort((a, b) => b.total_alertas - a.total_alertas)
      .slice(0, 5);
  }, [dados]);

  const labels = top5.map((a) => a.agente || "Desconhecido");
  const series = top5.map((a) => a.total_alertas);

  const tooltipExtra = top5.reduce(
    (acc, a) => {
      acc[a.agente] = {
        modified: a.modified ?? 0,
        added: a.added ?? 0,
        deleted: a.deleted ?? 0,
      };
      return acc;
    },
    {} as Record<string, { modified: number; added: number; deleted: number }>
  );

  const cores = ["#6B7280", "#A8A29E", "#D6D3D1", "#78716C", "#57534E"];

  // --------------------------------------------------
  // ERRO
  // --------------------------------------------------
  if (erro) {
    return (
      <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2">
        {erro}
      </div>
    );
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------
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

  // --------------------------------------------------
  // SEM DADOS
  // --------------------------------------------------
  if (series.length === 0) {
    return <div className="text-xs text-gray-400">Nenhum dado para exibir.</div>;
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------
  return (
    <div className="flex items-center">
      <GraficoDonutSimples
        labels={labels}
        series={series}
        cores={cores}
        height={220}
        tooltipExtra={tooltipExtra}
      />

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
