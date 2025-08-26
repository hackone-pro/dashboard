// src/pages/Dashboard.tsx
import { useNavigate } from "react-router-dom";
import LayoutModel from "../componentes/LayoutModel";
import GeoHitsMap from '../componentes/graficos/GeoHitsMap';
import GraficoGauge from '../componentes/graficos/GraficoGauge';
import GraficoBarraEmpilhadaHorizontal from "../componentes/graficos/GraficoBarraEmpilhadaHorizontal";
import { FaQuestionCircle } from "react-icons/fa";

//Utils
import { getToken } from '../utils/auth';

//Components
import TopIncidentesCard from "../componentes/iris/TopIncidents";
import IaHumans from "../componentes/iris/IaHumans";

interface Incidente {
    case_id: number;
    case_name: string;
    case_description: string;
    case_open_date: string;
    classification_id: number;
    classification: string;
    opened_by: string;
}

export default function Dashboard() {

    const token = getToken();
    const navigate = useNavigate();

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
                                    <span>Risk Level</span>

                                    {/* @ts-ignore */}
                                    <FaQuestionCircle className="text-purple-400 w-4 h-4 cursor-pointer" />

                                    {/* Tooltip */}
                                    <div className="absolute left-6 top-full mt-2 w-64 p-3 rounded-md bg-[#1a1230] text-gray-300 text-xs shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50">
                                        Indicador geral do nível de exposição da organização nas últimas 24 horas,
                                        calculado com base no volume e criticidade dos alertas. Quanto maior a porcentagem, maior o risco.
                                    </div>
                                </div>

                                {/* Dropdown */}
                                {/* <select className="bg-[#0700177a] text-white text-xs px-3 py-1 rounded-md border border-[#1D1929] outline-none">
                                    <option value="24h">24 horas</option>
                                    <option value="48h">48 horas</option>
                                    <option value="7d">7 dias</option>
                                </select> */}
                            </div>

                            <div className="grid grid-cols-12 items-center gap-3 relative">
                                <div className="col-span-9 flex justify-center relative">
                                    <GraficoGauge valor={82} cor="#B832F6" />
                                    <img
                                        src="/assets/img/icon-risk.png"
                                        alt="Risco"
                                        className="absolute z-20 w-6 h-6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-[72%] pointer-events-none"
                                    />
                                </div>
                                <div className="col-span-3 flex flex-col items-start justify-center">
                                    <span className="text-xs text-gray-400 mb-1">Nível de exposição</span>
                                    <span className="px-3 py-1 text-xs rounded-md badge-pink text-white">Crítico</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] mt-2 text-gray-400 w-full">
                                <div className="flex gap-3 flex-wrap">
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full"></span> Baixo</div>
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-yellow-400 rounded-full"></span> Médio</div>
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-500 rounded-full"></span> Alto</div>
                                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-pink-500 rounded-full"></span> Crítico</div>
                                </div>
                                <button className="px-2 py-1 btn hover:bg-purple-600 text-white rounded-md">Acessar →</button>
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
                                <h3 className="text-sm text-white">Threat Map</h3>
                                <button
                                    onClick={() => navigate('/threat-map')}
                                    className="px-2 py-1 btn hover:bg-purple-600 text-[11px] text-white rounded-md"
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
                                <div className="col-span-8">
                                    <h3 className="text-sm text-white">Top 10 países que mais originam ataques</h3>
                                </div> <div className="col-span-4 flex items-center justify-end">
                                    <span className="text-xs text-white">4.171 ataques</span>
                                </div>
                            </div>

                            <table className="w-full text-sm text-left text-gray-400">

                                <tbody>
                                    {[
                                        { pais: "Estados Unidos", ataques: 920 },
                                        { pais: "Rússia", ataques: 743 },
                                        { pais: "China", ataques: 651 },
                                        { pais: "Brasil", ataques: 412 },
                                        { pais: "Índia", ataques: 398 },
                                        { pais: "Alemanha", ataques: 365 },
                                        { pais: "França", ataques: 289 },
                                        { pais: "Irã", ataques: 273 },
                                        { pais: "Reino Unido", ataques: 221 },
                                        { pais: "Turquia", ataques: 199 },
                                    ].map((item, i) => (
                                        <tr key={i}>
                                            <td className="py-2">{item.pais}</td>
                                            <td className="py-2 text-right">{item.ataques}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="cards flex-grow p-6 rounded-2xl shadow-lg card-dashboard transition-all hover:-translate-y-1 hover:shadow-lg">
                            <div className="grid grid-cols-12 mb-5">
                                <div className="col-span-8">
                                    <h3 className="text-sm text-white">Top 5 Firewall geradores de alertas</h3>
                                </div>
                                <div className="col-span-4 flex items-center justify-end">
                                    <select
                                        className="bg-[#0d0c22] text-white text-xs px-2 py-1 rounded-sm border border-[#1D1929]">
                                        <option value={1}>24 horas</option>
                                        <option value={7}>7 dias</option>
                                        <option value={15}>15 dias</option>
                                        <option value={30}>30 dias</option>
                                    </select>
                                </div>
                            </div>
                            <GraficoBarraEmpilhadaHorizontal />

                        </div>
                    </div>
                </div>
            </section>
        </LayoutModel >
    );
}