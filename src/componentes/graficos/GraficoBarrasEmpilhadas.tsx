import Chart from "react-apexcharts"

type GraficoBarraEmpilhadaProps = {
  titulo?: string
  series: ApexAxisChartSeries
  categories: string[]
  cores?: string[]
  height?: number
}

export default function GraficoBarraEmpilhada({
  titulo,
  series,
  categories,
  cores = ["#3B82F6", "#38BDF8"],
  height = 260,
}: GraficoBarraEmpilhadaProps) {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      stacked: true,
      toolbar: { show: false },
      foreColor: "#ccc",
      animations: {
        enabled: true,
        speed: 400,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "45%",
        borderRadius: 4,
      },
    },
    colors: cores,
    xaxis: {
      categories,
      labels: { style: { colors: "#aaa" } },
    },
    yaxis: {
      labels: { style: { colors: "#aaa" } },
    },
    grid: {
      borderColor: "#2a1d5a",
      strokeDashArray: 4,
    },
    legend: {
      position: "bottom",
      labels: { colors: "#ccc" },
    },
    tooltip: {
      theme: "dark",
    },
    dataLabels: {
      enabled: false,
    },
  }

  return (
    <div className="w-full">
      <div className="-mx-2">
        <Chart
          options={options}
          series={series}
          type="bar"
          height={height}
          width="100%"
        />
      </div>
    </div>
  )
}