import Chart from "react-apexcharts";

type Serie = {
    name: string;
    data: number[];
};

type GraficoAreaStackedProps = {
    labels: string[];
    datasets: Serie[];
    cores?: string[];
    descricaoTotal?: string;
};

export default function GraficoAreaStacked({
    labels,
    datasets,
    cores = ["#6A55DC", "#1DD69A", "#EC4899"],
    descricaoTotal = "Eventos",
}: GraficoAreaStackedProps) {
    const total = datasets.reduce(
        (acc, ds) => acc + ds.data.reduce((a, b) => a + (b || 0), 0),
        0
    );

    const options: ApexCharts.ApexOptions = {
        chart: {
            type: "area",
            stacked: true,
            toolbar: { show: false },
            foreColor: "#fff",
            height: "100%",
            width: "100%",
        },
        xaxis: {
            categories: labels,
            labels: { style: { colors: "#aaa" } },
        },
        yaxis: {
            labels: {
                formatter: (val: number) => (val || 0).toLocaleString("pt-BR"),
                style: { colors: "#aaa" },
            },
        },
        legend: {
            show: true,
            position: "left",
            horizontalAlign: "center",
            labels: {
                colors: "#fff",
                style: {
                    fontSize: "18px",
                },
            } as any,
            markers: {
                shape: "square",
                size: 7,
            },
        },

        tooltip: {
            theme: "dark",
            y: { formatter: (val: number) => (val || 0).toLocaleString("pt-BR") },
        },
        dataLabels: { enabled: false },
        stroke: {
            show: false, // 👈 remove as linhas
            curve: "smooth",
            width: 0,
        },
        fill: {
            type: "solid", // pode trocar por "gradient" se quiser fade
            opacity: 0.9,  // deixa mais forte ou mais leve
        },
        colors: cores,
        grid: {
            yaxis: { lines: { show: false } }, // remove horizontais
            xaxis: { lines: { show: false } },  // mantém verticais
        },
    };


    return (
        <div className="w-full h-full overtime">
            <Chart
                options={options}
                series={datasets}
                type="area"
                height="100%"
                width="100%"
            />

            {/* <div className="flex items-center justify-end text-gray-300 text-sm mt-2">
                <span className="text-white text-lg font-semibold mr-2">
                    {total.toLocaleString("pt-BR")}
                </span>
                {descricaoTotal}
            </div> */}
        </div>
    );
}
