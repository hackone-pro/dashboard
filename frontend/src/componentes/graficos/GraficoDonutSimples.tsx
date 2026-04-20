// src/components/graficos/GraficoDonutSimples.tsx
import Chart from "react-apexcharts";

export interface SocTooltipData {
  count: number;
  percent: number;
  deltaPercent: number | null;
}

export interface Props {
  labels: string[];
  series: number[];
  cores?: string[];
  height?: number;
  tituloDiagonal?: string;
  // 👇 Dados extras opcionais por label (usado em ArchivesIntegrity)
  tooltipExtra?: Record<string, { modified: number; added: number; deleted: number }>;
  // 👇 Dados ricos para tooltip do SOC Analytics (count + % + delta)
  tooltipSoc?: Record<string, SocTooltipData>;
  // 👇 Callback quando usuário clica numa fatia
  onSliceClick?: (label: string, value: number) => void;
}

export default function GraficoDonutSimples({
  labels,
  series,
  cores,
  height = 200,
  tituloDiagonal,
  tooltipExtra,
  tooltipSoc,
  onSliceClick,
}: Props) {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
      events: onSliceClick
        ? {
            dataPointSelection: (_event, _chartContext, config) => {
              const idx: number = config.dataPointIndex;
              onSliceClick(labels[idx], series[idx]);
            },
          }
        : undefined,
    },
    labels,
    colors: cores,
    legend: { show: false },
    dataLabels: { enabled: false },
    tooltip: {
      custom: ({ series, seriesIndex, w }) => {
        const label = w.globals.labels[seriesIndex];
        const value = series[seriesIndex];
        const soc = tooltipSoc?.[label];
        const extra = tooltipExtra?.[label];

        if (soc) {
          const deltaStr = soc.deltaPercent != null
            ? `<span style="color:${soc.deltaPercent >= 0 ? "#EC4899" : "#1DD69A"};margin-left:4px">${soc.deltaPercent >= 0 ? "+" : ""}${soc.deltaPercent.toFixed(0)}%</span>`
            : "";
          return `
            <div style="padding:8px 10px;font-size:12px;line-height:1.6;min-width:130px">
              <div style="font-weight:600;margin-bottom:4px">${label}</div>
              <div>${soc.count.toLocaleString("pt-BR")} incidentes</div>
              <div style="color:#9ca3af">${soc.percent.toFixed(0)}% do total${deltaStr}</div>
            </div>
          `;
        }

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
