// src/pages/MonitoriaSOC.tsx

import { useRef, useEffect } from "react";
import { useTenant } from "../context/TenantContext";
import LayoutModel from "../componentes/LayoutModel";
import GraficoVolume from "../componentes/graficos/GraficoVolume";

// Novo Card
import FirewallCard, { FirewallCardRef } from "../componentes/wazuh/Monitoria/FirewallCard";

const categoriasX = [
    "0 GB", "100 GB", "200 GB", "300 GB", "400 GB",
    "500 GB", "600 GB", "700 GB", "800 GB"
];

const dadosVolumeUtilizado = [50, 120, 200, 380, 450, 420, 510, 700, 650];
const dadosVolumeTotal = Array(categoriasX.length).fill(1000); // 1 TB

const seriesGrafico = [
    { name: "Volume utilizado", data: dadosVolumeUtilizado },
    { name: "Volume total", data: dadosVolumeTotal }
];

export default function MonitoriaSOC() {

    // REF DO CARD DE FIREWALL
    const { tenantAtivo } = useTenant();   // detecta mudança de tenant
    const firewallRef = useRef<FirewallCardRef>(null);

    // Atualiza todos os cards da página (por enquanto só firewall)
    const atualizarTudo = () => {
        firewallRef.current?.carregar();
    };
    
    useEffect(() => {
        firewallRef.current?.carregar();   // recarrega ao trocar tenant
    }, [tenantAtivo]);


    return (
        <LayoutModel titulo="Monitoria NGSOC">

            {/* Botão atualizar global */}
            {/* <div className="flex justify-end mb-4">
                <button
                    onClick={atualizarTudo}
                    className="px-3 py-1 border border-[#1D1929] hover:bg-white/10 rounded-md text-xs text-gray-300"
                >
                    Atualizar Tudo
                </button>
            </div> */}

            <section className="grid grid-cols-1 gap-6">

                {/* CARD — Volume de Dados Coletados */}
                <div className="cards rounded-2xl flex flex-col">

                    {/* Header */}
                    <header className="p-6 pb-2">
                        <h2 className="text-white text-lg">Volume de dados coletados</h2>

                        <div className="flex items-center gap-4 mt-4 flex-wrap">
                            <span className="fundo-dashboard text-gray-400 px-3 py-2 rounded-md text-xs">
                                Total: <span className="font-bold">1 TB</span>
                            </span>

                            <span className="text-[#6366F1] badge-darkpink px-3 py-2 rounded-md text-xs">
                                Usado: <span className="font-bold">700 GB</span>
                            </span>

                            <span className="text-pink-500 badge-pink px-3 py-2 rounded-md text-xs">
                                Disponível: <span className="font-bold">220 GB</span>
                            </span>
                        </div>
                    </header>

                    {/* Gráfico */}
                    <div
                        className="mt-4 mx-6 rounded-xl p-6"
                        style={{
                            backgroundImage: "url('/assets/img/bg-grafico.png')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            minHeight: "300px",
                            border: "1px solid rgba(255,255,255,0.06)"
                        }}
                    >
                        <GraficoVolume
                            series={seriesGrafico}
                            categoriasX={categoriasX}
                            height={320}
                        />
                    </div>

                    {/* Últimos descartes */}
                    <div className="p-6 pt-4">
                        <h3 className="text-gray-400 text-sm mb-3">Últimos Descartes</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                            <div className="fundo-dashboard p-3 rounded-lg border border-white/10 text-xs text-gray-400">
                                <div className="flex justify-between">
                                    <p><span className="font-bold">Descarte 1:</span> 10/11/2025</p>
                                    <p><span className="font-bold">Volume:</span> 98 GB</p>
                                </div>
                            </div>

                            <div className="fundo-dashboard p-3 rounded-lg border border-white/10 text-xs text-gray-400">
                                <div className="flex justify-between">
                                    <p><span className="font-bold">Descarte 2:</span> 11/11/2025</p>
                                    <p><span className="font-bold">Volume:</span> 48 GB</p>
                                </div>
                            </div>

                            <div className="fundo-dashboard p-3 rounded-lg border border-white/10 text-xs text-gray-400">
                                <div className="flex justify-between">
                                    <p><span className="font-bold">Descarte 3:</span> 12/11/2025</p>
                                    <p><span className="font-bold">Volume:</span> 140 GB</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* ====== CARDS DE MONITORAMENTO ====== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* FIREWALL — Ref + Load + Paginação */}
                    <FirewallCard ref={firewallRef} />

                    {/* ===== SERVIDORES (placeholder) ===== */}
                    <div className="cards rounded-2xl p-6">
                        <h3 className="text-white text-sm mb-4">Servidores</h3>
                        <p className="text-gray-500 text-xs">Em desenvolvimento...</p>
                    </div>

                    {/* ===== EDR (placeholder) ===== */}
                    <div className="cards rounded-2xl p-6">
                        <h3 className="text-white text-sm mb-4">EDR</h3>
                        <p className="text-gray-500 text-xs">Em desenvolvimento...</p>
                    </div>

                    {/* ===== Outros Coletores (placeholder) ===== */}
                    <div className="cards rounded-2xl p-6">
                        <h3 className="text-white text-sm mb-4">Outros Coletores</h3>
                        <p className="text-gray-500 text-xs">Em desenvolvimento...</p>
                    </div>

                </div>

            </section>
        </LayoutModel>
    );
}
