import Chart from "react-apexcharts";

export interface GraficoBarHorizontalProps {
    categorias: string[];
    valores: number[];
    cor?: string;
    tituloY?: string;
}

export default function GraficoBarHorizontal({
    categorias,
    valores,
    cor = "#632BD3", // cor padrão roxa
    tituloY,
}: GraficoBarHorizontalProps) {
    const options: ApexCharts.ApexOptions = {
        chart: {
            type: "bar",
            background: "transparent",
            toolbar: { show: false },
            height: categorias.length * 50, // altura dinâmica
        },
        plotOptions: {
            bar: {
                horizontal: true,
                borderRadius: 4,
                barHeight: "70%",
            },
        },
        grid: {
            show: false, // 👈 remove todas as linhas horizontais/verticais
        },
        xaxis: {
            categories: categorias,
            axisBorder: { show: false }, // 👈 remove linha do eixo X
            axisTicks: { show: false },  // 👈 remove ticks
            labels: {
                style: { colors: "#99a1af" },
            },
        },
        yaxis: {
            title: {
                text: tituloY ?? "",
                style: { color: "#9b51e0", fontSize: "15px", fontWeight: 500 },
                offsetX: 10, // move horizontalmente (mais negativo = mais afastado da esquerda)
                offsetY: 0,   // se precisar mover verticalmente
            },
            axisBorder: { show: false }, // 👈 remove linha do eixo Y
            axisTicks: { show: false },  // 👈 remove ticks
            labels: {
                style: { colors: "#99a1af" },
            },
        },
        colors: [cor],
        dataLabels: { enabled: false },
        tooltip: {
            theme: "dark",
        },
        // @ts-ignore
        grid: { borderColor: "rgba(255,255,255,0.05)" },
    };

    const series = [
        {
            name: "Vulnerabilidades",
            data: valores,
        },
    ];

    return <Chart options={options} series={series} type="bar" height={350} />;
}
