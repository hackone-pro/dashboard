import Chart from "react-apexcharts";

type GraficoDonutProps = {
  titulo?: string;
  labels: string[];
  series: number[];
  cores?: string[];
  height?: number;
};

export default function GraficoDonut({
  labels,
  series,
  cores = ["#00BFFF", "#8E6FFF", "#EF4444", "#F59E0B", "#10B981"],
  height = 250,
}: GraficoDonutProps) {
  const total = series.reduce((acc, cur) => acc + cur, 0);
  const percentBaixo = ((series[3] / total) * 100).toFixed(0); // índice 3 = Baixo

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      foreColor: "#fff",
    },
    labels,
    colors: cores,
    legend: {
      show: false, // vamos criar legenda manualmente
    },
    tooltip: {
      theme: "dark",
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: false,
    },
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
              label: `${percentBaixo}%`,
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
      {/* Donut Chart */}
      <div className="relative w-40 h-40">
        <Chart
          options={options}
          series={series}
          type="donut"
          height={height}
          width="100%"
        />

        {/* Label "Baixo" centralizada */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-white text-lg font-semibold">{percentBaixo}%</span>
          <span className="text-sm px-2 py-0.5 mt-1 rounded-full bg-emerald-500 text-black font-medium">Baixo</span>
        </div>
      </div>

      {/* Total + legenda */}
      <div>
        <h3 className="text-white text-3xl font-bold">4.532</h3>
        <p className="text-gray-400 text-sm mb-3">Alertas de Firewall</p>

        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-pink-500 rounded-full"></span>
            <span className="text-gray-300">132 alertas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
            <span className="text-gray-300">500 alertas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
            <span className="text-gray-300">1.800 alertas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-400 rounded-full"></span>
            <span className="text-gray-300">2.100 alertas</span>
          </div>
        </div>
      </div>
    </div>
  );
}