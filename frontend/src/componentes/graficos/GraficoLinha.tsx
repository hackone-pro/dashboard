// src/components/GraficoLinha.tsx
import Chart from "react-apexcharts"

type GraficoLinhaProps = {
  titulo?: string
  series: ApexAxisChartSeries
  categories: string[]
  cores?: string[]
  height?: number
}

export default function GraficoLinha({
  titulo,
  series,
  categories,
  cores = ["#8E6FFF", "#00BFFF"],
  height = 200,
}: GraficoLinhaProps) {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "line",
      toolbar: { show: false },
      zoom: { enabled: false },
      foreColor: "#ccc",
    },
    colors: cores,
    stroke: {
      curve: "smooth",
      width: 3,
    },
    grid: {
      borderColor: "#2a1d5a",
      strokeDashArray: 4,
    },
    xaxis: {
      categories,
      labels: { style: { colors: "#888" } },
    },
    yaxis: {
      labels: { style: { colors: "#888" } },
    },
    legend: {
      labels: { colors: "#ccc" },
      position: "bottom",
    },
    tooltip: {
      theme: "dark",
    },
  }

  return (
    <div className="w-full">
      <div className="-mx-2"> {/* Remove padding horizontal para encaixar full */}
        <Chart
          options={options}
          series={series}
          type="line"
          height={height}
          width="100%"
        />
      </div>
    </div>
  )
}