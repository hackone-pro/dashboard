import Chart from "react-apexcharts"

type GraficoBarrasEmpilhadasProps = {
  titulo?: string
  series: ApexAxisChartSeries
  categories: string[]
  cores?: string[]
  height?: number
}

export default function GraficoBarrasEmpilhadas({
  titulo,
  series,
  categories,
  cores = ["#0EA5E9", "#F97316"], // Azul (Wazuh), Laranja (Iris)
  height = 280,
}: GraficoBarrasEmpilhadasProps) {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      stacked: true,
      toolbar: { show: false },
      foreColor: "#ccc",
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "50%",
        borderRadius: 4,
      },
    },
    dataLabels: {
      enabled: true,
      style: { colors: ["#fff"] },
    },
    colors: cores,
    xaxis: {
      categories,
      labels: { style: { colors: "#aaa" } },
    },
    yaxis: {
      labels: { style: { colors: "#aaa" } },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      labels: { colors: "#ccc" },
    },
    tooltip: {
      theme: "dark",
    },
    grid: {
      borderColor: "#2a1d5a",
      strokeDashArray: 4,
    },
  }

  return (
    <div className="w-full">
      {titulo && (
        <h3 className="text-lg font-semibold text-white mb-4">{titulo}</h3>
      )}
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