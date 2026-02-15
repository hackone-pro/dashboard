import { forwardRef, useImperativeHandle } from "react";
import ReactApexChart from "react-apexcharts";

export type SwitchesCardRef = {
    carregar: () => void;
};

type SwitchItem = {
    nome: string;
    status: "online" | "offline";
    x: number;
    y: number;
};

const SwitchesCard = forwardRef<SwitchesCardRef>((props, ref) => {

    // ================================
    // DADOS FAKE
    // ================================
    const switches: SwitchItem[] = [
        { nome: "SW-Core-HQ", status: "online", x: 12, y: 70 },
        { nome: "SW-Distrib-01", status: "online", x: 25, y: 50 },
        { nome: "SW-Distrib-02", status: "online", x: 40, y: 30 },
        { nome: "SW-Acesso-01", status: "online", x: 60, y: 80 },
        { nome: "SW-Acesso-02", status: "offline", x: 75, y: 55 },
        { nome: "SW-Acesso-03", status: "online", x: 30, y: 15 },
        { nome: "SW-Acesso-04", status: "offline", x: 85, y: 25 },
        { nome: "SW-DMZ", status: "online", x: 50, y: 65 },
    ];

    useImperativeHandle(ref, () => ({
        carregar() {}
    }));

    // ==========================================================
    // GRÁFICO — SCATTER CLOUD
    // ==========================================================

    const scatterSeries = [
        {
            name: "Switches",
            data: switches.map((sw) => ({
                x: sw.x,
                y: sw.y,
                nome: sw.nome,
                status: sw.status,
                fillColor: sw.status === "online" ? "#1DD69A" : "#EC4899",
            }))
        },
    ];

    const scatterOptions: ApexCharts.ApexOptions = {
        chart: {
            type: "scatter",
            height: 240,
            toolbar: { show: false },
            zoom: { enabled: false },
            foreColor: "#AAA",
            animations: {
                enabled: true,
                speed: 600,
            },
        },

        grid: {
            show: true,
            borderColor: "rgba(255,255,255,0.08)",
            strokeDashArray: 4,
            yaxis: { lines: { show: true } },
            xaxis: { lines: { show: false } },
        },

        markers: {
            size: 14,
            strokeWidth: 2,
            strokeColors: "#1a1a1a",
            hover: { size: 20 },
        },

        colors: switches.map((sw) =>
            sw.status === "online" ? "#1DD69A" : "#EC4899"
        ),

        xaxis: {
            min: 0,
            max: 100,
            labels: { show: false },
            axisTicks: { show: false },
            axisBorder: { show: false },
        },

        yaxis: {
            min: 0,
            max: 100,
            labels: { show: false },
        },

        tooltip: {
            theme: "dark",
            custom: ({ seriesIndex, dataPointIndex, w }) => {
                const sw =
                    w.config.series[seriesIndex].data[dataPointIndex];
                const cor =
                    sw.status === "online" ? "#1DD69A" : "#EC4899";

                return `
                <div style="padding:10px;">
                    <strong>${sw.nome}</strong><br/>
                    Status:
                    <span style="color:${cor}; font-weight:bold;">
                        ${sw.status.toUpperCase()}
                    </span>
                </div>
                `;
            },
        },

        legend: { show: false },
    };

    const total = switches.length;
    const online = switches.filter(s => s.status === "online").length;
    const offline = switches.filter(s => s.status === "offline").length;

    return (
        <div className="cards rounded-2xl p-6 flex flex-col card switches-card">

            <h3 className="text-white mb-4">Switches</h3>

            <p className="text-gray-400 text-sm mb-2">
                Status dos Switches Monitorados
            </p>

            {/* RESUMO */}
            <div className="flex gap-3 items-center mb-4">

                <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-white/15 bg-white/5 text-gray-300 text-sm">
                    <span className="text-gray-400">Total:</span>
                    <span className="font-semibold text-white">{total}</span>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-[#1DD69A]/40 bg-[#1DD69A]/10 text-emerald-300 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1DD69A]" />
                    <span>Online:</span>
                    <span className="font-semibold">{online}</span>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-[#EC4899]/40 bg-[#EC4899]/10 text-[#EC4899] text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#EC4899]" />
                    <span>Offline:</span>
                    <span className="font-semibold">{offline}</span>
                </div>

            </div>

            <div className="flex-1">
                <ReactApexChart
                    options={scatterOptions}
                    series={scatterSeries}
                    type="scatter"
                    height="100%"
                />
            </div>

            <div className="flex justify-end gap-4 mt-5">

                <div className="flex items-center gap-2">
                    <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: "#1DD69A" }}
                    />
                    <span className="text-xs text-gray-400">Online</span>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: "#EC4899" }}
                    />
                    <span className="text-xs text-gray-400">Offline</span>
                </div>

            </div>

        </div>
    );
});

export default SwitchesCard;