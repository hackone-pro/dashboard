// src/pages/SOCAnalytics.tsx
// Tela mockada – SOC Analytics
// Reaproveitando GraficoDonutSimples e GraficoGauge do projeto

import { useState } from "react";
import {
    FiCalendar,
    FiChevronDown,
    FiAlertTriangle,
    FiArrowUpRight,
    FiArrowDownRight,
} from "react-icons/fi";
import { LuWorkflow, LuClock } from "react-icons/lu";
import { FaArrowUpLong } from "react-icons/fa6";

import LayoutModel from "../componentes/LayoutModel";
import GraficoDonutSimples from "../componentes/graficos/GraficoDonutSimples";
import GraficoGauge from "../componentes/graficos/GraficoGauge";

// ─── Tipos ─────────────────────────────────────────────────────────────────
type Trend = "up" | "down";
interface MetricCardProps {
    label: string;
    sublabel: string;
    value: string;
    unit?: string;
    trend: Trend;
    trendValue: string;
    trendLabel: string;
    alert?: string;
}

// ─── Mock data ──────────────────────────────────────────────────────────────
const PERIODO_OPTIONS = ["Semana", "Mês", "Trimestre", "Ano"];

const SEVERITY_COLORS = ["#EC4899", "#A855F7", "#6A55DC", "#1DD69A"];
const SEVERITY_LABELS = ["Crítico", "Alto", "Médio", "Baixo"];
const SEVERITY_SERIES = [12, 50, 25, 15];
const SEVERITY_MAP: Record<string, string> = {
    Baixo: "#1DD69A",
    Médio: "#6A55DC",
    Alto: "#A855F7",
    Crítico: "#EC4899",
};

const INCIDENT_LABELS = ["Baixo", "Médio", "Alto", "Crítico"];
const INCIDENT_SERIES = [86, 99, 49, 13];
const INCIDENT_COLORS = ["#1DD69A", "#6366F1", "#A855F7", "#EC4899"];
const INCIDENT_PCTS = [35, 40, 20, 5];

// Dados para a tabela Alertas por Gravidade
const ALERT_GRAVIDADE = [
    { label: "Crítico", color: "#EC4899", count: 0, pct: "0%", bar: 0 },
    { label: "Alto", color: "#A855F7", count: 2122, pct: "<1%", bar: 4 },
    { label: "Médio", color: "#6A55DC", count: 16, pct: "<1%", bar: 2 },
    { label: "Baixo", color: "#1DD69A", count: 2810354, pct: "100%", bar: 100 },
];

// ─── Sub-components ──────────────────────────────────────────────────────────
function MetricCard({
    label,
    sublabel,
    value,
    unit,
    trend,
    trendValue,
    trendLabel,
    alert,
}: MetricCardProps) {
    const isUp = trend === "up";
    const TrendIcon = isUp ? FiArrowUpRight : FiArrowDownRight;
    const trendColor = isUp ? "#EC4899" : "#1DD69A";

    return (
        <div className="cards rounded-2xl p-5 flex flex-col gap-1">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-white text-sm font-medium">{label}</p>
                    <p className="text-gray-500 text-xs">{sublabel}</p>
                </div>
                {alert && (
                    <span className="flex items-center gap-1 text-xs bg-pink-600/20 text-pink-400 border border-pink-600/30 px-2 py-0.5 rounded-full">
                        {/* @ts-ignore */}
                        <FiAlertTriangle size={10} />
                        {alert}
                    </span>
                )}
            </div>
            <div className="flex items-baseline gap-1 mt-1">
                <span className="text-white text-4xl font-bold">{value}</span>
                {unit && <span className="text-gray-400 text-base">{unit}</span>}
            </div>
            <div className="flex items-center gap-1 mt-1">
                {/* @ts-ignore */}
                <TrendIcon size={13} style={{ color: trendColor }} />
                <span className="text-xs font-light" style={{ color: trendColor }}>
                    {trendValue} {trendLabel}
                </span>
            </div>
        </div>
    );
}

