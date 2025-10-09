import { useState, useMemo, useEffect } from "react";
import Chart from "react-apexcharts";

type GraficoDonutProps = {
  labels: string[];
  series: number[];
  cores?: string[];
  height?: number;
  descricaoTotal?: string;
  idxSelecionado?: number | null;
  onSelecionarIdx?: (index: number | null) => void;
};

export default function GraficoDonut({
  labels,
  series,
  cores = ["#EC4899", "#6A55DC", "#6301F4", "#1DD69A"],
  height = 220,
  descricaoTotal = "Alertas",
  idxSelecionado = null,
  onSelecionarIdx,
}: GraficoDonutProps) {
  const total = Math.max(0, series.reduce((a, b) => a + (b || 0), 0));
  const [ativoIdx, setAtivoIdx] = useState<number | null>(idxSelecionado);

  // 🔹 Sincroniza com o valor vindo do pai
  useEffect(() => {
    setAtivoIdx(idxSelecionado);
  }, [idxSelecionado]);

  // 🔹 Decide se mostra tudo ou só a fatia ativa
  const seriesPlot = useMemo(() => {
    // 🔹 Se o total for 0 (nenhum alerta), renderiza 100% de uma fatia neutra
    if (total === 0) return [100];
  
    // 🔹 Se clicou numa severidade que é 0, ainda força uma pequena fatia visível (1)
    if (ativoIdx !== null) {
      const val = series[ativoIdx] || 0;
      return [val > 0 ? val : 1];
    }
  
    // 🔹 Modo normal (mostra todas as fatias)
    return series;
  }, [ativoIdx, series, total]);
  

  const labelsPlot = useMemo(() => {
    if (total === 0) return ["Sem dados"];
    if (ativoIdx === null) return labels;
    return [labels[ativoIdx]];
  }, [ativoIdx, labels, total]);

  const coresPlot = useMemo(() => {
    // 🔹 Cinza escuro neutro se total for zero
    if (total === 0) return ["#3B3B3B"];
  
    // 🔹 Se clicou em uma severidade com valor 0, ainda mantém a cor da severidade
    if (ativoIdx !== null) return [cores[ativoIdx] ?? "#10B981"];
  
    // 🔹 Caso padrão (mostra todas)
    return cores;
  }, [ativoIdx, cores, total]);
  


  const idxCentro =
    ativoIdx !== null && ativoIdx !== undefined
      ? ativoIdx
      : series.indexOf(Math.max(...series.map((n) => n || 0)));

  const ratioCentro = total > 0 ? ((series[idxCentro] || 0) / total) * 100 : 0;
  const pctCentro = Math.round(ratioCentro);
  const corCentro = cores[idxCentro] ?? "#10B981";

  const options: ApexCharts.ApexOptions = {
    chart: { type: "donut", foreColor: "#fff" },
    labels: labelsPlot,
    colors: coresPlot,
    legend: { show: false },
    tooltip: {
      theme: "dark",
      fillSeriesColor: false,
      x: { show: false },
      y: {
        formatter: (val: number) => `${val.toLocaleString("pt-BR")} alertas`,
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            name: { show: false },
            value: { show: false },
            total: {
              show: true,
              label: `${pctCentro}%`,
              fontSize: "24px",
              color: "#fff",
              formatter: () => "",
            },
          },
        },
      },
    },
  };

  return (
    <div className="flex items-center justify-between gap-6 w-full">
      {/* Donut */}
      <div className="relative w-44 h-44 transition-all duration-300">
        <Chart
          options={options}
          series={seriesPlot}
          type="donut"
          height={height}
          width="100%"
          key={ativoIdx} // força re-render ao clicar
        />
        {/* Centro */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all"
          style={{
            filter: ativoIdx !== null ? "brightness(1.2)" : "none",
          }}
        >
          <span
            className="text-white text-3xl font-semibold"
            style={{
              color: corCentro,
              // textShadow: "0 0 10px rgba(255,255,255,0.3)",
            }}
          >
            {pctCentro}%
          </span>
          <span
            className="text-xs px-2 py-0.5 mt-1 rounded-full font-medium"
            style={{ background: corCentro, color: "#0b0b1a" }}
          >
            {labels[idxCentro] ?? ""}
          </span>
        </div>
      </div>

      {/* Coluna lateral com labels */}
      <div className="flex flex-col items-start">
        <div className="gap-2 mb-2">
          <h3 className="text-white text-2xl">
            {total.toLocaleString("pt-BR")}
          </h3>
          <span className="text-gray-400 text-sm">{descricaoTotal}</span>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          {labels.map((lb, i) => {
            const percent = total > 0 ? (series[i] / total) * 100 : 0;
            const ativo = ativoIdx === i;
            return (
              <button
                key={i}
                onClick={() => {
                  const novo = i === ativoIdx ? null : i;
                  setAtivoIdx(novo);
                  onSelecionarIdx?.(novo);
                }}
                className={`flex items-center gap-3 text-left transition-all ${ativo ? "scale-105" : "opacity-80 hover:opacity-100"
                  }`}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: cores[i] ?? "#999",
                    boxShadow: ativo ? `0 0 8px ${cores[i]}` : "none",
                  }}
                />
                <span
                  className={`text-gray-300 ${ativo ? "text-white font-semibold" : ""
                    }`}
                >
                  {series[i].toLocaleString("pt-BR")} alertas
                  ({percent.toFixed(2)}%)
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
