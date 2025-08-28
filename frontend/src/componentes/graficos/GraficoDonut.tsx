// src/components/graficos/GraficoDonut.tsx
import Chart from "react-apexcharts";

type GraficoDonutProps = {
  labels: string[];              // ex.: ["Crítico","Alto","Médio","Baixo"]
  series: number[];              // ex.: [criticoTotal, altoTotal, medioTotal, baixoTotal]
  cores?: string[];              // ex.: ["#EC4899","#6A55DC","#6301F4","#1DD69A"]
  height?: number;
  /** Título ao lado do total (coluna direita) */
  descricaoTotal?: string;       // ex.: "Alertas de Firewall"
};

export default function GraficoDonut({
  labels,
  series,
  cores = ["#EC4899", "#6A55DC", "#6301F4", "#1DD69A"],
  height = 220,
  descricaoTotal = "Alertas",
}: GraficoDonutProps) {
  const total = Math.max(0, series.reduce((a, b) => a + (b || 0), 0));

  // Prioriza "Baixo" para o centro; se não existir, usa a maior fatia
  const idxBaixo = labels.findIndex((l) => l.toLowerCase().startsWith("baixo"));
  const idxCentro =
    idxBaixo >= 0
      ? idxBaixo
      : series.indexOf(Math.max(...series.map((n) => n || 0)));

  const pctCentro =
    total > 0 ? Math.round(((series[idxCentro] || 0) / total) * 100) : 0;

  const options: ApexCharts.ApexOptions = {
    chart: { type: "donut", foreColor: "#fff" },
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

  const corCentro = cores[idxCentro] ?? "#10B981";

  return (
    <div className="flex items-center justify-between gap-6 w-full">
      {/* Donut */}
      <div className="relative w-44 h-44">
        <Chart options={options} series={series} type="donut" height={height} width="100%" />
        {/* Centro: % + pill com o nome */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-white text-3xl font-semibold">{pctCentro}%</span>
          <span
            className="text-xs px-2 py-0.5 mt-1 rounded-full font-medium"
            style={{ background: corCentro, color: "#0b0b1a" }}
          >
            {labels[idxCentro] ?? ""}
          </span>
        </div>
      </div>

      {/* Coluna direita: total grande + descrição + lista com pontos coloridos e VALORES */}
      <div className="flex flex-col items-start">
        <div className=" gap-2 mb-2">
          <h3 className="text-white text-2xl">
            {total.toLocaleString("pt-BR")}
          </h3>
          <span className="text-gray-400 text-sm">{descricaoTotal}</span>
        </div>

        <div className="flex flex-col gap-2 text-sm">
          {labels.map((lb, i) => (
            <div key={i} className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-full"
                style={{ background: cores[i] ?? "#999" }}
              />
              <span className="text-gray-300">
                {(series[i] || 0).toLocaleString("pt-BR")} alertas
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}