import Chart from 'react-apexcharts';

interface Props {
  series: ApexAxisChartSeries;
  categories: string[];
}

export default function GraficoLinha24h({ series, categories }: Props) {
  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'line',
      height: 350,
      zoom: { enabled: false },
      toolbar: { show: false }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    xaxis: {
      categories,
      title: {
        text: '',
      },
      labels: {
        style: { colors: '#ccc' }
      }
    },
    yaxis: {
      title: {
        text: 'Alertas',
        style: { color: '#ccc' }
      },
      labels: {
        style: { colors: '#ccc' }
      }
    },
    tooltip: {
      theme: 'dark'
    },
    dataLabels: {
      enabled: false
    },
    grid: {
      borderColor: '#333'
    },
    colors: ['#00BFFF']
  };

  return (
    <Chart options={options} series={series} type="line" height={350} />
  );
}