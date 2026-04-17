// src/components/wazuh/RuleDistributionCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect, useMemo } from "react";
import { getRuleDistribution, RuleDistribution } from "../../services/wazuh/ruledistribution.service";
import GraficoDonutSimples from "../graficos/GraficoDonutSimples";
import { useTenant } from "../../context/TenantContext";

export type RuleDistributionCardRef = {
  carregar: (opts?: {
    from?: string;
    to?: string;
    dias?: number;
  }) => void;
};

interface RuleDistributionCardProps {
  onDadosCarregados?: (items: { label: string; value: number }[]) => void;
}

const RuleDistributionCard = forwardRef<RuleDistributionCardRef, RuleDistributionCardProps>(({ onDadosCarregados }, ref) => {
  const { tenantAtivo } = useTenant();
  const [dados, setDados] = useState<RuleDistribution>({ labels: [], values: [] });
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
  
      const res = await getRuleDistribution(
        opts?.from && opts?.to
          ? { from: opts.from, to: opts.to }
          : { dias: opts?.dias ?? 1 }
      );
  
      setDados(res);
      const top5computed = res.labels
        .map((label, i) => ({ label, value: res.values[i] ?? 0 }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      onDadosCarregados?.(top5computed);
    } catch (e: any) {
      setErro(e?.message ?? "Erro ao carregar distribuição de regras");
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

  const top5 = useMemo(() => {
    const pares = dados.labels.map((label, i) => ({
      label,
      value: dados.values[i] ?? 0,
    }));
    return pares.sort((a, b) => b.value - a.value).slice(0, 5);
  }, [dados]);

  const labels = top5.map((r) => r.label || "Desconhecido");
  const series = top5.map((r) => r.value);
  const cores = ["#78350F", "#A16207", "#EAB308", "#854D0E", "#B45309"];

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
        <GraficoDonutSimples labels={labels} series={series} cores={cores} height={220} />
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

export default RuleDistributionCard;