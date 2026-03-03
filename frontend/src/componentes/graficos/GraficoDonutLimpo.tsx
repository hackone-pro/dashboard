import Chart from "react-apexcharts";

interface Props {
  valor: number;
  cor: string;
  height?: number;
}

export default function GraficoDonutCPU({
  valor,
  cor,
  height = 150,
}: Props) {
  const cpu = Math.min(100, Math.max(0, valor));

  const series =
    cpu === 0
      ? [100]
      : [cpu, 100 - cpu];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      toolbar: { show: false },
      sparkline: { enabled: true }, // remove margens
    },
    colors: cpu === 0 ? ["#1DD69A"] : [cor, "#1f1f2e"],
    legend: { show: false },
    dataLabels: { enabled: false },
    tooltip: { enabled: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "75%",
        },
      },
    },
  };

  return (
    <div className="relative flex items-center justify-center">
      <Chart options={options} series={series} type="donut" height={height} />

      <div className="absolute flex items-center justify-center">
        <span
          className="text-2xl font-semibold"
          style={{ color: cpu === 0 ? "#1DD69A" : cor }}
        >
          {cpu}%
        </span>
      </div>
    </div>
  );
}