// src/componentes/zabbix/Monitoria/FirewallCard.tsx

import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import ReactApexChart from "react-apexcharts";

import {
    getZabbixFirewalls,
    FirewallItem as ZabbixFirewallItem
} from "../../../services/zabbix/firewalls.service";

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

    const [firewalls, setFirewalls] = useState<FirewallItem[]>([]);

    async function carregarFirewalls() {
        try {
            const lista: ZabbixFirewallItem[] = await getZabbixFirewalls();

            const normalizado: FirewallItem[] = lista.map(item => ({
                nome: item.name,
                status: item.online ? "online" : "offline",
                x: Math.random() * 100,
                y: Math.random() * 100
            }));

            setFirewalls(normalizado);
        } catch (err) {
            console.error("Erro ao carregar Firewalls do Zabbix:", err);
            setFirewalls([]);
        }
    }

    useImperativeHandle(ref, () => ({
        carregar() {
            carregarFirewalls();
        }
    }));

    useEffect(() => {
        carregarFirewalls();
    }, []);

    // ==========================================================
    // 📊 GRÁFICO — SCATTER CLOUD + GRID HORIZONTAL
    // ==========================================================

    const scatterSeries = [
        {
            name: "Firewalls",
            data: firewalls.map(fw => ({
                x: fw.x,
                y: fw.y,
                nome: fw.nome,
                status: fw.status
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

        // ⭐ Linhas horizontais de ponta a ponta
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
            fw.status === "online" ? "#00e676" : "#ff4dd2"
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
                const cor = fw.status === "online" ? "#00e676" : "#ff4dd2";

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
        <div className="cards rounded-2xl p-6 flex flex-col card">

            <h3 className="text-white mb-4">Firewall</h3>
            <p className="text-gray-400 text-sm mb-2">
                Quantidade de Ativos Monitorados
            </p>
            <p className="text-white text-xs font-bold">
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
                        style={{ backgroundColor: "#00e676" }}
                    ></span>
                    <span className="text-xs text-gray-300">Online</span>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: "#ff4dd2" }}
                    ></span>
                    <span className="text-xs text-gray-300">Offline</span>
                </div>

            </div>

        </div>
    );
});

export default FirewallCard;
