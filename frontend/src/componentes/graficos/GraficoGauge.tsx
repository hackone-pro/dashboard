import Chart from 'react-apexcharts';

interface Props {
  valor: number; // 0..100
  titulo?: string;
  cor?: string; // se quiser forçar cor sólida
}

const C_GREEN = '#1DD69A';
const C_BLUE  = '#6366F1';
const C_PURP  = '#A855F7';
const C_PINK  = '#F914AD';

function buildStops(valor: number) {
  // trava a cor da faixa atual (sem blend antes do limite)
  if (valor <= 25) {
    return [
      { offset: 0,   color: C_GREEN, opacity: 1 },
      { offset: 100, color: C_GREEN, opacity: 1 },
    ];
  }
  if (valor <= 50) {
    return [
      { offset: 0,   color: C_GREEN, opacity: 1 },
      { offset: 25,  color: C_GREEN, opacity: 1 },
      { offset: 25.01, color: C_BLUE, opacity: 1 },
      { offset: 100, color: C_BLUE,  opacity: 1 },
    ];
  }
  if (valor <= 75) {
    return [
      { offset: 0,   color: C_GREEN, opacity: 1 },
      { offset: 25,  color: C_GREEN, opacity: 1 },
      { offset: 25.01, color: C_BLUE, opacity: 1 },
      { offset: 50,  color: C_BLUE,  opacity: 1 },
      { offset: 50.01, color: C_PURP, opacity: 1 },
      { offset: 100, color: C_PURP, opacity: 1 },
    ];
  }
  // 75..100
  return [
    { offset: 0,   color: C_GREEN, opacity: 1 },
    { offset: 25,  color: C_GREEN, opacity: 1 },
    { offset: 25.01, color: C_BLUE, opacity: 1 },
    { offset: 50,  color: C_BLUE,  opacity: 1 },
    { offset: 50.01, color: C_PURP, opacity: 1 },
    { offset: 75,  color: C_PURP, opacity: 1 },
    { offset: 75.01, color: C_PINK, opacity: 1 },
    { offset: 100, color: C_PINK, opacity: 1 },
  ];
}

export default function GraficoGauge({ valor, titulo = "Nível de Risco", cor }: Props) {
  const series = [valor];

  const options: ApexCharts.ApexOptions = {
    chart: { type: 'radialBar', offsetY: -10, sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        // meia-lua: ajuste se quiser outro ponto inicial
        startAngle: -120,
        endAngle: 120,
        hollow: { size: '70%' },
        track: { background: '#1e1e2d', strokeWidth: '100%' },
        dataLabels: {
          name: { show: false },
          value: {
            offsetY: 30, color: '#fff', fontSize: '40px', fontWeight: 400,
            formatter: (v) => `${v}%`,
          },
        },
      },
    },
    fill: cor
      ? { type: 'solid', colors: [cor] }
      : {
          type: 'gradient',
          colors: [C_GREEN], // ancora o início em verde
          gradient: {
            type: 'horizontal',
            shade: 'dark',
            inverseColors: false,
            opacityFrom: 1,
            opacityTo: 1,
            colorStops: buildStops(valor), // <<< chave da solução
          },
        },
    stroke: { lineCap: 'butt', dashArray: 4 },
    labels: [titulo],
  };

  return <Chart options={options} series={series} type="radialBar" height={250} />;
}
