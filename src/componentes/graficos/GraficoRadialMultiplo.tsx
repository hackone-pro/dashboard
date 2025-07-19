import Chart from "react-apexcharts"

type GraficoRadialMultiploProps = {
    series: number[]
    labels: string[]
    total: number
    cores?: string[]
    height?: number
}

export default function GraficoRadialMultiplo({
    series,
    labels,
    total,
    cores = ["#EF4444", "#F59E0B", "#0EA5E9"], // Alto, Médio, Baixo
    height = 260,
}: GraficoRadialMultiploProps) {
    const options: ApexCharts.ApexOptions = {
        chart: {
            type: "radialBar",
        },
        colors: cores,
        plotOptions: {
            radialBar: {
                hollow: {
                    size: "60%",
                },
                track: {
                    background: "#1b133d",
                },
                dataLabels: {
                    show: true,
                    name: {
                        show: true,
                        fontSize: "16px",
                        color: "#fff",
                        offsetY: -10,
                    },
                    value: {
                        fontSize: "20px",
                        color: "#fff",
                        offsetY: 10,
                        formatter: (val) => `${Math.round(val)}`, // remove o "%"
                    },
                    total: {
                        show: true,
                        label: "Total",
                        fontSize: "16px",
                        color: "#fff",
                        formatter: () => total.toString(),
                    },
                },
            },
        },
        labels,
        legend: { show: false },
        tooltip: { theme: "dark" },
    }

    return (
        <div className="w-full flex flex-col md:flex-row items-center md:justify-start gap-4">
            {/* Gráfico */}
            <div className="w-full md:w-[60%] -mx-2">
                <Chart
                    options={options}
                    series={series}
                    type="radialBar"
                    height={height}
                    width="100%"
                />
            </div>

            {/* Legenda ao lado */}
            <div className="mt-6 md:mt-0 flex flex-col gap-3 text-sm text-white">
                {labels.map((label, i) => (
                    <div key={label} className="flex items-center gap-2">
                        <div
                            className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px]"
                            style={{
                                borderColor: `transparent transparent ${cores[i]} transparent`,
                            }}
                        />
                        <span>{label}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
