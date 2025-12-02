// src/pages/MonitoriaSOC.tsx
import { useRef } from "react";
import LayoutModel from "../componentes/LayoutModel";

import FirewallCard, { FirewallCardRef } from "../componentes/zabbix/Monitoria/FirewallCard";

export default function MonitoriaSOC() {

    // 🔵 ref obrigatório para usar <FirewallCard ref={firewallRef}>
    const firewallRef = useRef<FirewallCardRef>(null);

    return (
        <LayoutModel titulo="Monitoria">

            <section className="grid grid-cols-1 gap-6">

                {/* ================================
                    LINHA 1 – FIREWALL / CPU / DONUT
                ================================= */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* CARD – Firewall */}
                    <FirewallCard ref={firewallRef} />

                    {/* CARD – CPU e memória */}
                    <div className="cards rounded-2xl p-6">
                        <h3 className="text-white mb-4">CPU e memória</h3>
                        <div className="w-full h-full bg-black/20 rounded-xl border border-white/10" />
                    </div>

                    {/* CARD – Problemas por severidade */}
                    <div className="cards rounded-2xl p-6">
                        <h3 className="text-white mb-4">Problemas por severidade</h3>
                        <div className="w-full h-full bg-black/20 rounded-xl border border-white/10" />
                    </div>

                </div>

                {/* ================================
                    LINHA 2 – TOP SWITCHES CPU
                ================================= */}
                <div className="cards rounded-2xl p-6">
                    <h3 className="text-white mb-4">Top switches – CPU</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="fundo-dashboard h-24 rounded-xl border border-white/10" />
                        ))}
                    </div>
                </div>

                {/* ================================
                    LINHA 3 – HOSTS CPU + FIREWALLS
                ================================= */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                    {/* CARD – Top hosts por CPU */}
                    <div className="cards rounded-2xl p-6">
                        <h3 className="text-white mb-4">Top hosts por uso de CPU</h3>
                        <div className="h-80 bg-black/20 rounded-xl border border-white/10" />
                    </div>

                    {/* CARD – Top Firewalls */}
                    <div className="cards rounded-2xl p-6">
                        <h3 className="text-white mb-4">Top Firewalls – Saúde e tráfego</h3>
                        <div className="h-80 bg-black/20 rounded-xl border border-white/10" />
                    </div>

                </div>

                {/* ================================
                    LINHA 4 – Ativos / VPN / Switches
                ================================= */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                    {/* Card – Ativos monitorados */}
                    <div className="cards rounded-2xl p-6 h-[270px]">
                        <h3 className="text-white mb-4">Ativos monitorados</h3>
                        <div className="w-full h-full bg-black/20 rounded-xl border border-white/10" />
                    </div>

                    {/* Card – VPN */}
                    <div className="cards rounded-2xl p-6 h-[270px]">
                        <h3 className="text-white mb-4">VPN</h3>
                        <div className="w-full h-full bg-black/20 rounded-xl border border-white/10" />
                    </div>

                    {/* Card – Switches */}
                    <div className="cards rounded-2xl p-6 h-[270px]">
                        <h3 className="text-white mb-4">Switches</h3>
                        <div className="w-full h-full bg-black/20 rounded-xl border border-white/10" />
                    </div>

                </div>

                {/* ================================
                    LINHA 5 – WAN + Top Roteadores
                ================================= */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                    {/* Links WAN */}
                    <div className="cards rounded-2xl p-6">
                        <h3 className="text-white mb-4">Links WAN / Internet</h3>
                        <div className="h-80 bg-black/20 rounded-xl border border-white/10" />
                    </div>

                    {/* Top 5 roteadores */}
                    <div className="cards rounded-2xl p-6">
                        <h3 className="text-white mb-4">Top 5 Roteadores</h3>
                        <div className="h-80 bg-black/20 rounded-xl border border-white/10" />
                    </div>

                </div>

                {/* ================================
                    LINHA 6 – ALERTAS
                ================================= */}
                <div className="cards rounded-2xl p-6">
                    <h3 className="text-white mb-4">Alertas</h3>

                    {/* TABELA */}
                    <div className="overflow-auto rounded-xl border border-white/10">
                        <table className="w-full text-sm text-gray-400">
                            <thead className="bg-black/20 text-white">
                                <tr>
                                    <th className="py-2 px-4 text-left">Horário</th>
                                    <th className="py-2 px-4 text-left">Host</th>
                                    <th className="py-2 px-4 text-left">Problema</th>
                                    <th className="py-2 px-4 text-left">Severidade</th>
                                    <th className="py-2 px-4 text-left">Duração</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td className="py-2 px-4">--:--</td>
                                        <td className="py-2 px-4">HOST-{i}</td>
                                        <td className="py-2 px-4">Evento simulado</td>
                                        <td className="py-2 px-4">—</td>
                                        <td className="py-2 px-4">-- min</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </section>

        </LayoutModel>
    );
}
