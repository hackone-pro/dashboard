import Chart from "react-apexcharts";

interface Serie {
  name: string;
  data: number[];
}

interface GraficoVolumeProps {
  series: Serie[];
  categoriasX: string[];
  height?: number;
  yMax?: number;
}

export default function GraficoVolume({
  series,
  categoriasX,
  height = 320,
  yMax = 1024,
}: GraficoVolumeProps) {

  const TOTAL_GB = 1024;

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "area",
      height,
      toolbar: { show: false },
      zoom: { enabled: false },
      foreColor: "#A1A1AA",
    },

    // 🟣 usado | 🟢 total
    colors: ["#8B5CF6", "#00FF9C"],

    stroke: {
      curve: "smooth",
      width: [3, 2], // linha total um pouco mais fina
      dashArray: [0, 6], // total tracejada
    },

    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },

    dataLabels: { enabled: false },

    grid: {
      borderColor: "rgba(255,255,255,0.08)",
      strokeDashArray: 4,
    },

    xaxis: {
      categories: categoriasX,
      labels: {
        style: { colors: "#8A8A8A", fontSize: "11px" },
      },
      tooltip: { enabled: false },
    },

    // 🔥 EIXO Y DINÂMICO (baseado no uso)
    yaxis: {
      min: 0,
      max: yMax,
      tickAmount: 6,
      labels: {
        formatter: (v) => `${v.toFixed(0)} GB`,
        style: { colors: "#8A8A8A" },
      },
    },

    // 🧾 TOOLTIP COM 2 LINHAS
    tooltip: {
      shared: true,
      intersect: false,
      theme: "dark",

      y: {
        formatter: (value: number, { seriesIndex }) => {
          if (seriesIndex === 0) {
            return `${value.toFixed(2)} GB utilizados`;
          }

          if (seriesIndex === 1) {
            return `${TOTAL_GB} GB total`;
          }

          return "";
        },
      },
    },

    legend: {
      position: "top",
      labels: { colors: "#E4E4E7" },
    },
  };

  return (
    <Chart
      options={options}
      series={series}
      type="area"
      height={height}
      width="100%"
    />
  );
}
