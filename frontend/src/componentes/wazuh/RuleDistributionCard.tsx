// src/components/wazuh/RuleDistributionCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect, useMemo } from "react";
import { getRuleDistribution, RuleDistribution } from "../../services/wazuh/ruledistribution.service";
import GraficoDonutSimples from "../graficos/GraficoDonutSimples";

export type RuleDistributionCardRef = {
  carregar: () => void;
};

const RuleDistributionCard = forwardRef<RuleDistributionCardRef>((props, ref) => {
  const [dados, setDados] = useState<RuleDistribution>({ labels: [], values: [] });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const res = await getRuleDistribution("todos"); // default: 7 dias
      setDados(res);
    } catch (e: any) {
      setErro(e?.message ?? "Erro ao carregar distribuição de regras");
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

  // Top 5 regras
  const top5 = useMemo(() => {
    const pares = dados.labels.map((label, i) => ({
      label,
      value: dados.values[i] ?? 0,
    }));
    return pares.sort((a, b) => b.value - a.value).slice(0, 5);
  }, [dados]);

  const labels = top5.map((r) => r.label || "Desconhecido");
  const series = top5.map((r) => r.value);

  // Paleta fixa para 5 regras
  const cores = ["#78350F", "#A16207", "#EAB308", "#854D0E", "#B45309"];




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
        <GraficoDonutSimples labels={labels} series={series} cores={cores} height={220} />
      </div>

      {/* Legenda */}
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

export default RuleDistributionCard;
