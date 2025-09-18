import Chart from "react-apexcharts";

interface Props {
  valor: number; // 0..100
  titulo?: string;
}

const C_GREEN = "#1DD69A";
const C_BLUE  = "#6366F1";
const C_PURP  = "#A855F7";
const C_PINK  = "#F914AD";

function corPorValor(valor: number) {
  if (valor <= 25) return C_GREEN;
  if (valor <= 50) return C_BLUE;
  if (valor <= 75) return C_PURP;
  return C_PINK;
}

export default function GraficoGauge({ valor, titulo = "Nível de Risco" }: Props) {
  const series = [valor];

  const options: ApexCharts.ApexOptions = {
    chart: { type: "radialBar", offsetY: -10, sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        startAngle: -120,
        endAngle: 120,
        hollow: { size: "70%" },
        track: { background: "#1e1e2d", strokeWidth: "100%" },
        dataLabels: {
          name: { show: false },
          value: {
            offsetY: 30,
            color: "#fff",
            fontSize: "40px",
            fontWeight: 400,
            formatter: (v) => `${v}%`,
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: [corPorValor(valor)],
    },
    stroke: { lineCap: "butt", dashArray: 4 },
    labels: [titulo],
  };

  return <Chart options={options} series={series} type="radialBar" height={250} />;
}
