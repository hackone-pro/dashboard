// src/components/wazuh/DistribuicaoAcoesCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect, useMemo } from "react";
import { getOvertimeEventos, OvertimeEventos } from "../../services/wazuh/overtimeeventos.service";
import GraficoDonutSimples from "../graficos/GraficoDonutSimples";

export type DistribuicaoAcoesCardRef = {
  carregar: () => void;
};

const DistribuicaoAcoesCard = forwardRef<DistribuicaoAcoesCardRef>((props, ref) => {
  const [data, setData] = useState<OvertimeEventos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const res = await getOvertimeEventos("todos"); // 👈 força filtro "todos"
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

  // 👉 Calcula o total de cada ação e pega só o Top 5
  const top5 = useMemo(() => {
    if (!data) return [];
    const totais = data.datasets.map((ds) => ({
      label: ds.name,
      value: ds.data.reduce((acc, n) => acc + (n || 0), 0),
    }));
    return totais.sort((a, b) => b.value - a.value).slice(0, 5);
  }, [data]);

  const labels = top5.map((r) => r.label || "Desconhecido");
  const series = top5.map((r) => Number.isFinite(r.value) ? r.value : 0);

  const cores = ["#1DD69A", "#6A55DC", "#EC4899", "#FACC15", "#3B82F6"];

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

  if (!series.length || series.every((v) => v === 0)) {
    return <div className="flex items-center justify-center w-full h-52 text-xs text-gray-400">Nenhum dado para exibir.</div>;
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
        />
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

export default DistribuicaoAcoesCard;
