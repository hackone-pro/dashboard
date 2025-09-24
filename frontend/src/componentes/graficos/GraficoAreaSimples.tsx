import Chart from "react-apexcharts";

type GraficoLinhaProps = {
  labels: string[];
  values: number[];
  descricaoTotal?: string;
};

export default function GraficoLinha({
  labels,
  values,
  descricaoTotal = "Alertas",
}: GraficoLinhaProps) {
  const total = values.reduce((a, b) => a + (b || 0), 0);

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
      foreColor: "#fff",
    },
    xaxis: {
      categories: labels,
      labels: { style: { colors: "#aaa" } },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => (val || 0).toLocaleString("pt-BR"),
        style: { colors: "#aaa" },
      },
    },
    stroke: {
      curve: "smooth",
      width: 2,
      colors: ["#8B5CF6"],
    },
    markers: {
      size: 4,
      colors: ["#8B5CF6"],
      strokeColors: "#8B5CF6",
      strokeWidth: 2,
    },
    grid: {
      borderColor: "rgba(255,255,255,0.1)",
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
      strokeDashArray: 4, // 👈 linhas horizontais tracejadas
    },
    tooltip: {
      theme: "dark",
      marker: {
        fillColors: ["#8B5CF6"], // 👈 bolinha do tooltip roxa
      },
      y: { formatter: (val: number) => (val || 0).toLocaleString("pt-BR") },
    },
  };

  return (
    <div className="w-full h-full eventos-summary">
      <Chart
        options={options}
        series={[{ name: descricaoTotal, data: values }]}
        type="line"
        height="100%"
        width="100%"
      />

      {/* <div className="flex items-center justify-end text-gray-300 text-sm mt-2">
        <span className="text-white text-lg font-semibold mr-2">
          {total.toLocaleString("pt-BR")}
        </span>
        {descricaoTotal}
      </div> */}
    </div>
  );
}