function AIPerformanceBar({
    label,
    sublabel,
    value,
    valueLabel,
    color,
    icon,
}: {
    label: string;
    sublabel: string;
    value: number;
    valueLabel: string;
    color: string;
    icon: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Ícone com fundo */}
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: `${color}22` }}
                    >
                        <span style={{ color }}>{icon}</span>
                    </div>
                    <div>
                        <span className="text-gray-300 text-sm">{label}</span>
                        <p className="text-gray-500 text-xs">{sublabel}</p>
                    </div>
                </div>
                <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `${color}22`, color }}
                >
                    {valueLabel}
                </span>
            </div>
            <div className="h-2 rounded-full bg-[#1e1735] overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${value}%`, background: color }}
                />
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function SOCAnalytics() {
    const [periodo, setPeriodo] = useState("Semana");
    const [periodoOpen, setPeriodoOpen] = useState(false);
    const [severidadeIdx, setSeveridadeIdx] = useState<number | null>(null);

    const total = SEVERITY_SERIES.reduce((a, b) => a + b, 0);

    return (
        <LayoutModel titulo="SOC Analytics">
            <section className="flex flex-col gap-6">

                {/* ── Filtro ────────────────────────────────────────────── */}
                <div className="flex items-center gap-3 no-print">
                    <span className="text-gray-400 text-sm flex items-center gap-2">
                        {/* @ts-ignore */}
                        <FiCalendar size={14} />
                        Filtrar por:
                    </span>
                    <div className="relative">
                        <button
                            onClick={() => setPeriodoOpen(!periodoOpen)}
                            className="flex items-center gap-2 text-gray-300 text-sm border border-[#2a2040] bg-[#160f2a] px-4 py-1.5 rounded-lg hover:border-[#4B06DD]/50 transition"
                        >
                            {periodo}
                            {/* @ts-ignore */}
                            <FiChevronDown size={14} />
                        </button>
                        {periodoOpen && (
                            <div className="absolute top-full mt-1 left-0 bg-[#1e1735] border border-[#4B06DD]/30 rounded-lg z-10 overflow-hidden shadow-xl">
                                {PERIODO_OPTIONS.map((op) => (
                                    <button
                                        key={op}
                                        onClick={() => { setPeriodo(op); setPeriodoOpen(false); }}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-[#4B06DD]/20 hover:text-purple-300 transition"
                                    >
                                        {op}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Linha 1 – Cards MTTD / MTTA / MTTR / Incidentes ─── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    <MetricCard
                        label="MTTD"
                        sublabel="Mean Time To Detect"
                        value="12"
                        unit="min"
                        trend="up"
                        trendValue="+5%"
                        trendLabel="vs Semana anterior"
                    />
                    <MetricCard
                        label="MTTA"
                        sublabel="Mean Time To Acknowledge"
                        value="8"
                        unit="min"
                        trend="down"
                        trendValue="-3%"
                        trendLabel="vs Semana anterior"
                    />
                    <MetricCard
                        label="MTTR"
                        sublabel="Mean Time To Resolve"
                        value="2h 45m"
                        trend="up"
                        trendValue="+15%"
                        trendLabel="vs Semana anterior"
                    />
                    <MetricCard
                        label="Incidentes Abertos"
                        sublabel="Snapshot atual"
                        value="24"
                        trend="up"
                        trendValue="+8%"
                        trendLabel="vs Semana anterior"
                        alert="High Alert"
                    />
                </div>

                {/* ── Linha 2 – Risk Level / Histórico / AI Performance ── */}
                {/* ── Linha 2 – Risk Level / Histórico / AI Performance ── */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                    {/* Risk Level – col-span-3 */}
                    <div className="xl:col-span-3 cards rounded-2xl p-6 flex flex-col gap-2">
                        <p className="text-white font-medium">Risk Level</p>
                        <p className="text-gray-500 text-xs">Risco operacional atual</p>

                        <div className="-mt-2">
                            <GraficoGauge valor={72} titulo="Nível de Risco" />
                        </div>

                        {/* Legend */}
                        <div className="flex flex-col gap-2 mt-1">
                            {SEVERITY_LABELS.map((lb, i) => {
                                const ativo = severidadeIdx === i;
                                return (
                                    <button
                                        key={lb}
                                        onClick={() => setSeveridadeIdx(ativo ? null : i)}
                                        className={`flex items-center justify-between text-sm transition-all ${ativo ? "scale-[1.02]" : "opacity-75 hover:opacity-100"
                                            }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-xs"
                                                style={{
                                                    background: SEVERITY_COLORS[i],
                                                    boxShadow: ativo ? `0 0 8px ${SEVERITY_COLORS[i]}` : "none",
                                                }}
                                            />
                                            <span className={`text-gray-400 ${ativo ? "text-white font-semibold" : ""}`}>
                                                {lb}
                                            </span>
                                        </span>
                                        <span className={`${ativo ? "text-white font-semibold" : "text-white"}`}>
                                            {SEVERITY_SERIES[i]} alertas
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            className="flex items-center mt-2 gap-2 px-3 py-2 bg-purple-700 hover:bg-purple-800 border border-purple-700 text-white rounded-md text-sm shadow-sm mr-3 w-[150px]"
                        >
                            {/* @ts-ignore */}
                            <span>Ver Risk Level →</span>
                        </button>
                    </div>

                    {/* Histórico de Incidentes – col-span-3 */}
                    <div className="xl:col-span-3 cards rounded-2xl p-6 flex flex-col gap-3">
                        <div>
                            <p className="text-white font-medium">Histórico de Incidentes</p>
                            <p className="text-gray-500 text-xs">Incidentes criados no período</p>
                        </div>

                        <div className="flex-1 flex items-center justify-center relative">
                            {/* Donut chart */}
                            <GraficoDonutSimples
                                labels={INCIDENT_LABELS}
                                series={INCIDENT_SERIES}
                                cores={INCIDENT_COLORS}
                                height={220}
                            />
                            {/* Centro overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-white text-4xl font-medium">247</span>
                                <span className="text-gray-500 text-xs">total</span>
                            </div>
                        </div>

                        {/* Legenda */}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm justify-items-center">
                            {INCIDENT_LABELS.map((lb, i) => (
                                <span key={lb} className="flex items-center gap-2 pb-5">
                                    <span
                                        className="w-2.5 h-2.5 rounded-xs inline-block"
                                        style={{ background: INCIDENT_COLORS[i] }}
                                    />
                                    <span className="text-gray-500 font-medium">{lb}</span>
                                    <span className="text-white font-medium">{INCIDENT_PCTS[i]}%</span>
                                </span>
                            ))}
                        </div>

                        <p className="text-gray-600 text-xs text-center">
                            Clique em uma fatia para filtrar por severidade
                        </p>
                    </div>

                    {/* Performance da IA (N1) – col-span-6 */}
                    <div className="xl:col-span-6 cards rounded-2xl p-6 flex flex-col gap-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-white font-medium">Performance da IA (N1)</p>
                                <p className="text-gray-500 text-xs">Impacto da automação e IA na operação do SOC</p>
                            </div>
                            <span className="text-xs text-purple-300 border border-purple-600/40 bg-purple-600/10 px-2 py-0.5 rounded-full">
                                N1 Automação
                            </span>
                        </div>

                        <div className="flex flex-col gap-5 flex-1 justify-center">
                            <AIPerformanceBar
                                label="Triagem Automatizada"
                                sublabel="de incidentes resolvidos por IA"
                                value={82}
                                valueLabel="82%"
                                color="#1DD69A"
                                /* @ts-ignore */
                                icon={<LuWorkflow size={16} />}
                            />
                            <hr className="border-[#2a2040]" />
                            <AIPerformanceBar
                                label="Tempo Médio da IA"
                                sublabel="entre criação e 1ª sugestão de IA"
                                value={60}
                                valueLabel="5 min"
                                color="#6366F1"
                                /* @ts-ignore */
                                icon={<LuClock size={16} />}
                            />
                            <hr className="border-[#2a2040]" />
                            <AIPerformanceBar
                                label="Casos escalados"
                                sublabel="N1 → N2, acima do normal"
                                value={15}
                                valueLabel="15%"
                                color="#A855F7"
                                /* @ts-ignore */
                                icon={<FaArrowUpLong size={16} />}
                            />
                        </div>

                        <button
                            className="flex items-center mt-2 gap-2 px-3 py-2 bg-purple-700 hover:bg-purple-800 border border-purple-700 text-white rounded-md text-sm shadow-sm mr-3 w-[150px]"
                        >
                            {/* @ts-ignore */}
                            <span>Ver AI Analytics →</span>
                        </button>
                    </div>
                </div>

                {/* ── Linha 3 – Alertas por Gravidade ───────────────────── */}
                <div className="cards rounded-2xl p-6">
                    <div className="grid grid-cols-12 gap-6 items-start">

                        {/* Título – coluna menor */}
                        <div className="col-span-2 flex flex-col justify-center h-full">
                            <p className="text-white font-medium">Alertas por Gravidade</p>
                            <p className="text-gray-500 text-xs mt-1">Período selecionado</p>
                        </div>

                        {/* Cards – restante */}
                        <div className="col-span-10 grid grid-cols-4 gap-6">
                            {ALERT_GRAVIDADE.map((g) => (
                                <div key={g.label} className="flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-400 text-xs">Gravidade</span>
                                        <span
                                            className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                            style={{ background: `${g.color}22`, color: g.color }}
                                        >
                                            {g.label}
                                        </span>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-white text-2xl font-bold">
                                            {g.count.toLocaleString("pt-BR")}
                                        </span>
                                        <span className="text-gray-500 text-xs">
                                            Alertas {g.pct}
                                        </span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-[#1e1735] overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{ width: `${g.bar}%`, background: g.color }}
                                        />
                                    </div>
                                    <div className="flex gap-0.5">
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className="h-3 flex-1 rounded-sm opacity-40"
                                                style={{
                                                    background: i < Math.round(g.bar / 9) ? g.color : "#2a2040",
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </LayoutModel>
    );
}