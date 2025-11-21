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
        
            fontSize: "18px",              // ↑ Texto maior na legenda
        
            markers: {
                width: 30,                 // ↑ vira linha
                height: 4,
                radius: 0,
                strokeWidth: 0,
            },
        
            itemMargin: {
                horizontal: 20,
                vertical: 0,
            },
        
            labels: {
                colors: "#E4E4E7",
            },
        },
        
    
        colors: ["#8B5CF6", "#00FF9C"],
    
        stroke: { curve: "smooth", width: 3 },

        dataLabels: {
            enabled: false, // <--- REMOVE OS QUADRADOS COM VALORES
        },
    
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
            },
        },
    
        yaxis: {
            labels: {
                style: { colors: "#8A8A8A" },
                formatter: (v: number) => `${v} GB`,
            },
            min: 0,
            max: 1000,
            tickAmount: 10,
        },
    
        tooltip: {
            theme: "dark",
            y: {
                formatter: (value: number) => `${value} GB`,
            },
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
