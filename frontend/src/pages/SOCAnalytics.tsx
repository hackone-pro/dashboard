// src/pages/SOCAnalytics.tsx

import { useState, useEffect } from "react";
import {
    FiCalendar,
    FiChevronDown,
    FiAlertTriangle,
    FiArrowUpRight,
    FiArrowDownRight,
    FiLoader,
    FiAlertCircle,
} from "react-icons/fi";
import { LuWorkflow, LuClock } from "react-icons/lu";
import { FaArrowUpLong } from "react-icons/fa6";

import LayoutModel from "../componentes/LayoutModel";
import GraficoDonutSimples from "../componentes/graficos/GraficoDonutSimples";
import GraficoGauge from "../componentes/graficos/GraficoGauge";
import { getToken } from "../utils/auth";
import { useTenant } from "../context/TenantContext";
import {
    socAnalyticsService,
    type SocAnalyticsResponse,
    type KpiMetric,
    type PeriodoOption,
} from "../services/azure-api/soc-analytics.service";

// ─── Constantes ───────────────────────────────────────────────────────────────

const PERIODO_OPTIONS: PeriodoOption[] = ["Semana", "Mês", "Trimestre", "Ano"];

const SEVERITY_COLOR_MAP: Record<string, string> = {
    Crítico: "#EC4899",
    Critical: "#EC4899",
    Alto: "#A855F7",
    High: "#A855F7",
    Médio: "#6A55DC",
    Medium: "#6A55DC",
    Baixo: "#1DD69A",
    Low: "#1DD69A",
};

const FALLBACK_COLORS = ["#EC4899", "#A855F7", "#6A55DC", "#1DD69A"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function colorFor(severity: string, idx: number): string {
    return SEVERITY_COLOR_MAP[severity] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

function formatKpiValue(metric: KpiMetric | undefined): string {
    if (!metric || metric.value === null) return "—";
    if (metric.unit === "minutes" || metric.unit === "min") {
        if (metric.value >= 60) {
            const h = Math.floor(metric.value / 60);
            const m = metric.value % 60;
            return m > 0 ? `${h}h ${m}m` : `${h}h`;
        }
    }
    return String(metric.value);
}

function formatKpiUnit(metric: KpiMetric | undefined): string | undefined {
    if (!metric || metric.value === null) return undefined;
    if ((metric.unit === "minutes" || metric.unit === "min") && metric.value < 60) return "min";
    return metric.unit ?? undefined;
}

function formatDelta(delta: number | null): string {
    if (delta === null) return "—";
    return `${delta >= 0 ? "+" : ""}${delta.toFixed(0)}%`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MetricCardProps {
    label: string;
    sublabel: string;
    value: string;
    unit?: string;
    trend: "up" | "down" | null;
    trendValue: string;
    trendLabel: string;
    alert?: string;
}

function MetricCard({ label, sublabel, value, unit, trend, trendValue, trendLabel, alert }: MetricCardProps) {
    const isUp = trend === "up";
    const TrendIcon = isUp ? FiArrowUpRight : FiArrowDownRight;
    const trendColor = trend === null ? "#6b7280" : isUp ? "#EC4899" : "#1DD69A";

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
                {trend && <TrendIcon size={13} style={{ color: trendColor }} />}
                <span className="text-xs font-light" style={{ color: trendColor }}>
                    {trendValue} {trendLabel}
                </span>
            </div>
        </div>
    );
}

function AIPerformanceBar({
    label, sublabel, value, valueLabel, color, icon,
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
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}22` }}>
                        <span style={{ color }}>{icon}</span>
                    </div>
                    <div>
                        <span className="text-gray-300 text-sm">{label}</span>
                        <p className="text-gray-500 text-xs">{sublabel}</p>
                    </div>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${color}22`, color }}>
                    {valueLabel}
                </span>
            </div>
            <div className="h-2 rounded-full bg-[#1e1735] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
            </div>
        </div>
    );
}

