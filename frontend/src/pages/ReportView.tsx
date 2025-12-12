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

        if (bytes < MB) return Math.max(1, bytes / KB); // KB (mínimo > 0)
        if (bytes < GB) return bytes / MB;              // MB
        return bytes / GB;                              // GB
    }


    const [params] = useSearchParams();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [secoesVisiveis, setSecoesVisiveis] = useState<string[]>([]);

    const nome = params.get("nome");

    // Função auxiliar para exibir somente as seções escolhidas
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
        // 1️⃣ severidade direta da API
        if (i.severity) {
            const s = i.severity.toLowerCase();
            if (s.includes("crit")) return "Crítico";
            if (s.includes("high") || s.includes("alto")) return "Alto";
            if (s.includes("med")) return "Médio";
            if (s.includes("low") || s.includes("baix")) return "Baixo";
        }

        // 2️⃣ severidade detectada no título (IA)
        const manual = detectarNivelPorNome(i.case_name || i.name || "");
        if (manual) return manual as any;

        // 3️⃣ fallback textual no nome
        const nome = (i.case_name || "").toLowerCase();
        if (nome.includes("crít")) return "Crítico";
        if (nome.includes("alto") || nome.includes("alta")) return "Alto";
        if (nome.includes("méd") || nome.includes("media")) return "Médio";
        if (nome.includes("baix")) return "Baixo";

        // 4️⃣ fallback final
        if (!i.classification_id) return "Médio";

        return mapNivelPorClassificationId(i.classification_id);
    }


    const topAcessos = report?.snapshot?.topAcessos ?? null;

    const labels = topAcessos?.urls?.map((item: any) => item[0]) ?? [];
    const series = topAcessos?.urls?.map((item: any) => item[1]) ?? [];

    const totalOcorrencias = series.reduce((a: number, b: number) => a + b, 0);

    const cores = [
        "#F914AD", "#A855F7", "#6366F1", "#1DD69A", "#FFC857",
        "#FF7B72", "#E87DFF", "#55D7FF", "#DEB6FF", "#6EE7B7"
    ];

    //--------------------------TOP USERS-------------------------//
    const topUsers = report?.snapshot?.topUsers ?? [];
    const labelsTopUsers = topUsers.map((u: any) => u.user);

    // Gráfico com números inteiros
    const seriesTopUsers = topUsers.map((u: any) =>
        bytesToChartValue(u.acessos)
    );


    // Total real para mostrar no centro
    const totalBytes = topUsers.reduce((acc: number, u: any) => acc + u.acessos, 0);
    const totalFormatado = formatBytes(totalBytes);

    // cores padrão
    const coresTopUsers = [
        "#F914AD", "#A855F7", "#6366F1", "#1DD69A", "#FFC857",
        "#FF7B72", "#E87DFF", "#55D7FF", "#DEB6FF", "#6EE7B7"
    ];
    //-------------------------

    useEffect(() => {
        async function load() {
            try {
                if (!nome) return;
                const rel = await buscarRelatorioPorNome(nome);
                setReport(rel);
                setSecoesVisiveis(rel.sections ?? []);
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
    const riskLevel = report?.snapshot?.riskLevel ?? null;
    const incidentes = report?.snapshot?.incidentes ?? null;
    const listaIncidentes = incidentes?.lista ?? [];

    const resumoPorSeveridade = agruparPorSeveridade(
        listaIncidentes,
        nivelDoIncidente
    );

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



    return (
        <LayoutModel titulo="Relatórios">

            <div className="print-cover">
                <div className="cover-content">
                    <img src="../assets/img/Logo-Security-One-Positivo.png" alt="Logo" className="cover-logo" />
                    <h1>Relatório {report?.tenant}</h1>
                    {/* <p>Período Filtrado: {report.period}</p> */}
                </div>
            </div>

            {/* =======================================
                HEADER DO RELATÓRIO 
            ======================================== */}
            <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617] shadow-lg no-print">
                <div className="flex items-start justify-between flex-wrap gap-4">
                    <div>
                        {/* <h2 className="text-white text-xl font-medium">{report.nome}</h2> */}
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
                <div className="py-3">
                    <p className="text-gray-300 text-sm">
                        <span className="text-gray-400">Período filtrado:</span> {report.period}
                    </p>
                </div>
                {/* PERÍODO / SEÇÕES */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 gap-4">
                    <div className="flex flex-wrap items-center gap-2 no-print">
                        <span className="text-gray-400 text-sm">Seções exibidas:</span>
                        {/* @ts-ignore */}
                        {report.sections.map((sec, i) => {
                            const ativo = secoesVisiveis.includes(sec);

                            return (
                                <span
                                    key={i}
                                    onClick={() => toggleVisibilidadeSecao(sec)}
                                    className={`
        px-3 py-1 rounded-lg text-xs cursor-pointer select-none
        flex items-center gap-2
        transition-all
        ${ativo
                                            ? "bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30"
                                            : "bg-gray-700/20 text-gray-400 border border-gray-600/30 hover:bg-gray-600/30"
                                        }
      `}
                                >
                                    {/* ÍCONE DE ESTADO */}
                                    {ativo ? (
                                        <FiEye className="text-sm opacity-80" />
                                    ) : (
                                        <FiEyeOff className="text-sm opacity-80" />
                                    )}

                                    {/* NOME DA SEÇÃO */}
                                    <span>{sec}</span>
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>


            {/* ========================== SEÇÃO 1 — TOP ACESSOS (sempre estática por enquanto) ========================== */}
            {temSecao("Top Acessos (URLs)") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617] top-acessos">

                    <div className="flex items-center gap-2 mb-3">
                        <FiBarChart2 className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Top acessos</h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Esta seção apresenta os principais destinos acessados pelos usuários corporativos.
                        A análise permite identificar padrões de navegação, potenciais riscos de exposição
                        a domínios suspeitos e consumo elevado de banda em aplicações não essenciais.
                    </p>

                    <div className="bg-[#0F091F] border border-white/10 rounded-xl p-6 flex gap-10">

                        {/* DONUT */}
                        <div className="flex flex-col items-center justify-center min-w-[260px]">
                            <GraficoDonutSimples
                                labels={labels}
                                series={series}
                                cores={cores}
                                height={260}
                            />

                            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                                <div className="text-5xl font-semibold text-purple-400">
                                    {totalOcorrencias}
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
                                    {labels.map((url: string, i: number) => (
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

            {/* ========================== SEÇÃO 1.2 — TOP USUÁRIOS ========================== */}
            {temSecao("Top Usuários") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">

                    <div className="flex items-center gap-2 mb-3">
                        <FiUsers className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Top Usuários</h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Aqui são exibidos os usuários com maior consumo de banda no período analisado. O objetivo é identificar
                        comportamentos atípicos ou uso indevido dos recursos de rede, possibilitando intervenções preventivas ou ajustes de perfil de acesso. A correlação com políticas de uso aceitável reforça o alinhamento entre produtividade e segurança.
                    </p>

                    <div className="bg-[#0F091F] border border-white/10 rounded-xl p-6 flex gap-10">
                        {/* DONUT */}
                        <div className="flex flex-col items-center justify-center min-w-[260px]">

                            <GraficoDonutSimples
                                labels={labelsTopUsers}
                                series={seriesTopUsers}
                                cores={coresTopUsers}   // ✔ correto
                                height={250}
                            />
                            {/* TOTAL AO CENTRO */}
                            <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                                <div className="text-3xl font-semibold text-purple-400">
                                    {totalFormatado}
                                </div>
                            </div>
                        </div>

                        {/* LISTA DE IPS + CONSUMO */}
                        <div className="grid grid-cols-2 gap-4 mt-6">

                            {topUsers.map((u: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                    <span
                                        className="w-4 h-4 rounded-sm"
                                        style={{ backgroundColor: coresTopUsers[i] }}
                                    ></span>

                                    <span className="text-gray-300">
                                        {u.user} — {formatBytes(u.acessos)}
                                    </span>
                                </div>
                            ))}

                        </div>

                    </div>
                </div>
            )}

            {/* ========================== SEÇÃO 1.3 — TOP Aplicações ========================== */}
            {temSecao("Top Aplicações") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">

                    <div className="flex items-center gap-2 mb-3">
                        <LuFolderTree className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Top Aplicações</h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Mostra as aplicações mais utilizadas dentro do ambiente corporativo. Essa visão é essencial para compreender quais serviços demandam maior tráfego, avaliar riscos associados a softwares em nuvem, identificar shadow IT e otimizar o desempenho de rede. Também serve como base para priorizar inspeções de segurança em aplicações críticas.
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
                                {report?.snapshot?.topApps?.map((item: any, i: number) => (
                                    <tr key={i} className="border-b border-white/5">
                                        <td className="py-3 px-4 text-gray-300">
                                            {item[0]}
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-gray-200">
                                            {item[1].toLocaleString("pt-BR")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            )}

            {/* ========================== SEÇÃO 1.4 — TOP Categorias ========================== */}
            {temSecao("Top Categorias") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">

                    <div className="flex items-center gap-2 mb-3">
                        <BiCategory className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Top Categorias</h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Apresenta o agrupamento de aplicações e sites por categoria (ex.: redes sociais, colaboração, entretenimento). Essa análise permite avaliar a aderência das atividades digitais às políticas corporativas e identificar possíveis vetores de risco ou desperdício de recursos de conectividade
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
                                    const nome = cat[0] || "N/A";
                                    const valor = Number(cat[1] ?? 0);

                                    return (
                                        <tr key={i} className="border-b border-white/5">
                                            <td className="py-3 px-4 text-gray-300">
                                                {nome}
                                            </td>
                                            <td className="py-3 px-4 text-gray-400">
                                                {valor.toLocaleString("pt-BR")}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>

                        </table>

                    </div>

                </div>
            )}

            {/* ========================== SEÇÃO 1.5 — TOP Usuarios Aplicação ========================== */}
            {temSecao("Top Usuários por Volume de Aplicação") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">

                    <div className="flex items-center gap-2 mb-3">
                        <FiUserCheck className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Top Usuários por Volume de Aplicação</h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Mostra o detalhamento dos usuários que mais consomem aplicações específicas, com origem, destino e volume
                        trafegado. Essa métrica apoia a detecção de desvios de comportamento, como transferências anômalas de dados ou uso intensivo de serviços externos, auxiliando a priorização de investigações e alertas.
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
                                {report?.snapshot?.topUsuariosAplicacao?.map((item: any, i: number) => (
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

            {/* ========================== SEÇÃO 1.6 — TOP Usuarios Detalhado ========================== */}
            {temSecao("Top Acesso Detalhado") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">

                    <div className="flex items-center gap-2 mb-3">
                        <TbListDetails className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Top Acesso Detalhado</h3>
                    </div>
                    <p className="text-gray-400 text-sm mb-6">
                        Esta seção apresenta os principais destinos acessados pelos usuários corporativos. A análise permite identificar padrões de navegação, potenciais riscos de exposição a domínios suspeitos e consumo elevado de banda em aplicações não essenciais. Esses dados ajudam a orientar políticas de controle de acesso, priorização de tráfego e ações de conscientização dos usuários.
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
                                {report?.snapshot?.topAcessoDetalhado?.map((item: any, i: number) => (
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

                    <p className="text-gray-400 text-sm mb-6">
                        Visão geral do nível de risco do ambiente.
                    </p>

                    <div className="h-[260px] bg-[#0F091F] rounded-xl border border-white/10 flex flex-col items-center justify-center gap-3">

                        {/* GAUGE REAL */}
                        <div className="flex justify-center items-center">
                            <GraficoGauge valor={riskLevel?.gauge ?? 0} />
                        </div>

                        {/* LEGENDA ABAIXO DO GAUGE */}
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
            {temSecao("Top Hosts por Nível de Alertas") && (
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
                                    <th className="py-3 px-4 text-left text-[#F914AD] font-semibold">Crítico</th>
                                    <th className="py-3 px-4 text-left text-[#A855F7] font-semibold">Alto</th>
                                    <th className="py-3 px-4 text-left text-[#6366F1] font-semibold">Médio</th>
                                    <th className="py-3 px-4 text-left text-[#1DD69A] font-semibold">Baixo</th>
                                </tr>
                            </thead>

                            <tbody>
                                {report?.snapshot?.topHosts?.map((h: any, i: number) => (
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

            {/* ========================== SEÇÃO 5 — CIS Servicores ========================== */}
            {temSecao("Segurança dos Servidores (CIS Score)") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">

                    <div className="flex items-center gap-2 mb-4">
                        {/* @ts-ignore */}
                        <CiServer className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">
                            Nível de segurança dos servidores
                        </h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Exibe a avaliação do nível de proteção e conformidade dos servidores monitorados.
                        Com base em políticas de segurança, patches aplicados e configurações avaliadas,
                        o indicador mostra o grau de exposição de cada sistema e direciona esforços de correção.
                    </p>

                    <div className="flex justify-center text-[10px] text-gray-400 w-full mb-5">
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

                    {/* Função para definir cor dinâmica */}
                    {(() => {
                        return null;
                    })()}
                    <div className="p-5 rounded-xl bg-[#0F091F] border border-white/10">
                        <table className="w-full text-sm text-gray-300">
                            <thead className="bg-black/20 text-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-left">Host</th>
                                    <th className="py-3 px-4 text-left">Score CIS (%)</th>
                                </tr>
                            </thead>

                            <tbody>
                                {report?.snapshot?.cisHosts?.map((item: any, i: number) => {

                                    const getScoreColor = (score: number) => {
                                        if (score < 25) return "#F914AD";      // crítico
                                        if (score < 40) return "#A855F7";      // alto
                                        if (score < 60) return "#6366F1";      // médio
                                        return "#1DD69A";                      // baixo
                                    };

                                    const cor = getScoreColor(item.score);

                                    return (
                                        <tr key={i} className="border-b border-white/5">

                                            {/* HOST */}
                                            <td className="py-3 px-4 text-gray-300">
                                                {item.host}
                                            </td>

                                            {/* SCORE + BARRA */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-4">

                                                    {/* Barra de Score */}
                                                    <div className="flex-1 h-2 rounded-full bg-[#1b1530] overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-300"
                                                            style={{
                                                                width: `${item.score}%`,
                                                                backgroundColor: cor,
                                                            }}
                                                        ></div>
                                                    </div>

                                                    {/* Texto Score */}
                                                    <span
                                                        className="w-10 text-right font-semibold"
                                                        style={{ color: cor }}
                                                    >
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

            {/* ========================== SEÇÃO 5 — Top Sistemas Operacionais ========================== */}
            {temSecao("Top 5 Sistemas Operacionais Detectados") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">

                    <div className="flex items-center gap-2 mb-4">
                        {/* @ts-ignore */}
                        <RiWindowsLine className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">
                            Top 5 Sistemas Operacionais Detectados
                        </h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Apresenta os sistemas operacionais predominantes no ambiente, permitindo entender o perfil tecnológico e avaliar riscos associados a versões desatualizadas ou fora de suporte. Serve como base para estratégias de padronização e atualização de sistemas.
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
                                {report?.snapshot?.topOS?.map((item: any, i: number) => (
                                    <tr key={i} className="border-b border-white/5">

                                        {/* Nome do OS */}
                                        <td className="py-3 px-4 text-gray-400">
                                            {item.os}
                                        </td>

                                        {/* Total de vulnerabilidades */}
                                        <td className="py-3 px-4">
                                            <span className="text-gray-400 font-semibold">
                                                {item.total}
                                            </span>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================== SEÇÃO 5 — Top Hosts por Alteração de Arquivos ========================== */}
            {temSecao("Top Hosts por Alteração de Arquivos") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">

                    <div className="flex items-center gap-2 mb-4">
                        {/* @ts-ignore */}
                        <RiWindowsLine className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">
                            Top Hosts por Alteração de Arquivos
                        </h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Lista dos hosts com maior número de modificações, adições ou deleções de arquivos.
                        Ideal para identificar atividades suspeitas, mudanças estruturais e comportamentos inesperados em servidores e estações.
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
                                {report?.snapshot?.topHostsAlteracoes?.map((item: any, i: number) => (
                                    <tr key={i} className="border-b border-white/5">

                                        {/* Host */}
                                        <td className="py-3 px-4 text-gray-400">
                                            {item.host}
                                        </td>

                                        {/* Modificados */}
                                        <td className="py-3 px-4 text-gray-400">
                                            {item.modified}
                                        </td>

                                        {/* Adicionados */}
                                        <td className="py-3 px-4 text-gray-400">
                                            {item.added}
                                        </td>

                                        {/* Deletados */}
                                        <td className="py-3 px-4 text-gray-400">
                                            {item.deleted}
                                        </td>

                                        {/* Total */}
                                        <td className="py-3 px-4">
                                            <span className="text-gray-300 font-semibold">
                                                {item.total}
                                            </span>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ========================== SEÇÃO 6 — Top Hosts Alterados por Origem da Alteração ========================== */}
            {temSecao("Top Hosts Alterados por Origem da Alteração") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">
                    <div className="flex items-center gap-2 mb-4">
                        {/* @ts-ignore */}
                        <RiWindowsLine className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">
                            Top Hosts Alterados por Origem da Alteração
                        </h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Apresenta a origem das alterações (usuário, processo ou sistema) em cada host afetado. Essa visibilidade apoia auditorias forenses e garante rastreabilidade das ações, reforçando o controle de integridade e conformidade com normas de segurança.
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
                                {report?.snapshot?.topHostsOrigem?.map((item: any, i: number) => (
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

            {/* ========================== SEÇÃO 7 — Resumo de Ações nos Arquivos ========================== */}
            {temSecao("Resumo de Ações nos Arquivos") && (
                <div className="cards rounded-2xl p-6 mb-6 border border-white/5 bg-[#0A0617]">
                    <div className="flex items-center gap-2 mb-4">
                        {/* @ts-ignore */}
                        <RiWindowsLine className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">
                            Resumo de Ações nos Arquivos
                        </h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Consolida o total de arquivos adicionados, modificados e deletados em um período, permitindo avaliar o nível de atividade sobre dados sensíveis. É uma métrica relevante para monitorar comportamentos anômalos e incidentes relacionados à integridade da informação.
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

                    {/* TÍTULO */}
                    <div className="flex items-center gap-2 mb-4">
                        <FiAlertTriangle className="text-purple-400 text-xl" />
                        <h3 className="text-white text-lg font-medium">Incidentes</h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-6">
                        Visão consolidada dos incidentes registrados no período selecionado,
                        incluindo status, atribuição e eventos mais recentes.
                    </p>

                    {/* CARDS RESUMO */}
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



                    {/* LISTA DOS ÚLTIMOS INCIDENTES */}
                    <div className="p-5 rounded-xl bg-[#0F091F] border border-white/10">
                        <h4 className="text-white text-sm font-medium mb-4">
                            Últimos 5 incidentes
                        </h4>

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
                                            {/* Incidente */}
                                            <td className="py-3 px-4 text-gray-300">
                                                {formatCaseName(inc.case_name || inc.name || "—")}
                                            </td>

                                            {/* Severidade */}
                                            <td className="py-3 px-4">
                                                <span className={`text-[11px] px-2 py-0.5 rounded-md badge ${badge}`}>{sentenceCase(nivel)}</span>
                                            </td>

                                            {/* Status */}
                                            <td className="py-3 px-4">
                                                <span className="inline-flex items-center justify-center gap-1 text-xs text-gray-400">
                                                    {/* @ts-ignore */}
                                                    <StatusIcon className={`w-4 h-4 ${meta.color}`} />{meta.label}
                                                </span>
                                            </td>

                                            {/* Data */}
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
