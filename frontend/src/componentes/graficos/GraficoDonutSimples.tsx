// src/components/graficos/GraficoDonutSimples.tsx
import Chart from "react-apexcharts";

export interface Props {
  labels: string[];
  series: number[];
  cores?: string[];
  height?: number;
  tituloDiagonal?: string;
  // 👇 Novo: dados extras opcionais por label
  tooltipExtra?: Record<string, { modified: number; added: number; deleted: number }>;
}

export default function GraficoDonutSimples({
  labels,
  series,
  cores,
  height = 200,
  tituloDiagonal,
  tooltipExtra,
}: Props) {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
    },
    labels,
    colors: cores,
    legend: { show: false },
    dataLabels: { enabled: false },
    tooltip: {
      custom: ({ series, seriesIndex, w }) => {
        const label = w.globals.labels[seriesIndex];
        const value = series[seriesIndex];
        const extra = tooltipExtra?.[label];

        return `
          <div style="padding:6px; font-size:12px">
            <strong>${label}</strong><br/>
            Total: ${value}
            ${
              extra
                ? `<br/>Modificado: ${extra.modified}
                   <br/>Adicionado: ${extra.added}
                   <br/>Deletado: ${extra.deleted}`
                : ""
            }
          </div>
        `;
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: { show: false },
        },
      },
    },
    stroke: { width: 0 },
  };

  return (
    <div className="relative flex items-center justify-center">
      <Chart options={options} series={series} type="donut" height={height} />

      {tituloDiagonal && (
        <span className="absolute left-2 top-1/2 -rotate-90 text-[#9b51e0] text-sm font-medium">
          {tituloDiagonal}
        </span>
      )}
    </div>
  );
}
