// src/componentes/graficos/GraficoVolume.tsx
import Chart from "react-apexcharts";

interface Serie {
    name: string;
    data: number[];
}

interface GraficoVolumeProps {
    series: Serie[];
    categoriasX: string[];
    height?: number;
}

export default function GraficoVolume({
    series,
    categoriasX,
    height = 320,
}: GraficoVolumeProps) {

    const TOTAL_GB = 1024;

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: "area",
            height,
            zoom: { enabled: false },
            toolbar: { show: false },
            foreColor: "#A1A1AA",
            offsetY: 20,
        },

        legend: {
            position: "top",
            horizontalAlign: "center",
            fontSize: "18px",
            markers: {
                // @ts-ignore
                width: 30,
                height: 4,
                radius: 0,
                strokeWidth: 0,
            },
            itemMargin: {
                horizontal: 20,
                vertical: 0,
            },
            labels: { colors: "#E4E4E7" },
        },

        colors: ["#8B5CF6", "#00FF9C"],

        stroke: { curve: "smooth", width: 3 },

        dataLabels: { enabled: false },

        fill: {
            type: "gradient",
            gradient: {
                shade: "dark",
                opacityFrom: 0.45,
                opacityTo: 0.05,
                stops: [0, 90, 100],
            },
        },

        grid: {
            borderColor: "rgba(255,255,255,0.1)",
            strokeDashArray: 4,
        },

        xaxis: {
            categories: categoriasX,
            labels: {
                style: { colors: "#8A8A8A", fontSize: "11px" },
                formatter: (v: string) => `${v} GB`,
            },
        },

        yaxis: {
            labels: {
                style: { colors: "#8A8A8A" },
                formatter: (v: number) => `${v} GB`,
            },
            min: 0,
            max: TOTAL_GB,
            tickAmount: 10,
        },

        //  Tooltip somente com Utilizado + Disponível
        tooltip: {
            shared: false,
            intersect: false,   // <-- IMPORTANTE! Faz tooltip aparecer ao passar sobre a linha
            theme: "dark",
        
            custom: function({ series, seriesIndex, dataPointIndex }) {
                // Mostra tooltip APENAS para Volume Utilizado
                if (seriesIndex !== 0) return "";
        
                const usado = series[0][dataPointIndex];
                const TOTAL_GB = 1024;
                const disponivel = TOTAL_GB - usado;
        
                return `
                    <div style="
                        background: #1E1E1E;
                        padding: 10px 14px;
                        border-radius: 8px;
                        color: #fff;
                        font-size: 12px;
                        border: 1px solid #333;">
                        
                        <span style="color:#A78BFA;">Volume utilizado:</span>
                        ${usado.toFixed(2)} GB<br>
        
                        <span class="text-pink-500">Volume disponível:</span>
                        ${disponivel.toFixed(2)} GB
                    </div>
                `;
            }
        },
        
        
    };

    return (
        <Chart
            options={options}
            series={series}
            type="area"
            height={height}
            width="100%"
        />
    );
}
