// src/componentes/graficos/GraficoDonutIncidentes.tsx
import { useRef } from "react";
import Chart from "react-apexcharts";

type Props = {
  titulo: React.ReactNode;
  total: number;
  valores: { Baixo: number; Médio: number; Alto: number; Crítico: number };
  onFiltrarPorNivel?: (nivel: "Baixo" | "Médio" | "Alto" | "Crítico" | null) => void;
};

export default function GraficoDonutIncidentes({ titulo, total, valores, onFiltrarPorNivel }: Props) {
  const labels = ["Baixo", "Médio", "Alto", "Crítico"];
  const series = [
    valores.Baixo || 0,
    valores.Médio || 0,
    valores.Alto || 0,
    valores.Crítico || 0,
  ];

  const cores = ["#1DD69A", "#6A55DC", "#6301F4", "#EC4899"];

  // 👇 guarda o último índice clicado
  const lastIndexRef = useRef<number | null>(null);

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      foreColor: "#fff",
      events: {
        dataPointSelection: function (_event, chartContext, config) {
          const idx = config.dataPointIndex;
          const nivel = labels[idx] as "Baixo" | "Médio" | "Alto" | "Crítico";

          // Se clicou novamente no mesmo índice -> limpa
          if (lastIndexRef.current === idx) {
            lastIndexRef.current = null;
            chartContext.toggleDataPointSelection(0, idx);
            if (onFiltrarPorNivel) onFiltrarPorNivel(null);
          } else {
            lastIndexRef.current = idx;
            // garante que apenas um setor fica marcado
            chartContext.toggleDataPointSelection(0, idx);
            if (onFiltrarPorNivel) onFiltrarPorNivel(nivel);
          }
        },
      },
    },
    labels,
    colors: cores,
    legend: { show: false },
    tooltip: {
      theme: "dark",
      y: { formatter: (val: number) => (val || 0).toLocaleString("pt-BR") },
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    plotOptions: {
      pie: { donut: { size: "70%", labels: { show: false } } },
    },
  };

  return (
    <div className="cards p-4 rounded-xl flex flex-col items-center gap-4">
      <h4 className="text-white text-sm">{titulo}</h4>

      <div className="flex items-center gap-6">
        <div className="relative w-44 h-44">
          <Chart options={options} series={series} type="donut" height={220} width="100%" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-white text-3xl font-bold">
              {total.toLocaleString("pt-BR")}
            </span>
            <span className="text-gray-400 text-xs">Incidentes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
