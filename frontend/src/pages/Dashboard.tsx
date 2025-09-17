// src/pages/Dashboard.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { getSeveridadeWazuh } from "../services/wazuh/severidade.service";

import LayoutModel from "../componentes/LayoutModel";
import GeoHitsMap from '../componentes/graficos/GeoHitsMap';
import GraficoGauge from '../componentes/graficos/GraficoGauge';
import { FaQuestionCircle } from "react-icons/fa";

//Utils
import { getToken } from '../utils/auth';

//Components
import TopIncidentesCard from "../componentes/iris/TopIncidents";
import IaHumans from "../componentes/iris/IaHumans";
import TopFirewallCard from "../componentes/wazuh/TopFirewallCard";
import TopCountriesTable from "../componentes/wazuh/threatmap/TopCountriesTable";


function getNivelExposicao(percentual: number) {
    if (percentual < 40) return { label: "Baixo", badge: "badge-green" };
    if (percentual < 73.5) return { label: "Médio", badge: "badge-darkpink" };
    if (percentual < 93.5) return { label: "Alto", badge: "badge-high" };
    return { label: "Crítico", badge: "badge-pink" };
}

export default function Dashboard() {

    const token = getToken();
    const navigate = useNavigate();
    const [indiceRisco, setIndiceRisco] = useState(0);
    const riscoArredondado = Math.round(indiceRisco);
    const nivel = getNivelExposicao(riscoArredondado);
    const [totalAtaques, setTotalAtaques] = useState(0);
    const fmt = useMemo(() => new Intl.NumberFormat("pt-BR"), []);

    useEffect(() => {
        async function carregarDados() {
            const dados = await getSeveridadeWazuh();
            const { baixo, medio, alto, critico, total } = dados;
            const risco =
                total > 0
                    ? ((baixo * 0.2 + medio * 0.6 + alto * 0.87 + critico * 1.0) / total) *
                    100
                    : 0;
            setIndiceRisco(risco);
        }
        carregarDados();
    }, []);

    return (
        <LayoutModel titulo="Home">
            <section className="grid grid-cols-12 gap-3 mb-8 items-start">
                {/* COLUNA 1 */}
                <div className="col-span-3 h-full">
                    <div className="flex flex-col h-full">
                        {/* Risk Level */}
                        <div className="cards relative overflow-hidden risk-light-effect h-[340px] p-6 rounded-2xl shadow-lg flex flex-col gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">

                            <div className="flex justify-between items-center relative z-[9999]">
                                {/* Título + ícone com tooltip */}
                                <div className="flex items-center gap-1 text-sm text-white relative group">
                                    <span>Nível de Risco</span>

                                    {/* @ts-ignore */}
                                    {/* <FaQuestionCircle className="text-purple-400 w-4 h-4 cursor-pointer" /> */}

                                    {/* Tooltip */}
                                    {/* <div className="absolute left-6 top-full mt-2 w-64 p-3 rounded-md bg-[#1a1230] text-gray-300 text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
                                        Quanto maior a porcentagem, maior o risco.
                                    </div> */}
                                </div>

                                {/* Dropdown */}
                                {/* <select className="bg-[#0700177a] text-white text-xs px-3 py-1 rounded-md border border-[#1D1929] outline-none">
                                    <option value="24h">24 horas</option>
                                    <option value="48h">48 horas</option>
                                    <option value="7d">7 dias</option>
                                </select> */}
                            </div>

                            <div className="grid grid-cols-12 items-center gap-3 relative">
                                <div className="col-span-12 flex justify-center relative">
                                    <GraficoGauge valor={Math.round(indiceRisco)}  />
                                    <img
                                        src="/assets/img/icon-risk.png"
                                        alt="Risco"
                                        className="absolute z-20 w-6 h-6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-[72%] pointer-events-none"
                                    />
                                </div>
                                {/* <div className="col-span-3 flex flex-col items-start justify-center">
                                    <span className="text-xs text-gray-400 mb-1">Nível de exposição</span>
                                    <span className={`px-3 py-1 text-xs rounded-md text-white ${nivel.badge}`}>
                                        {nivel.label}
                                    </span>
                                </div> */}
                            </div>

                            <div className="flex items-center justify-between text-[11px] mt-2 text-gray-400 w-full">
                                <div className="flex gap-3 flex-wrap">
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#1DD69A] rounded-full"></span> Baixo</div>
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#6366F1] rounded-full"></span> Médio</div>
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#A855F7] rounded-full"></span> Alto</div>
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#F914AD] rounded-full"></span> Crítico</div>
                                </div>
                                <button
                                    onClick={() => navigate("/risk-level")}
                                    className="px-2 py-1 card btn hover:bg-purple-600 text-white rounded-md transition-all duration-300"
                                >
                                    Acessar →
                                </button>
                            </div>
                        </div>

                        {/* Top Incidentes */}
                        <TopIncidentesCard token={token || ""} />
                    </div>
                </div>

                {/* COLUNA 2 */}
                <div className="col-span-6 h-full">
                    <div className="flex flex-col h-full">
                        {/* Threat Map */}
                        <div className="cards inverse flex-grow p-2 md:p-6 rounded-2xl shadow-lg card-dashboard mb-3">
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-sm text-white">Mapa de Ataque</h3>
                                <button
                                    onClick={() => navigate('/threat-map')}
                                    className="px-2 py-1 btn card text-[11px] text-white rounded-md transition-all duration-300"
                                >
                                    Ver mapa completo →
                                </button>
                            </div>
                            <GeoHitsMap />
                        </div>

                        {/* Tendência de Casos */}
                        <div className="cards relative overflow-hidden glow-bottom p-6 rounded-2xl shadow-lg card-dashboard transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                            {/* Gráfico */}
                            <IaHumans token={token || ""} />
                        </div>
                    </div>
                </div>

                {/* COLUNA 3 */}
                <div className="col-span-3 h-full">
                    <div className="flex flex-col h-full">
                        <div className="cards flex-grow p-6 rounded-2xl h-115 shadow-lg card-dashboard mb-3 transition-all hover:-translate-y-1 hover:shadow-lg">
                            <div className="grid grid-cols-12 mb-5">
                                <div className="col-span-12">
                                    <h3 className="text-sm text-white">Top 10 países de origem de ataque</h3>
                                </div> 
                                {/* <div className="col-span-4 flex items-center justify-end">
                                    <span className="text-xs text-white">4.171 ataques</span>
                                </div> */}
                            </div>
                            <TopCountriesTable
                                dias="todos"
                                limit={10}
                                onTotalChange={setTotalAtaques}
                            />
                        </div>

                        <TopFirewallCard />
                    </div>
                </div>
            </section>
        </LayoutModel >
    );
}