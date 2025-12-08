import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import LayoutModel from "../componentes/LayoutModel";
import { FiAlertTriangle, FiShield, FiTrendingUp, FiDownload, FiBarChart2 } from "react-icons/fi";

import GraficoGauge from "../componentes/graficos/GraficoGauge";
import GraficoDonutSimples from "../componentes/graficos/GraficoDonutSimples";

import { buscarRelatorioPorNome } from "../services/report-entry/report.service";

export default function ReportView() {

    const [params] = useSearchParams();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const nome = params.get("nome");

    // Função auxiliar para exibir somente as seções escolhidas
    function temSecao(sec: string) {
        return report?.sections?.includes(sec);
    }

    const labels = [
        "/",
        "/favicon.ico",
        "/prints-adm-contas/print_atual.png",
        "/prints-chamados/print_atual.png",
        "/prints-chamados/",
        "/prints-adm-contas/print_atual.png?ver=1762165039799",
        "/prints-adm-contas/print_atual.png?ver=1762165040040",
        "/prints-adm-contas/print_atual.png?ver=1762165099782",
        "/prints-adm-contas/print_atual.png?ver=1762165100085",
        "/prints-adm-contas/print_atual.png?ver=1762165159680",
    ];

    const series = [9, 8, 4, 3, 2, 1, 1, 1, 1, 1];

    const cores = [
        "#F914AD", "#A855F7", "#6366F1", "#1DD69A", "#FFC857",
        "#FF7B72", "#E87DFF", "#55D7FF", "#DEB6FF", "#6EE7B7"
    ];

    useEffect(() => {
        async function load() {
            try {
                if (!nome) return;
                const rel = await buscarRelatorioPorNome(nome);
                setReport(rel);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [nome]);

    if (loading) {
        return (
            <LayoutModel titulo="Relatórios">
                <div className="text-gray-300 p-10">Carregando relatório…</div>
            </LayoutModel>
        );
    }

    if (!report) {
        return (
            <LayoutModel titulo="Relatórios">
                <div className="text-gray-300 p-10">Relatório não encontrado.</div>
            </LayoutModel>
        );
    }

    const vuln = report?.snapshot?.vulnerabilidades ?? null;

    return (
        <LayoutModel titulo="Relatórios">

            {/* =======================================
                HEADER DO RELATÓRIO 
            ======================================== */}
            <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617] shadow-lg">

                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-white text-xl font-medium">{report.nome}</h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Visualização completa do relatório processado com base no período selecionado e nas seções escolhidas.
                        </p>
                    </div>

                    <button
                        onClick={() => window.print()}
                        className="
                            no-print
                            flex items-center gap-2
                            px-4 py-2
                            rounded-lg
                            bg-purple-600 hover:bg-purple-700
                            text-white text-sm
                            border border-purple-400/30
                            transition
                        "
                    >
                        {/* @ts-ignore */}
                        <FiDownload className="text-lg" />
                        Baixar PDF
                    </button>
                </div>

                {/* PERÍODO / SEÇÕES */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 gap-4">

                    <div>
                        <p className="text-gray-300 text-sm">
                            <span className="text-gray-400">Período filtrado:</span> {report.period}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 no-print">
                        <span className="text-gray-400 text-sm">Seções exibidas:</span>
                        {/* @ts-ignore */}
                        {report.sections.map((sec, i) => (
                            <span
                                key={i}
                                className="px-3 py-1 rounded-lg text-xs bg-purple-600/20 text-purple-300 border border-purple-500/30"
                            >
                                {sec}
                            </span>
                        ))}
                    </div>

                </div>
            </div>


            {/* ========================== SEÇÃO 1 — TOP ACESSOS (sempre estática por enquanto) ========================== */}
            {temSecao("Top Acessos (URLs)") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">

                    <div className="flex items-center gap-2 mb-3">
                        {/* @ts-ignore */}
                        <FiBarChart2 className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Top acessos</h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Esta seção apresenta os principais destinos acessados pelos usuários corporativos.
                    </p>

                    <div className="bg-[#0F091F] border border-white/10 rounded-xl p-6 flex gap-10">

                        <div className="flex flex-col items-center justify-center min-w-[260px]">
                            <GraficoDonutSimples
                                labels={labels}
                                series={series}
                                cores={cores}
                                height={260}
                            />

                            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                                <div className="text-5xl font-semibold text-purple-400">
                                    31
                                </div>
                                <p className="text-white text-xs -mt-1">Ocorrências</p>
                            </div>
                            <p className="text-white text-center text-sm -mt-1">
                                Os 10 maiores acessos de<br /> largura de banda
                            </p>
                        </div>

                        {/* LISTA */}
                        <div className="flex-1">
                            <div className="flex justify-between mb-2 border border-white/10 py-2 px-3 bg-[#0A0617]">
                                <div className="text-gray-300 text-sm">
                                    <span className="font-medium">URL: Destino</span>
                                </div>
                                <div className="text-gray-300 text-sm cursor-pointer hover:text-white transition">
                                    Ocorrências ▾
                                </div>
                            </div>

                            <table className="w-full text-sm">
                                <tbody>
                                    {labels.map((url, i) => (
                                        <tr key={i} className="border-b border-white/5">
                                            <td className="py-3 flex items-center gap-2">
                                                <span
                                                    className="w-3 h-3 rounded-sm"
                                                    style={{ backgroundColor: cores[i] }}
                                                ></span>
                                                <span className="text-gray-300">{url}</span>
                                            </td>
                                            <td className="py-3 text-gray-400 min-w-[110px] text-right">
                                                {series[i]} ocorrência{series[i] > 1 ? "s" : ""}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                        </div>

                    </div>
                </div>
            )}


            {/* ========================== SEÇÃO 2 — NÍVEL DE RISCO ========================== */}
            {temSecao("Nível de Risco") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">

                    <div className="flex items-center gap-2 mb-4">
                        {/* @ts-ignore */}
                        <FiAlertTriangle className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Nível de Risco</h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Visão geral do nível de risco do ambiente.
                    </p>

                    <div className="h-[260px] bg-[#0F091F] rounded-xl border border-white/10 flex flex-col items-center justify-center gap-3">

                        <div className="flex justify-center items-center">
                            <GraficoGauge valor={82} />
                        </div>

                        <div className="flex justify-center text-[10px] text-gray-400 w-full">
                            <div className="flex gap-4 flex-wrap justify-center">
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 bg-[#1DD69A] rounded-xs"></span> Baixo
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 bg-[#6366F1] rounded-xs"></span> Médio
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 bg-[#A855F7] rounded-xs"></span> Alto
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-3 h-3 bg-[#F914AD] rounded-xs"></span> Crítico
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================== SEÇÃO 3 — VULNERABILIDADES ========================== */}
            {temSecao("Vulnerabilidades Detectadas") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">

                    <div className="flex items-center gap-2 mb-4">
                        {/* @ts-ignore */}
                        <FiShield className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Detecção de Vulnerabilidades</h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Mostra o total de vulnerabilidades identificadas.
                    </p>

                    <div className="p-5 rounded-xl bg-[#0F091F] border border-white/10">

                        <div className="text-purple-400 text-4xl font-semibold mb-1">
                            {vuln?.Total ?? 0}
                        </div>
                        <p className="text-gray-400 text-sm mb-6">Alertas totais</p>

                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">

                            {/* Crítico */}
                            <div className="cards rounded-xl p-4 border border-white/10 bg-[#12121a] flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-400">Severidade</span>
                                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-[#F914AD]/20 text-[#F914AD] border border-[#F914AD]/40">
                                        Crítico
                                    </span>
                                </div>

                                <div className="text-white text-3xl font-semibold mb-1">
                                    {vuln?.Critical ?? 0}
                                </div>
                            </div>

                            {/* Alto */}
                            <div className="cards rounded-xl p-4 border border-white/10 bg-[#12121a] flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-400">Severidade</span>
                                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-[#A855F7]/20 text-[#A855F7] border border-[#A855F7]/40">
                                        Alto
                                    </span>
                                </div>

                                <div className="text-white text-3xl font-semibold mb-1">
                                    {vuln?.High ?? 0}
                                </div>
                            </div>

                            {/* Médio */}
                            <div className="cards rounded-xl p-4 border border-white/10 bg-[#12121a] flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-400">Severidade</span>
                                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-[#6366F1]/20 text-[#6366F1] border border-[#6366F1]/40">
                                        Médio
                                    </span>
                                </div>

                                <div className="text-white text-3xl font-semibold mb-1">
                                    {vuln?.Medium ?? 0}
                                </div>
                            </div>

                            {/* Baixo */}
                            <div className="cards rounded-xl p-4 border border-white/10 bg-[#12121a] flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-400">Severidade</span>
                                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-[#1DD69A]/20 text-[#1DD69A] border border-[#1DD69A]/40">
                                        Baixo
                                    </span>
                                </div>

                                <div className="text-white text-3xl font-semibold mb-1">
                                    {vuln?.Low ?? 0}
                                </div>
                            </div>

                            {/* Pendente */}
                            <div className="cards rounded-xl p-4 border border-white/10 bg-[#12121a] flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-400">Severidade</span>
                                    <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-gray-500/20 text-gray-400 border border-gray-600/40">
                                        Pendente
                                    </span>
                                </div>

                                <div className="text-white text-3xl font-semibold mb-1">
                                    {vuln?.Pending ?? 0}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================== SEÇÃO 4 — TOP HOSTS ========================== */}
            {temSecao("Top Hosts por nível de alertas") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">

                    <div className="flex items-center gap-2 mb-4">
                        {/* @ts-ignore */}
                        <FiTrendingUp className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">TOP Hosts por nível de alertas</h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Lista dos ativos com maior quantidade de alertas.
                    </p>

                    <div className="overflow-auto rounded-xl border bg-[#0F091F] border-white/10 px-5 pt-5 pb-10">

                        <table className="w-full text-sm text-gray-300">
                            <thead className="bg-black/20 text-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-left">Host</th>
                                    <th className="py-3 px-4 text-left text-[#1DD69A] font-semibold">Baixo</th>
                                    <th className="py-3 px-4 text-left text-[#6366F1] font-semibold">Médio</th>
                                    <th className="py-3 px-4 text-left text-[#A855F7] font-semibold">Alto</th>
                                    <th className="py-3 px-4 text-left text-[#F914AD] font-semibold">Crítico</th>
                                    <th className="py-3 px-4 text-left">Score</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr className="border-b border-white/5">
                                    <td className="py-3 px-4">NB-SRV-01</td>
                                    <td className="py-3 px-4">9128</td>
                                    <td className="py-3 px-4">8</td>
                                    <td className="py-3 px-4">0</td>
                                    <td className="py-3 px-4">0</td>
                                    <td className="py-3 px-4">20%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>
            )}

        </LayoutModel>
    );
}
