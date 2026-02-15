import Chart from "react-apexcharts";

export interface GraficoStackedBarChartProps {
  categorias: string[];
  series: { name: string; data: number[] }[];

  cores?: string[];
  tituloY?: string;

  stacked?: boolean;
  distributed?: boolean;
  horizontal?: boolean;
  mostrarLegenda?: boolean;
}

export default function GraficoStackedBarChart({
  categorias,
  series,
  cores = ["#1DD69A", "#6F58E6", "#6700FF", "#F914AD"],
  tituloY = "",
  stacked = true,
  distributed = false,
  horizontal = false,
  mostrarLegenda = false,
}: GraficoStackedBarChartProps) {

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      stacked: stacked,
      background: "transparent",
      toolbar: { show: false },
      zoom: { enabled: false },
    },

    plotOptions: {
      bar: {
        horizontal: horizontal,
        borderRadius: 4,
        columnWidth: "50%",
        distributed: distributed,
      },
    },

    xaxis: {
      categories: categorias,
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: { colors: "#99a1af" },
      },
    },

    yaxis: {
      title: {
        text: tituloY ?? "",
        style: {
          color: "#9b51e0",
          fontSize: "15px",
          fontWeight: 500,
        },
      },
      labels: {
        style: { colors: "#99a1af" },
      },
    },

    legend: {
      position: "top",
      inverseOrder: true,
      show: mostrarLegenda,
      labels: { colors: "#99a1af" },
    },

    colors: cores,

    grid: {
      borderColor: "rgba(255,255,255,0.05)",
    },

    tooltip: {
      shared: stacked,
      intersect: false,
      theme: "dark",
    },

    dataLabels: {
      enabled: false,
    },
  };

  return (
    <Chart
      options={options}
      series={series}
      type="bar"
      height="100%"
    />
  );
}
