import Chart from 'react-apexcharts';

const categorias = ['router-sap', 'fw-east', 'db-prod01', 'endpoint-02', 'web-balancer01'];

export default function GraficoBarraEmpilhadaHorizontal() {
  const series = [
    {
      name: 'Baixo',
      data: [200, 150, 300, 180, 140]
    },
    {
      name: 'Médio',
      data: [300, 200, 400, 220, 180]
    },
    {
      name: 'Alto',
      data: [400, 300, 350, 260, 160]
    },
    {
      name: 'Crítico',
      data: [1200, 805, 605, 560, 676]
    }
  ];

  // Calcular total por linha (posição) 
  const totais = categorias.map((_, i) =>
    series.reduce((acc, serie) => acc + serie.data[i], 0)
  );

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
      height: 350
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '40%',
        borderRadius: 0
      }
    },
    stroke: {
      width: 0
    },
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      offsetX: 8, // afasta o número da barra
      style: {
        fontSize: '12px',
        colors: ['transparent', 'transparent', 'transparent', '#fff'] // mostra apenas na última série
      },
      formatter: function (_val, opts) {
        const serieIndex = opts.seriesIndex;
        const dataPointIndex = opts.dataPointIndex;

        // Só mostra na última série
        if (serieIndex === series.length - 1) {
          return `${totais[dataPointIndex]}`;
        }
        return '';
      }
    },
    xaxis: {
      categories: categorias,
      labels: {
        style: { colors: '#939393' }
      },
      axisBorder: {
        show: false // ✅ remove a linha vertical da esquerda
      },
      axisTicks: {
        show: false // ✅ remove os risquinhos pequenos (ticks) da esquerda
      }
    },
    yaxis: {
      labels: {
        // style: { colors: '#fff' }
        show: false
      }
    },
    tooltip: {
      theme: 'dark'
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      labels: {
        colors: '#939393'
      },
      markers: {
        shape: 'circle'
      }
    },
    fill: {
      opacity: 1,
      colors: ['#34D399', '#818CF8', '#9333EA', '#EC4899'] // Baixo, Médio, Alto, Crítico
    },
    grid: {
      borderColor: '#2c2c3a',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true // ✅ ativa linhas verticais
        }
      },
      yaxis: {
        lines: {
          show: false // 👈 opcional: desativa linhas entre as barras
        }
      }
    }
  };

  return <Chart options={options} series={series} type="bar" height={340} />;
}
