import Chart from 'react-apexcharts';

interface Props {
    valor: number; // de 0 a 100
    titulo?: string;
    cor?: string;
}

export default function GraficoGauge({ valor, titulo = "Risk Level", cor = "#FF4D4F" }: Props) {
    const series = [valor];

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: 'radialBar',
            offsetY: -10,
            sparkline: { enabled: true },
        },
        plotOptions: {
            radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: {
                    size: '70%',
                },
                track: {
                    background: '#1e1e2d',
                    strokeWidth: '100%',
                },
                dataLabels: {
                    name: {
                        offsetY: -10,
                        color: '#ccc',
                        fontSize: '14px',
                        show: false
                    },
                    value: {
                        offsetY: 30,
                        color: '#fff',
                        fontSize: '40px',
                        fontWeight: 400,
                        formatter: val => `${val}%`
                    }
                }
            }
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'horizontal',
                gradientToColors: ['#F914AD'], // vermelho final
                stops: [0, 100],
            },
            colors: ['#6700FF'], // amarelo inicial
        },

        stroke: {
            lineCap: 'butt',
            dashArray: 4 // 👈 isso cria os "tracinhos"
        },
        labels: [titulo]
    };

    return <Chart options={options} series={series} type="radialBar" height={250} />;
}
