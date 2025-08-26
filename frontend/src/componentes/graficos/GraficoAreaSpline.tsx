// src/components/GraficoAreaSpline.tsx
import Chart from 'react-apexcharts';

interface Serie {
  name: string;
  data: number[];
}

interface GraficoAreaSplineProps {
  series: Serie[];
  categoriasX: string[];
  cores?: string[];
  height?: number;
  hideXAxisLabels?: boolean;
}

export default function GraficoAreaSpline({
  series,
  categoriasX,
  cores = ['#744CD8', '#ED35FB'],
  height = 300,
  hideXAxisLabels = false
}: GraficoAreaSplineProps) {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'area',
      height,
      zoom: { enabled: false },
      toolbar: { show: false }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      categories: categoriasX,
      labels: {
        show: !hideXAxisLabels,
        style: { colors: '#ccc' }
      }
    },
    yaxis: {
      labels: {
        style: { colors: '#ccc' }
      }
    },
    tooltip: {
      theme: 'dark'
    },
    grid: {
      borderColor: '#ffffff1e'
    },
    colors: cores,
    legend: {
      labels: {
        colors: '#ccc'
      }
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    },
    
  };

  return <Chart options={options} series={series} type="area" height={height} />;
}