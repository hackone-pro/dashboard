// src/componentes/graficos/GraficoDonutIncidentes.tsx
import Chart from "react-apexcharts";

type Props = {
  titulo: React.ReactNode;   // 👈 antes era string
  total: number;
  valores: { Baixo: number; Médio: number; Alto: number; Crítico: number };
};

export default function GraficoDonutIncidentes({ titulo, total, valores }: Props) {
  const labels = ["Baixo", "Médio", "Alto", "Crítico"];
  const series = [
    valores.Baixo || 0,
    valores.Médio || 0,
    valores.Alto || 0,
    valores.Crítico || 0,
  ];

  const cores = ["#1DD69A", "#6A55DC", "#6301F4", "#EC4899"];

  const options: ApexCharts.ApexOptions = {
    chart: { type: "donut", foreColor: "#fff" },
    labels,
    colors: cores,
    legend: { show: false }, // vamos customizar legendas manualmente
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
          labels: { show: false }, // centro manual
        },
      },
    },
  };

  return (
    <div className="cards p-4 rounded-xl flex flex-col items-center gap-4">
      <h4 className="text-white text-sm">{titulo}</h4>

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative w-44 h-44">
          <Chart options={options} series={series} type="donut" height={220} width="100%" />
          {/* Centro: total de incidentes */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-white text-3xl font-bold">
              {total.toLocaleString("pt-BR")}
            </span>
            <span className="text-gray-400 text-xs">Incidentes</span>
          </div>
        </div>

        {/* Legenda lateral com valores */}
        <div className="flex flex-col gap-3 text-xs">
          {labels.map((lb, i) => (
            <div key={i} className="flex items-center gap-3">
              <span
                className="w-3 h-3 rounded-xs"
                style={{ background: cores[i] }}
              />
              <span className="text-gray-400">{series[i].toLocaleString("pt-BR")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legenda abaixo apenas com nomes */}
      <div className="flex gap-6 text-[10px] text-gray-400 mt-2">
        {labels.map((lb, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-xs"
              style={{ background: cores[i] }}
            />
            {lb}
          </div>
        ))}
      </div>
    </div>
  );
}