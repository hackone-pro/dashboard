import Chart from "react-apexcharts"

type GraficoDonutProps = {
  titulo?: string
  labels: string[]
  series: number[]
  cores?: string[]
  height?: number
}

export default function GraficoDonut({
  titulo,
  labels,
  series,
  cores = ["#00BFFF", "#8E6FFF", "#EF4444", "#F59E0B", "#10B981"],
  height = 250,
}: GraficoDonutProps) {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      foreColor: "#ccc",
    },
    labels,
    colors: cores,
    legend: {
      position: "bottom",
      labels: {
        colors: "#ccc",
      },
    },
    tooltip: {
      theme: "dark",
    },
    dataLabels: {
      style: {
        colors: ["#fff"],
      },
    },
    stroke: {
      show: false,
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          chart: {
            height: 200,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  }

  return (
    <div className="w-full">
      <div className="-mx-2">
        <Chart
          options={options}
          series={series}
          type="donut"
          height={height}
          width="100%"
        />
      </div>
    </div>
  )
}