import { useEffect, useState } from "react";
import { getSeveridadeWazuh } from "../services/wazuh/severidade.service";
import LayoutModel from "../componentes/LayoutModel";
import GraficoGauge from '../componentes/graficos/GraficoGauge';
import FluxoIncidentes from "../componentes/iris/FluxoIncidentes";
import SeveridadeCard from "../componentes/wazuh/SeveridadeCard";
import TopAgentsCard from "../componentes/wazuh/TopAgentsCard";
import TopAgentsCisCard from "../componentes/wazuh/TopAgentsCisCard";
import FirewallDonutCard from "../componentes/wazuh/FirewallDonutCard";


import { getToken } from "../utils/auth";

type SeveridadeResposta = {
    critico: number;
    alto: number;
    medio: number;
    baixo: number;
    total: number;
};


export default function RiskLevel() {

    const token = getToken();

    const [totalAlertas24h, setTotalAlertas24h] = useState<number>(0);
    const formatador = new Intl.NumberFormat('pt-BR');
    const [indiceRisco, setIndiceRisco] = useState<number>(0);
    const [carregando, setCarregando] = useState<boolean>(true);

    useEffect(() => {
        async function fetchTotal() {
            try {
                const res = await getSeveridadeWazuh();

                // ✅ res.total já vem pronto do backend
                setTotalAlertas24h(res.total);
            } catch (err) {
                console.error("Erro ao buscar severidade:", err);
            }
        }

        fetchTotal();
    }, []);

    useEffect(() => {
        async function carregarDados() {
            try {
                const dados: SeveridadeResposta = await getSeveridadeWazuh();
                const { baixo, medio, alto, critico, total } = dados;

                const risco =
                    total > 0
                        ? ((baixo * 0.20 + medio * 0.60 + alto * 0.87 + critico * 1.00) / total) * 100
                        : 0;

                setIndiceRisco(parseFloat(risco.toFixed(2)));
            } catch (err) {
                console.error("Erro ao calcular índice de risco:", err);
            } finally {
                setCarregando(false);
            }
        }

        carregarDados();
    }, []);

    return (
        <LayoutModel titulo="Risk Level">
            <section className="cards p-6 rounded-2xl shadow-lg">
                <div className="flex flex-wrap justify-between items-start mb-6">
                    {/* Título */}
                    <div className="flex flex-col">
                        <h2 className="text-white text-sm font-medium">Nível de alertas nas últimas 24h</h2>
                    </div>

                    {/* Totais */}
                    <div className="flex items-end gap-3 flex-wrap">
                        <h3 className="text-white text-base font-semibold">{formatador.format(totalAlertas24h)} alertas totais</h3>
                        {/* <p className="text-xs text-pink-500">↓ 12% <span className="text-gray-400">comparado às 24h anteriores</span></p> */}
                    </div>

                    {/* Dropdown (comentado) */}
                    {/* <select className="cards text-white text-sm px-3 py-1 rounded-md border border-[#3B2A70] outline-none">
                        <option value="24h">24 horas</option>
                        <option value="48h">48 horas</option>
                        <option value="7d">7 dias</option>
                    </select> */}
                </div>

                {/* Grid com 5 colunas */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
                    {/* Coluna 1 - Gráfico central */}
                    <div className="cards rounded-xl p-4 flex flex-col justify-center relative h-full">
                        <GraficoGauge valor={Math.round(indiceRisco)} />
                        <img
                            src="/assets/img/icon-risk.png"
                            alt="Risco"
                            className="absolute z-20 w-6 h-6 top-1/3 left-1/2 -translate-x-1/2 -translate-y-[72%] pointer-events-none"
                        />
                        <div className="flex gap-3 text-xs text-gray-400 mt-4 text-[10px] justify-center">
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-[#1DD69A] rounded-xs"></span> Baixo
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-[#6366F1] rounded-xs"></span> Médio
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-[#A855F7] rounded-xs"></span> Alto
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-[#F914AD] rounded-xs"></span> Crítico
                            </div>
                        </div>
                    </div>

                    {/* Colunas 2 a 5 - Severidade dinâmica */}
                    <div className="md:col-span-4 h-full">
                        <SeveridadeCard />
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8 items-stretch">
                {/* Coluna 1 - Top 10 Agentes com vulnerabilidades */}
                <TopAgentsCard />

                {/* Coluna 2 - Top 10 agentes com menores scores de CIS */}
                <TopAgentsCisCard />

                {/* Coluna 3 - Dois cards empilhados */}
                <div className="flex flex-col h-full">
                    {/* Card superior */}
                    <FirewallDonutCard />

                    {/* Card inferior */}
                    <div className="flex-1">
                        <div className="cards rounded-xl p-6 shadow-md h-full">
                            <FluxoIncidentes token={token || ""} />
                        </div>
                    </div>

                </div>
            </section>
        </LayoutModel>
    );
}