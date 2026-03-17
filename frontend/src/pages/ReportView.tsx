import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import LayoutModel from "../componentes/LayoutModel";
import { FiAlertTriangle, FiShield, FiTrendingUp, FiDownload, FiBarChart2, FiUsers, FiUserCheck, FiEye, FiEyeOff } from "react-icons/fi";
import { CiServer } from "react-icons/ci";
import { RiWindowsLine } from "react-icons/ri";
import { LuFolderTree } from "react-icons/lu";
import { BiCategory } from "react-icons/bi";
import { TbListDetails } from "react-icons/tb";

import GraficoGauge from "../componentes/graficos/GraficoGauge";
import GraficoDonutSimples from "../componentes/graficos/GraficoDonutSimples";
import GraficoDonutIncidentes from "../componentes/graficos/GraficoDonutIncidentes";

import { buscarRelatorioPorNome } from "../services/report-entry/report.service";
import { getStatusMeta } from "../utils/incidentes/status";
import { useTenant } from "../context/TenantContext";

import {
    formatDateBR,
    getCorBadge,
    sentenceCase,
    statusPT,
    formatCaseName,
    agruparPorSeveridade,
    detectarNivelPorNome,
} from "../utils/incidentes/helpers";

export default function ReportView() {

    function formatDateBR(date?: string) {
        if (!date) return "--";
        const d = new Date(date);
        if (isNaN(d.getTime())) return "--";
        return d.toLocaleDateString("pt-BR");
    }

    function formatBytes(bytes: number) {
        if (!bytes || bytes <= 0) return "0 B";
        const TB = 1024 ** 4;
        const GB = 1024 ** 3;
        const MB = 1024 ** 2;
        if (bytes >= TB) return (bytes / TB).toFixed(2) + " TB";
        if (bytes >= GB) return (bytes / GB).toFixed(2) + " GB";
        if (bytes >= MB) return (bytes / MB).toFixed(2) + " MB";
        return bytes + " B";
    }

    function bytesToChartValue(bytes: number) {
        if (!bytes || bytes <= 0) return 0;
        const KB = 1024;
        const MB = 1024 ** 2;
        const GB = 1024 ** 3;
        if (bytes < MB) return Math.max(1, bytes / KB);
        if (bytes < GB) return bytes / MB;
        return bytes / GB;
    }

    const [params] = useSearchParams();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [secoesVisiveis, setSecoesVisiveis] = useState<string[]>([]);
    const { tenantAtivo } = useTenant();
    const [semPermissao, setSemPermissao] = useState(false);

    const nome = params.get("nome");

    function temSecao(sec: string) {
        return (
            report?.sections?.includes(sec) &&
            secoesVisiveis.includes(sec)
        );
    }

    function toggleVisibilidadeSecao(sec: string) {
        setSecoesVisiveis(prev =>
            prev.includes(sec)
                ? prev.filter(s => s !== sec)
                : [...prev, sec]
        );
    }

    function mapNivelPorClassificationId(
        id?: number | null
    ): "Crítico" | "Alto" | "Médio" | "Baixo" {
        if (id == null) return "Baixo";
        if ([1, 2, 11, 12, 13, 25, 32, 33, 34, 35, 36].includes(id)) return "Baixo";
        if ([3, 4, 5, 14, 15, 22, 30, 31].includes(id)) return "Médio";
        if ([6, 7, 8, 9, 10, 16, 23, 26, 27, 28, 29].includes(id)) return "Alto";
        if ([17, 18, 19, 20, 21, 24].includes(id)) return "Crítico";
        return "Baixo";
    }

    function nivelDoIncidente(i: any): "Crítico" | "Alto" | "Médio" | "Baixo" {
        if (i.severity) {
            const s = i.severity.toLowerCase();
            if (s.includes("crit")) return "Crítico";
            if (s.includes("high") || s.includes("alto")) return "Alto";
            if (s.includes("med")) return "Médio";
            if (s.includes("low") || s.includes("baix")) return "Baixo";
        }
        const manual = detectarNivelPorNome(i.case_name || i.name || "");
        if (manual) return manual as any;
        const nomeCaso = (i.case_name || "").toLowerCase();
        if (nomeCaso.includes("crít")) return "Crítico";
        if (nomeCaso.includes("alto") || nomeCaso.includes("alta")) return "Alto";
        if (nomeCaso.includes("méd") || nomeCaso.includes("media")) return "Médio";
        if (nomeCaso.includes("baix")) return "Baixo";
        if (!i.classification_id) return "Médio";
        return mapNivelPorClassificationId(i.classification_id);
    }

    const cores = [
        "#F914AD", "#A855F7", "#6366F1", "#1DD69A", "#FFC857",
        "#FF7B72", "#E87DFF", "#55D7FF", "#DEB6FF", "#6EE7B7"
    ];

    const coresTopUsers = [
        "#F914AD", "#A855F7", "#6366F1", "#1DD69A", "#FFC857",
        "#FF7B72", "#E87DFF", "#55D7FF", "#DEB6FF", "#6EE7B7"
    ];

    useEffect(() => {
        setReport(null);
        setSemPermissao(false);
        setLoading(true);
    }, [tenantAtivo]);

    useEffect(() => {
        async function load() {
            try {
                if (!nome || !tenantAtivo?.cliente_name) return;
                setLoading(true);

                const rel = await buscarRelatorioPorNome(nome);

                if (rel?.tenant !== tenantAtivo.cliente_name) {
                    setSemPermissao(true);
                    setReport(null);
                    return;
                }

                setReport(rel);
                setSecoesVisiveis(rel.sections ?? []);
                setSemPermissao(false);

            } catch (err) {
                console.error(err);
                setSemPermissao(true);
                setReport(null);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [nome, tenantAtivo?.cliente_name]);

    // ─── GUARDS — devem vir ANTES de qualquer variável derivada de report ───

    if (loading) {
        return (
            <LayoutModel titulo="Relatórios">
                <div className="text-gray-300 p-10">Carregando relatório…</div>
            </LayoutModel>
        );
    }

    if (semPermissao) {
        return (
            <LayoutModel titulo="Visualização do Relatório">
                <div className="h-[40vh] flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <h2 className="text-lg text-white mb-2">Relatório indisponível</h2>
                        <p className="text-gray-400 text-sm">
                            Este relatório não pertence ao tenant atualmente selecionado
                            ou você não possui permissão para visualizá-lo.
                        </p>
                    </div>
                </div>
            </LayoutModel>
        );
    }

    if (!report) {
        return (
            <LayoutModel titulo="Visualização do Relatório">
                <div className="text-gray-300 p-10">Relatório não encontrado.</div>
            </LayoutModel>
        );
    }

    // ─── VARIÁVEIS DERIVADAS — só executam quando report existe ───

    const topAcessos = report?.snapshot?.topAcessos ?? null;
    const labels = topAcessos?.urls?.map((item: any) => item[0]) ?? [];
    const series = topAcessos?.urls?.map((item: any) => item[1]) ?? [];
    const totalOcorrencias = series.reduce((a: number, b: number) => a + b, 0);

    const topUsers = report?.snapshot?.topUsers ?? [];
    const labelsTopUsers = topUsers.map((u: any) => u.user);
    const seriesTopUsers = topUsers.map((u: any) => bytesToChartValue(u.acessos));
    const totalBytes = topUsers.reduce((acc: number, u: any) => acc + u.acessos, 0);
    const totalFormatado = formatBytes(totalBytes);

    const vuln = report?.snapshot?.vulnerabilidades ?? null;
    const riskLevel = report?.snapshot?.riskLevel ?? null;
    const incidentes = report?.snapshot?.incidentes ?? null;
    const listaIncidentes = incidentes?.lista ?? [];

    const resumoPorSeveridade = agruparPorSeveridade(listaIncidentes, nivelDoIncidente);

    const abertos = listaIncidentes.filter(
        (i: any) => (i.state_name || i.status || "").toLowerCase() === "open"
    );
    const fechados = listaIncidentes.filter(
        (i: any) => (i.state_name || i.status || "").toLowerCase() === "closed"
    );
    const atribuidos = listaIncidentes.filter(
        (i: any) => i.owner || i.assigned_to
    );
    const naoAtribuidos = listaIncidentes.filter(
        (i: any) => !i.owner && !i.assigned_to
    );

    // ─── RENDER ───

    return (
        <LayoutModel titulo="Visualização do Relatório">

            <div className="print-cover">
                <div className="cover-content">
                    <img src="../assets/img/Logo-Security-One-Positivo.png" alt="Logo" className="cover-logo" />
                    <h1>Relatório {report?.tenant}</h1>
                </div>
            </div>

            {/* ======================================= HEADER ======================================= */}
            <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617] shadow-lg no-print">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        <p className="text-gray-400 text-sm mt-1">
                            Visualização completa do relatório processado com base no período selecionado e nas seções escolhidas.
                        </p>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="no-print flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm border border-purple-400/30 transition"
                    >
                        {/* @ts-ignore */}
                        <FiDownload className="text-lg" />
                        Baixar PDF
                    </button>
                </div>
                <div className="py-3">
                    <p className="text-gray-300 text-sm">
                        <span className="text-gray-400">Período filtrado:</span> {report.period}
                    </p>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 gap-4">
                    <div className="flex flex-wrap items-center gap-2 no-print">
                        <span className="text-gray-400 text-sm">Seções exibidas:</span>
                        {(report.sections ?? []).map((sec: string, i: number) => {
                            const ativo = secoesVisiveis.includes(sec);
                            return (
                                <span
                                    key={i}
                                    onClick={() => toggleVisibilidadeSecao(sec)}
                                    className={`
                                        px-3 py-1 rounded-lg text-xs cursor-pointer select-none
                                        flex items-center gap-2 transition-all
                                        ${ativo
                                            ? "bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30"
                                            : "bg-gray-700/20 text-gray-400 border border-gray-600/30 hover:bg-gray-600/30"
                                        }
                                    `}
                                >
                                    {ativo
                                        // @ts-ignore
                                        ? <FiEye className="text-sm opacity-80" />
                                        // @ts-ignore
                                        : <FiEyeOff className="text-sm opacity-80" />
                                    }
                                    <span>{sec}</span>
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ========================== SEÇÃO 1 — TOP ACESSOS ========================== */}
            {temSecao("Top Acessos (URLs)") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617] top-acessos">
                    <div className="flex items-center gap-2 mb-3">
                        {/* @ts-ignore */}
                        <FiBarChart2 className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Top acessos</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">
                        Esta seção apresenta os principais destinos acessados pelos usuários corporativos.
                        A análise permite identificar padrões de navegação, potenciais riscos de exposição
                        a domínios suspeitos e consumo elevado de banda em aplicações não essenciais.
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
                                <div className="text-5xl font-semibold text-purple-400">{totalOcorrencias}</div>
                                <p className="text-white text-xs -mt-1">Ocorrências</p>
                            </div>
                            <p className="text-white text-center text-sm -mt-1">
                                Os 10 maiores acessos de<br /> largura de banda
                            </p>
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between mb-2 border border-white/10 py-2 px-3 bg-[#0A0617]">
                                <div className="text-gray-300 text-sm"><span className="font-medium">URL: Destino</span></div>
                                <div className="text-gray-300 text-sm cursor-pointer hover:text-white transition">Ocorrências ▾</div>
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    {labels.map((url: string, i: number) => (
                                        <tr key={i} className="border-b border-white/5">
                                            <td className="py-3 flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: cores[i] }}></span>
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

            {/* ========================== SEÇÃO 1.2 — TOP USUÁRIOS ========================== */}
            {temSecao("Top Usuários") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">
                    <div className="flex items-center gap-2 mb-3">
                        {/* @ts-ignore */}
                        <FiUsers className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Top Usuários</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">
                        Aqui são exibidos os usuários com maior consumo de banda no período analisado. O objetivo é identificar
                        comportamentos atípicos ou uso indevido dos recursos de rede, possibilitando intervenções preventivas ou ajustes de perfil de acesso.
                    </p>
                    <div className="bg-[#0F091F] border border-white/10 rounded-xl p-6 flex gap-10">
                        <div className="flex flex-col items-center justify-center min-w-[260px]">
                            <GraficoDonutSimples
                                labels={labelsTopUsers}
                                series={seriesTopUsers}
                                cores={coresTopUsers}
                                height={250}
                            />
                            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                                <div className="text-3xl font-semibold text-purple-400">{totalFormatado}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            {topUsers.map((u: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <span className="w-4 h-4 rounded-sm" style={{ backgroundColor: coresTopUsers[i] }}></span>
                                    <span className="text-gray-300">{u.user} — {formatBytes(u.acessos)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================== SEÇÃO 1.3 — TOP APLICAÇÕES ========================== */}
            {temSecao("Top Aplicações") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">
                    <div className="flex items-center gap-2 mb-3">
                        {/* @ts-ignore */}
                        <LuFolderTree className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Top Aplicações</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">
                        Mostra as aplicações mais utilizadas dentro do ambiente corporativo. Essa visão é essencial para compreender quais serviços demandam maior tráfego, avaliar riscos associados a softwares em nuvem, identificar shadow IT e otimizar o desempenho de rede.
                    </p>
                    <div className="p-5 rounded-xl bg-[#0F091F] border border-white/10">
                        <table className="w-full text-sm text-gray-300">
                            <thead className="bg-black/20 text-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-left">Aplicação</th>
                                    <th className="py-3 px-4 text-left font-semibold">Ocorrências</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(report?.snapshot?.topApps ?? []).map((item: any, i: number) => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td className="py-3 px-4 text-gray-300">{item[0]}</td>
                                        <td className="py-3 px-4 font-semibold text-gray-200">{Number(item[1]).toLocaleString("pt-BR")}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================== SEÇÃO 1.4 — TOP CATEGORIAS ========================== */}
            {temSecao("Top Categorias") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">
                    <div className="flex items-center gap-2 mb-3">
                        {/* @ts-ignore */}
                        <BiCategory className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Top Categorias</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">
                        Apresenta o agrupamento de aplicações e sites por categoria. Essa análise permite avaliar a aderência das atividades digitais às políticas corporativas e identificar possíveis vetores de risco.
                    </p>
                    <div className="overflow-auto rounded-xl border bg-[#0F091F] border-white/10 px-5 pt-5 pb-10">
                        <table className="w-full text-sm text-gray-300">
                            <thead className="bg-black/20 text-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-left">Categoria</th>
                                    <th className="py-3 px-4 text-left">Ocorrências</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(report?.snapshot?.topCategorias ?? []).map((cat: any, i: number) => {
                                    const nomeCat = cat[0] || "N/A";
                                    const valor = Number(cat[1] ?? 0);
                                    return (
                                        <tr key={i} className="border-b border-white/5">
                                            <td className="py-3 px-4 text-gray-300">{nomeCat}</td>
                                            <td className="py-3 px-4 text-gray-400">{valor.toLocaleString("pt-BR")}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================== SEÇÃO 1.5 — TOP USUÁRIOS POR APLICAÇÃO ========================== */}
            {temSecao("Top Usuários por Volume de Aplicação") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">
                    <div className="flex items-center gap-2 mb-3">
                        {/* @ts-ignore */}
                        <FiUserCheck className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Top Usuários por Volume de Aplicação</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">
                        Mostra o detalhamento dos usuários que mais consomem aplicações específicas, com origem, destino e volume trafegado.
                    </p>
                    <div className="p-5 rounded-xl bg-[#0F091F] border border-white/10">
                        <table className="w-full text-sm text-gray-300">
                            <thead className="bg-black/20 text-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-left">Usuário</th>
                                    <th className="py-3 px-4 text-left">Aplicação</th>
                                    <th className="py-3 px-4 text-left">Volume de Dados</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(report?.snapshot?.topUsuariosAplicacao ?? []).map((item: any, i: number) => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td className="py-3 px-4">{item.user}</td>
                                        <td className="py-3 px-4">{item.application}</td>
                                        <td className="py-3 px-4">{item.total_bytes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================== SEÇÃO 1.6 — TOP ACESSO DETALHADO ========================== */}
            {temSecao("Top Acesso Detalhado") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">
                    <div className="flex items-center gap-2 mb-3">
                        {/* @ts-ignore */}
                        <TbListDetails className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Top Acesso Detalhado</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">
                        Esta seção apresenta os principais destinos acessados pelos usuários corporativos com detalhamento por aplicação, categoria e volume.
                    </p>
                    <div className="p-5 rounded-xl bg-[#0F091F] border border-white/10 overflow-auto">
                        <table className="w-full text-sm text-gray-300">
                            <thead className="bg-black/20 text-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-left">#</th>
                                    <th className="py-3 px-4 text-left">Aplicação</th>
                                    <th className="py-3 px-4 text-left">Categoria</th>
                                    <th className="py-3 px-4 text-left">Usuário</th>
                                    <th className="py-3 px-4 text-left">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(report?.snapshot?.topAcessoDetalhado ?? []).map((item: any, i: number) => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td className="py-3 px-4">{item["#"]}</td>
                                        <td className="py-3 px-4">{item.application}</td>
                                        <td className="py-3 px-4">{item.category}</td>
                                        <td className="py-3 px-4">{item.user}</td>
                                        <td className="py-3 px-4">{item.total_bytes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                    <p className="text-gray-400 text-sm mb-6">Visão geral do nível de risco do ambiente.</p>
                    <div className="h-[260px] bg-[#0F091F] rounded-xl border border-white/10 flex flex-col items-center justify-center gap-3">
                        <div className="flex justify-center items-center">
                            <GraficoGauge valor={riskLevel?.gauge ?? 0} />
                        </div>
                        <div className="flex justify-center text-[10px] text-gray-400 w-full">
                            <div className="flex gap-4 flex-wrap justify-center">
                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#1DD69A] rounded-xs"></span> Baixo</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#6366F1] rounded-xs"></span> Médio</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#A855F7] rounded-xs"></span> Alto</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#F914AD] rounded-xs"></span> Crítico</span>
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
                    <p className="text-gray-400 text-sm mb-6">Mostra o total de vulnerabilidades identificadas.</p>
                    <div className="p-5 rounded-xl bg-[#0F091F] border border-white/10">
                        <div className="text-purple-400 text-4xl font-semibold mb-1">{vuln?.Total ?? 0}</div>
                        <p className="text-gray-400 text-sm mb-6">Alertas totais</p>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-4">
                            {[
                                { label: "Crítico", value: vuln?.Critical ?? 0, bg: "bg-[#F914AD]/20", text: "text-[#F914AD]", border: "border-[#F914AD]/40" },
                                { label: "Alto", value: vuln?.High ?? 0, bg: "bg-[#A855F7]/20", text: "text-[#A855F7]", border: "border-[#A855F7]/40" },
                                { label: "Médio", value: vuln?.Medium ?? 0, bg: "bg-[#6366F1]/20", text: "text-[#6366F1]", border: "border-[#6366F1]/40" },
                                { label: "Baixo", value: vuln?.Low ?? 0, bg: "bg-[#1DD69A]/20", text: "text-[#1DD69A]", border: "border-[#1DD69A]/40" },
                                { label: "Pendente", value: vuln?.Pending ?? 0, bg: "bg-gray-500/20", text: "text-gray-400", border: "border-gray-600/40" },
                            ].map((item, i) => (
                                <div key={i} className="cards rounded-xl p-4 border border-white/10 bg-[#12121a] flex flex-col">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs text-gray-400">Severidade</span>
                                        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${item.bg} ${item.text} border ${item.border}`}>
                                            {item.label}
                                        </span>
                                    </div>
                                    <div className="text-white text-3xl font-semibold mb-1">{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ========================== SEÇÃO 4 — TOP HOSTS ========================== */}
            {temSecao("Top Hosts por Nível de Alertas") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">
                    <div className="flex items-center gap-2 mb-4">
                        {/* @ts-ignore */}
                        <FiTrendingUp className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">TOP Hosts por nível de alertas</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">Lista dos ativos com maior quantidade de alertas.</p>
                    <div className="overflow-auto rounded-xl border bg-[#0F091F] border-white/10 px-5 pt-5 pb-10">
                        <table className="w-full text-sm text-gray-300">
                            <thead className="bg-black/20 text-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-left">Host</th>
                                    <th className="py-3 px-4 text-left text-[#F914AD] font-semibold">Crítico</th>
                                    <th className="py-3 px-4 text-left text-[#A855F7] font-semibold">Alto</th>
                                    <th className="py-3 px-4 text-left text-[#6366F1] font-semibold">Médio</th>
                                    <th className="py-3 px-4 text-left text-[#1DD69A] font-semibold">Baixo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(report?.snapshot?.topHosts ?? []).map((h: any, i: number) => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td className="py-3 px-4">{h.host}</td>
                                        <td className="py-3 px-4">{h.critico}</td>
                                        <td className="py-3 px-4">{h.alto}</td>
                                        <td className="py-3 px-4">{h.medio}</td>
                                        <td className="py-3 px-4">{h.baixo}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================== SEÇÃO 5 — CIS SCORE ========================== */}
            {temSecao("Segurança dos Servidores (CIS Score)") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">
                    <div className="flex items-center gap-2 mb-4">
                        {/* @ts-ignore */}
                        <CiServer className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Nível de segurança dos servidores</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">
                        Exibe a avaliação do nível de proteção e conformidade dos servidores monitorados.
                    </p>
                    <div className="flex justify-center text-[10px] text-gray-400 w-full mb-5">
                        <div className="flex gap-4 flex-wrap justify-center">
                            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#1DD69A] rounded-xs"></span> Baixo</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#6366F1] rounded-xs"></span> Médio</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#A855F7] rounded-xs"></span> Alto</span>
                            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#F914AD] rounded-xs"></span> Crítico</span>
                        </div>
                    </div>
                    <div className="p-5 rounded-xl bg-[#0F091F] border border-white/10">
                        <table className="w-full text-sm text-gray-300">
                            <thead className="bg-black/20 text-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-left">Host</th>
                                    <th className="py-3 px-4 text-left">Score CIS (%)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(report?.snapshot?.cisHosts ?? []).map((item: any, i: number) => {
                                    const getScoreColor = (score: number) => {
                                        if (score < 25) return "#F914AD";
                                        if (score < 40) return "#A855F7";
                                        if (score < 60) return "#6366F1";
                                        return "#1DD69A";
                                    };
                                    const cor = getScoreColor(item.score);
                                    return (
                                        <tr key={i} className="border-b border-white/5">
                                            <td className="py-3 px-4 text-gray-300">{item.host}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-1 h-2 rounded-full bg-[#1b1530] overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-300"
                                                            style={{ width: `${item.score}%`, backgroundColor: cor }}
                                                        ></div>
                                                    </div>
                                                    <span className="w-10 text-right font-semibold" style={{ color: cor }}>
                                                        {item.score}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================== SEÇÃO — TOP OS ========================== */}
            {temSecao("Top 5 Sistemas Operacionais Detectados") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">
                    <div className="flex items-center gap-2 mb-4">
                        {/* @ts-ignore */}
                        <RiWindowsLine className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Top 5 Sistemas Operacionais Detectados</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">
                        Apresenta os sistemas operacionais predominantes no ambiente, permitindo entender o perfil tecnológico e avaliar riscos associados a versões desatualizadas ou fora de suporte.
                    </p>
                    <div className="p-5 rounded-xl bg-[#0F091F] border border-white/10">
                        <table className="w-full text-sm text-gray-300">
                            <thead className="bg-black/20 text-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-left">Sistema Operacional</th>
                                    <th className="py-3 px-4 text-left font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(report?.snapshot?.topOS ?? []).map((item: any, i: number) => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td className="py-3 px-4 text-gray-400">{item.os}</td>
                                        <td className="py-3 px-4">
                                            <span className="text-gray-400 font-semibold">{item.total}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================== SEÇÃO — TOP HOSTS ALTERAÇÕES ========================== */}
            {temSecao("Top Hosts por Alteração de Arquivos") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">
                    <div className="flex items-center gap-2 mb-4">
                        {/* @ts-ignore */}
                        <RiWindowsLine className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Top Hosts por Alteração de Arquivos</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">
                        Lista dos hosts com maior número de modificações, adições ou deleções de arquivos.
                    </p>
                    <div className="p-5 rounded-xl bg-[#0F091F] border border-white/10">
                        <table className="w-full text-sm text-gray-300">
                            <thead className="bg-black/20 text-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-left">Agente</th>
                                    <th className="py-3 px-4 text-left">Modificados</th>
                                    <th className="py-3 px-4 text-left">Adicionados</th>
                                    <th className="py-3 px-4 text-left">Deletados</th>
                                    <th className="py-3 px-4 text-left font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(report?.snapshot?.topHostsAlteracoes ?? []).map((item: any, i: number) => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td className="py-3 px-4 text-gray-400">{item.host}</td>
                                        <td className="py-3 px-4 text-gray-400">{item.modified}</td>
                                        <td className="py-3 px-4 text-gray-400">{item.added}</td>
                                        <td className="py-3 px-4 text-gray-400">{item.deleted}</td>
                                        <td className="py-3 px-4">
                                            <span className="text-gray-300 font-semibold">{item.total}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================== SEÇÃO — TOP HOSTS ORIGEM ========================== */}
            {temSecao("Top Hosts Alterados por Origem da Alteração") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">
                    <div className="flex items-center gap-2 mb-4">
                        {/* @ts-ignore */}
                        <RiWindowsLine className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Top Hosts Alterados por Origem da Alteração</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">
                        Apresenta a origem das alterações em cada host afetado, apoiando auditorias forenses e rastreabilidade.
                    </p>
                    <div className="p-5 rounded-xl bg-[#0F091F] border border-white/10">
                        <table className="w-full text-sm text-gray-300">
                            <thead className="bg-black/20 text-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-left">Usuário</th>
                                    <th className="py-3 px-4 text-left">ID do Host</th>
                                    <th className="py-3 px-4 text-left">Nome do Host</th>
                                    <th className="py-3 px-4 text-left">Contagem</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(report?.snapshot?.topHostsOrigem ?? []).map((item: any, i: number) => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td className="py-3 px-4">{item.usuario}</td>
                                        <td className="py-3 px-4">{item.agent_id}</td>
                                        <td className="py-3 px-4">{item.host}</td>
                                        <td className="py-3 px-4">{item.contagem}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================== SEÇÃO — RESUMO AÇÕES ========================== */}
            {temSecao("Resumo de Ações nos Arquivos") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">
                    <div className="flex items-center gap-2 mb-4">
                        {/* @ts-ignore */}
                        <RiWindowsLine className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Resumo de Ações nos Arquivos</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">
                        Consolida o total de arquivos adicionados, modificados e deletados no período analisado.
                    </p>
                    <div className="p-5 rounded-xl bg-[#0F091F] border border-white/10">
                        <table className="w-full text-sm text-gray-300">
                            <thead className="bg-black/20 text-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-left">Ação</th>
                                    <th className="py-3 px-4 text-left">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-white/5">
                                    <td className="py-3 px-4">Modificado</td>
                                    <td className="py-3 px-4">{report?.snapshot?.resumoAcoes?.modificados ?? 0}</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-3 px-4">Adicionado</td>
                                    <td className="py-3 px-4">{report?.snapshot?.resumoAcoes?.adicionados ?? 0}</td>
                                </tr>
                                <tr className="border-b border-white/5">
                                    <td className="py-3 px-4">Deletado</td>
                                    <td className="py-3 px-4">{report?.snapshot?.resumoAcoes?.deletados ?? 0}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================== SEÇÃO — INCIDENTES ========================== */}
            {temSecao("Incidentes") && incidentes && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">
                    <div className="flex items-center gap-2 mb-4">
                        {/* @ts-ignore */}
                        <FiAlertTriangle className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Incidentes</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">
                        Visão consolidada dos incidentes registrados no período selecionado,
                        incluindo status, atribuição e eventos mais recentes.
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <GraficoDonutIncidentes
                            titulo="Incidentes abertos"
                            total={abertos.length}
                            valores={agruparPorSeveridade(abertos, nivelDoIncidente)}
                            onFiltrarPorNivel={() => { }}
                        />
                        <GraficoDonutIncidentes
                            titulo="Incidentes fechados"
                            total={fechados.length}
                            valores={agruparPorSeveridade(fechados, nivelDoIncidente)}
                            onFiltrarPorNivel={() => { }}
                        />
                        <GraficoDonutIncidentes
                            titulo="Incidentes atribuídos"
                            total={atribuidos.length}
                            valores={agruparPorSeveridade(atribuidos, nivelDoIncidente)}
                            onFiltrarPorNivel={() => { }}
                        />
                        <GraficoDonutIncidentes
                            titulo="Incidentes não atribuídos"
                            total={naoAtribuidos.length}
                            valores={agruparPorSeveridade(naoAtribuidos, nivelDoIncidente)}
                            onFiltrarPorNivel={() => { }}
                        />
                    </div>

                    <div className="p-5 rounded-xl bg-[#0F091F] border border-white/10">
                        <h4 className="text-white text-sm font-medium mb-4">Últimos 5 incidentes</h4>
                        <table className="w-full text-sm text-gray-300">
                            <thead className="bg-black/20 text-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-left">Incidente</th>
                                    <th className="py-3 px-4 text-left">Severidade</th>
                                    <th className="py-3 px-4 text-left">Status</th>
                                    <th className="py-3 px-4 text-left">Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(incidentes.ultimos ?? []).map((inc: any, i: number) => {
                                    const nivel = nivelDoIncidente(inc);
                                    const badge = getCorBadge(nivel);
                                    const meta = getStatusMeta(inc.state_name ?? inc.status);
                                    const StatusIcon = meta.Icon;
                                    return (
                                        <tr key={i} className="border-b border-white/5">
                                            <td className="py-3 px-4 text-gray-300">
                                                {formatCaseName(inc.case_name || inc.name || "—")}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`text-[11px] px-2 py-0.5 rounded-md badge ${badge}`}>
                                                    {sentenceCase(nivel)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="inline-flex items-center justify-center gap-1 text-xs text-gray-400">
                                                    {/* @ts-ignore */}
                                                    <StatusIcon className={`w-4 h-4 ${meta.color}`} />{meta.label}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                {formatDateBR(
                                                    inc.case_open_date ??
                                                    inc.created_at ??
                                                    inc.start_date
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

        </LayoutModel>
    );
}