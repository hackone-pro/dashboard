// src/componentes/zabbix/Monitoria/FirewallCard.tsx

import { forwardRef, useImperativeHandle } from "react";
import ReactApexChart from "react-apexcharts";

export type FirewallCardRef = {
    carregar: () => void;
};

type FirewallItem = {
    nome: string;
    status: "online" | "offline";
    x: number;
    y: number;
};

const FirewallCard = forwardRef<FirewallCardRef>((props, ref) => {

    // ================================
    // DADOS FAKE
    // ================================
    const firewalls: FirewallItem[] = [
        { nome: "FW-HQ-SP", status: "online", x: 10, y: 70 },
        { nome: "FW-DATACENTER", status: "online", x: 30, y: 40 },
        { nome: "FW-FILIAL-RJ", status: "offline", x: 50, y: 80 },
        { nome: "FW-FILIAL-MG", status: "online", x: 70, y: 30 },
        { nome: "FW-DMZ", status: "online", x: 85, y: 60 },
        { nome: "FW-BACKUP", status: "offline", x: 40, y: 20 },
        { nome: "FW-EDGE", status: "online", x: 60, y: 55 }
    ];

    useImperativeHandle(ref, () => ({
        carregar() {}
    }));

    // ==========================================================
    // 📊 GRÁFICO — SCATTER CLOUD
    // ==========================================================

    const scatterSeries = [
        {
            name: "Firewalls",
            data: firewalls.map(fw => ({
                x: fw.x,
                y: fw.y,
                nome: fw.nome,
                status: fw.status,
                fillColor: fw.status === "online" ? "#1DD69A" : "#EC4899",
            }))
        }
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
                speed: 600
            }
        },

        grid: {
            show: true,
            borderColor: "rgba(255,255,255,0.08)",
            strokeDashArray: 4,
            yaxis: { lines: { show: true } },
            xaxis: { lines: { show: false } }
        },

        markers: {
            size: 14,
            strokeWidth: 2,
            strokeColors: "#1a1a1a",
            hover: { size: 20 }
        },

        colors: firewalls.map(fw =>
            fw.status === "online" ? "#1DD69A" : "#EC4899"
        ),

        xaxis: {
            min: 0,
            max: 100,
            labels: { show: false },
            axisTicks: { show: false },
            axisBorder: { show: false }
        },

        yaxis: {
            min: 0,
            max: 100,
            labels: { show: false }
        },

        tooltip: {
            theme: "dark",
            custom: ({ seriesIndex, dataPointIndex, w }) => {
                const fw = w.config.series[seriesIndex].data[dataPointIndex];
                const cor = fw.status === "online" ? "#1DD69A" : "#EC4899";

                return `
                    <div style="padding:10px;">
                        <strong>${fw.nome}</strong><br/>
                        Status:
                        <span style="color:${cor}; font-weight:bold;">
                            ${fw.status.toUpperCase()}
                        </span>
                    </div>
                `;
            }
        },

        legend: { show: false }
    };

    return (
        <div className="cards rounded-2xl p-6 flex flex-col card zabbix-card">

            <h3 className="text-white">Firewall</h3>
            <p className="text-gray-400 text-sm mb-4">
                Quantidade de Firewalls
            </p>

            <p className="text-white text-xs">
                Total de Firewalls: {firewalls.length}
            </p>

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
                    ></span>
                    <span className="text-xs text-gray-400">Online</span>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: "#EC4899" }}
                    ></span>
                    <span className="text-xs text-gray-400">Offline</span>
                </div>

            </div>

        </div>
    );
});

export default FirewallCard;