function LoadingOverlay() {
    return (
        <div className="flex items-center justify-center py-24 w-full">
            <div className="flex flex-col items-center gap-3 text-gray-500">
                {/* @ts-ignore */}
                <FiLoader size={28} className="animate-spin text-purple-500" />
                <span className="text-sm">Carregando dados do SOC…</span>
            </div>
        </div>
    );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="flex items-center gap-3 bg-pink-600/10 border border-pink-600/30 rounded-xl px-4 py-3 text-pink-400 text-sm">
            {/* @ts-ignore */}
            <FiAlertCircle size={16} className="shrink-0" />
            <span className="flex-1">{message}</span>
            <button onClick={onRetry} className="underline underline-offset-2 text-pink-300 hover:text-pink-100 transition text-xs">
                Tentar novamente
            </button>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SOCAnalytics() {
    const [periodo, setPeriodo] = useState<PeriodoOption>("Semana");
    const [periodoOpen, setPeriodoOpen] = useState(false);
    const [severidadeIdx, setSeveridadeIdx] = useState<number | null>(null);

    const token = getToken();
    const { tenantAtivo } = useTenant();

    const [data, setData] = useState<SocAnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await socAnalyticsService.getSocAnalytics(periodo, token ?? "");
            setData(result);
        } catch (err: any) {
            setError(err?.message ?? "Erro desconhecido ao buscar dados da API.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!tenantAtivo) return;
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [periodo, tenantAtivo]);

    // ── Derived data ──────────────────────────────────────────────────────────
    const buckets = data?.severityDistribution?.buckets ?? [];
    const donutLabels = buckets.map((b) => b.severity);
    const donutSeries = buckets.map((b) => b.count);
    const donutColors = buckets.map((b, i) => colorFor(b.severity, i));
    const donutTotal = data?.severityDistribution?.total ?? 0;

    const riskScore = data?.riskLevel?.score ?? 0;
    const alertsBySeverity = data?.riskLevel?.alertsBySeverity ?? [];

    // ✅ ÚNICO BLOCO QUE MUDOU — dados reais do riskLevel, cálculo correto
    const total = alertsBySeverity.reduce((acc, x) => acc + x.count, 0);
    const max = Math.max(...alertsBySeverity.map((x) => x.count), 1);

    const alertGravidade = alertsBySeverity.map((a, i) => {
        const color = colorFor(a.severity, i);
        const bar = Math.round((a.count / max) * 100);
        const pct = total > 0
            ? a.count / total >= 0.01
                ? `${Math.round((a.count / total) * 100)}%`
                : "<1%"
            : "—";
        return { label: a.severity, color, count: a.count, pct, bar };
    });

    const openIncidents = data?.openIncidents;

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

                {error && <ErrorBanner message={error} onRetry={fetchData} />}
                {loading && <LoadingOverlay />}

                {!loading && !error && data && (
                    <>
                        {/* ── Linha 1 – KPI Cards ───────────────────────── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                            <MetricCard
                                label="MTTD"
                                sublabel="Mean Time To Detect"
                                value={formatKpiValue(data.mttd)}
                                unit={formatKpiUnit(data.mttd)}
                                trend={data.mttd?.trend ?? null}
                                trendValue={formatDelta(data.mttd?.deltaPercent)}
                                trendLabel="vs período anterior"
                            />
                            <MetricCard
                                label="MTTA"
                                sublabel="Mean Time To Acknowledge"
                                value={formatKpiValue(data.mtta)}
                                unit={formatKpiUnit(data.mtta)}
                                trend={data.mtta?.trend ?? null}
                                trendValue={formatDelta(data.mtta?.deltaPercent)}
                                trendLabel="vs período anterior"
                            />
                            <MetricCard
                                label="MTTR"
                                sublabel="Mean Time To Resolve"
                                value={formatKpiValue(data.mttr)}
                                unit={formatKpiUnit(data.mttr)}
                                trend={data.mttr?.trend ?? null}
                                trendValue={formatDelta(data.mttr?.deltaPercent)}
                                trendLabel="vs período anterior"
                            />
                            <MetricCard
                                label="Incidentes Abertos"
                                sublabel="Snapshot atual"
                                value={String(openIncidents?.count ?? "—")}
                                trend={
                                    openIncidents?.deltaPercent != null
                                        ? openIncidents.deltaPercent >= 0 ? "up" : "down"
                                        : null
                                }
                                trendValue={formatDelta(openIncidents?.deltaPercent ?? null)}
                                trendLabel="vs período anterior"
                                alert={openIncidents?.hasCritical ? (openIncidents.badge ?? "High Alert") : undefined}
                            />
                        </div>

                        {/* ── Linha 2 – Risk / Donut / AI Performance ───── */}
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                            {/* Risk Level */}
                            <div className="xl:col-span-3 cards rounded-2xl p-6 flex flex-col gap-2">
                                <p className="text-white font-medium">Risk Level</p>
                                <p className="text-gray-500 text-xs">Risco operacional atual</p>

                                <div className="-mt-2">
                                    <GraficoGauge valor={riskScore} titulo="Nível de Risco" />
                                </div>

                                <div className="flex flex-col gap-2 mt-1">
                                    {alertsBySeverity.map((a, i) => {
                                        const color = colorFor(a.severity, i);
                                        const ativo = severidadeIdx === i;
                                        return (
                                            <button
                                                key={a.severity}
                                                onClick={() => setSeveridadeIdx(ativo ? null : i)}
                                                className={`flex items-center justify-between text-sm transition-all ${ativo ? "scale-[1.02]" : "opacity-75 hover:opacity-100"}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-xs" style={{ background: color, boxShadow: ativo ? `0 0 8px ${color}` : "none" }} />
                                                    <span className={`text-gray-400 ${ativo ? "text-white font-semibold" : ""}`}>{a.severity}</span>
                                                </span>
                                                <span className={ativo ? "text-white font-semibold" : "text-white"}>
                                                    {a.count.toLocaleString("pt-BR")} alertas
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <button className="flex items-center mt-2 gap-2 px-3 py-2 bg-purple-700 hover:bg-purple-800 border border-purple-700 text-white rounded-md text-sm shadow-sm w-[150px]">
                                    <span>Ver Risk Level →</span>
                                </button>
                            </div>

                            {/* Histórico de Incidentes */}
                            <div className="xl:col-span-3 cards rounded-2xl p-6 flex flex-col gap-3">
                                <div>
                                    <p className="text-white font-medium">Histórico de Incidentes</p>
                                    <p className="text-gray-500 text-xs">Incidentes criados no período</p>
                                </div>

                                {donutSeries.length > 0 ? (
                                    <>
                                        <div className="flex-1 flex items-center justify-center relative">
                                            <GraficoDonutSimples
                                                labels={donutLabels}
                                                series={donutSeries}
                                                cores={donutColors}
                                                height={220}
                                            />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-white text-4xl font-medium">{donutTotal.toLocaleString("pt-BR")}</span>
                                                <span className="text-gray-500 text-xs">total</span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm justify-items-center">
                                            {buckets.map((b, i) => {
                                                const pct = donutTotal > 0 ? Math.round((b.count / donutTotal) * 100) : 0;
                                                return (
                                                    <span key={b.severity} className="flex items-center gap-2 pb-5">
                                                        <span className="w-2.5 h-2.5 rounded-xs inline-block" style={{ background: donutColors[i] }} />
                                                        <span className="text-gray-500 font-medium">{b.severity}</span>
                                                        <span className="text-white font-medium">{pct}%</span>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">Sem dados no período</div>
                                )}

                                <p className="text-gray-600 text-xs text-center">Clique em uma fatia para filtrar por severidade</p>
                            </div>

                            {/* AI Performance */}
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
                                        value={82} valueLabel="82%" color="#1DD69A"
                                        /* @ts-ignore */
                                        icon={<LuWorkflow size={16} />}
                                    />
                                    <hr className="border-[#2a2040]" />
                                    <AIPerformanceBar
                                        label="Tempo Médio da IA"
                                        sublabel="entre criação e 1ª sugestão de IA"
                                        value={60} valueLabel="5 min" color="#6366F1"
                                        /* @ts-ignore */
                                        icon={<LuClock size={16} />}
                                    />
                                    <hr className="border-[#2a2040]" />
                                    <AIPerformanceBar
                                        label="Casos escalados"
                                        sublabel="N1 → N2, acima do normal"
                                        value={15} valueLabel="15%" color="#A855F7"
                                        /* @ts-ignore */
                                        icon={<FaArrowUpLong size={16} />}
                                    />
                                </div>

                                <button className="flex items-center mt-2 gap-2 px-3 py-2 bg-purple-700 hover:bg-purple-800 border border-purple-700 text-white rounded-md text-sm shadow-sm w-[150px]">
                                    <span>Ver AI Analytics →</span>
                                </button>
                            </div>
                        </div>

                        {/* ── Linha 3 – Alertas por Gravidade ───────────── */}
                        <div className="cards rounded-2xl p-6">
                            <div className="grid grid-cols-12 gap-6 items-start">
                                <div className="col-span-2 flex flex-col justify-center h-full">
                                    <p className="text-white font-medium">Alertas por Gravidade</p>
                                    <p className="text-gray-500 text-xs mt-1">Período selecionado</p>
                                </div>

                                <div
                                    className="col-span-10 grid gap-6"
                                    style={{ gridTemplateColumns: `repeat(${Math.max(alertGravidade.length, 1)}, 1fr)` }}
                                >
                                    {alertGravidade.length > 0 ? alertGravidade.map((g) => (
                                        <div key={g.label} className="flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400 text-xs">Gravidade</span>
                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${g.color}22`, color: g.color }}>
                                                    {g.label}
                                                </span>
                                            </div>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-white text-2xl font-bold">{g.count.toLocaleString("pt-BR")}</span>
                                                <span className="text-gray-500 text-xs">Alertas {g.pct}</span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-[#1e1735] overflow-hidden">
                                                <div className="h-full rounded-full" style={{ width: `${g.bar}%`, background: g.color }} />
                                            </div>
                                            <div className="flex gap-0.5">
                                                {Array.from({ length: 12 }).map((_, i) => (
                                                    <div key={i} className="h-3 flex-1 rounded-sm opacity-40"
                                                        style={{ background: i < Math.round(g.bar / 9) ? g.color : "#2a2040" }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="col-span-4 text-gray-600 text-sm text-center py-4">Sem alertas no período</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </LayoutModel>
    );
}