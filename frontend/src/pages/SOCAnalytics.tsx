// src/pages/SOCAnalytics.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import GraficoDonutSimples, { type SocTooltipData } from "../componentes/graficos/GraficoDonutSimples";
import GraficoGauge from "../componentes/graficos/GraficoGauge";
import { getToken } from "../utils/auth";
import { useTenant } from "../context/TenantContext";
import { useScreenContext } from "../context/ScreenContext";
import {
    socAnalyticsService,
    type SocAnalyticsResponse,
    type KpiMetric,
    type PeriodoOption,
} from "../services/azure-api/soc-analytics.service";
import { getRiskLevel, type RiskLevelResposta } from "../services/wazuh/risklevel.service";

// ─── Constantes ───────────────────────────────────────────────────────────────

const PERIODO_OPTIONS: PeriodoOption[] = ["Dia", "Semana", "Mês", "Trimestre", "Ano", "Customizado"];

const SEVERITY_COLOR_MAP: Record<string, string> = {
    Crítico: "#EC4899",
    Critical: "#EC4899",
    CRITICAL: "#EC4899",
    Alto: "#A855F7",
    High: "#A855F7",
    HIGH: "#A855F7",
    Médio: "#6A55DC",
    Medium: "#6A55DC",
    MEDIUM: "#6A55DC",
    Baixo: "#1DD69A",
    Low: "#1DD69A",
    LOW: "#1DD69A",
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
    onClick?: () => void;
}

function MetricCard({ label, sublabel, value, unit, trend, trendValue, trendLabel, alert, onClick }: MetricCardProps) {
    const isUp = trend === "up";
    const TrendIcon = isUp ? FiArrowUpRight : FiArrowDownRight;
    const trendColor = trend === null ? "#6b7280" : isUp ? "#EC4899" : "#1DD69A";

    return (
        <div
            className={`cards rounded-2xl p-5 flex flex-col gap-1${onClick ? " cursor-pointer hover:border-purple-600/40 transition" : ""}`}
            onClick={onClick}
        >
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
    const navigate = useNavigate();
    const [periodo, setPeriodo] = useState<PeriodoOption>("Dia");
    const [periodoOpen, setPeriodoOpen] = useState(false);
    const [customFrom, setCustomFrom] = useState("");
    const [customTo, setCustomTo] = useState("");
    const [severidadeIdx, setSeveridadeIdx] = useState<number | null>(null);

    const token = getToken();
    const { tenantAtivo } = useTenant();
    const { setScreenData } = useScreenContext();

    const [data, setData] = useState<SocAnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [wazuhRisk, setWazuhRisk] = useState<RiskLevelResposta | null>(null);
    const [loadingWazuh, setLoadingWazuh] = useState(true);

    const fetchData = async () => {
        if (periodo === "Customizado" && (!customFrom || !customTo)) return;
        setLoading(true);
        setError(null);
        try {
            const result = await socAnalyticsService.getSocAnalytics(
                periodo, token ?? "", customFrom || undefined, customTo || undefined
            );
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
    }, [periodo, tenantAtivo, customFrom, customTo]);

    useEffect(() => {
        if (!tenantAtivo) return;
        if (periodo === "Customizado" && (!customFrom || !customTo)) return;

        setLoadingWazuh(true);

        let diasParam: string | undefined;
        let periodoParam: { from: string; to: string } | undefined;

        if (periodo === "Dia") {
            diasParam = "1";
        } else if (periodo === "Semana") {
            diasParam = "7";
        } else if (periodo === "Mês") {
            diasParam = "30";
        } else if (periodo === "Customizado") {
            periodoParam = { from: customFrom, to: customTo };
        } else {
            const today = new Date();
            const days = periodo === "Trimestre" ? 90 : 365;
            const from = new Date(today);
            from.setDate(from.getDate() - days);
            periodoParam = {
                from: from.toISOString().split("T")[0],
                to: today.toISOString().split("T")[0],
            };
        }

        getRiskLevel(diasParam, periodoParam)
            .then(setWazuhRisk)
            .catch((err) => console.error("Erro ao carregar Wazuh RiskLevel:", err))
            .finally(() => setLoadingWazuh(false));
    }, [tenantAtivo, periodo, customFrom, customTo]);

    // ─── Screen context para o chat ──────────────────────────────────────────
    useEffect(() => {
        if (!data) return;
        const totalSev = data.severityDistribution?.total ?? 0;
        setScreenData("soc-analytics", {
            nomePagina: "SOC Analytics",
            periodo,
            mttd: data.mttd?.value != null ? `${data.mttd.value} ${data.mttd.unit ?? ""}`.trim() : null,
            mtta: data.mtta?.value != null ? `${data.mtta.value} ${data.mtta.unit ?? ""}`.trim() : null,
            mttr: data.mttr?.value != null ? `${data.mttr.value} ${data.mttr.unit ?? ""}`.trim() : null,
            totalIncidentesPeriodo: data.severityDistribution?.total ?? null,
            incidentesAbertos: data.openIncidents?.count ?? null,
            temCritico: data.openIncidents?.hasCritical ?? false,
            riskScore: data.riskLevel?.score ?? null,
            nivelRisco: ({ Critical: "Crítico", High: "Alto", Medium: "Médio", Low: "Baixo" } as Record<string,string>)[data.riskLevel?.level ?? ""] ?? data.riskLevel?.level ?? null,
            severidades: Object.fromEntries(
                (data.severityDistribution?.buckets ?? []).map((b) => {
                    const nomePT: Record<string, string> = { LOW: "Baixo", MEDIUM: "Médio", HIGH: "Alto", CRITICAL: "Crítico" };
                    return [
                        nomePT[b.severity] ?? b.severity,
                        {
                            count: b.count,
                            pct: totalSev > 0 ? `${Math.round((b.count / totalSev) * 100)}%` : "0%",
                        },
                    ];
                })
            ),
            performanceIA: data.iaPerformance ? {
                triagemAutomatizada: data.iaPerformance.triageAutoRate != null ? `${data.iaPerformance.triageAutoRate}%` : null,
                tempoMedioIaMinutos: data.iaPerformance.avgAiTimeMinutes ?? null,
                taxaEscalacao: data.iaPerformance.escalationRate != null ? `${data.iaPerformance.escalationRate}%` : null,
            } : null,
        });
    }, [data, periodo]);

    // ── Derived data ──────────────────────────────────────────────────────────
    const LABEL_PT: Record<string, string> = {
        Critical: "Crítico",
        CRITICAL: "Crítico",
        High: "Alto",
        HIGH: "Alto",
        Medium: "Médio",
        MEDIUM: "Médio",
        Low: "Baixo",
        LOW: "Baixo",
    };

    const buckets = data?.severityDistribution?.buckets ?? [];
    const donutLabels = buckets.map((b) => LABEL_PT[b.severity] ?? b.severity);
    const donutSeries = buckets.map((b) => b.count);
    const donutColors = buckets.map((b, i) => colorFor(b.severity, i));
    const donutTotal = data?.severityDistribution?.total ?? 0;
    const donutTooltipSoc: Record<string, SocTooltipData> = Object.fromEntries(
        buckets.map((b) => [
            LABEL_PT[b.severity] ?? b.severity,
            { count: b.count, percent: b.percent, deltaPercent: b.deltaPercent ?? null },
        ])
    );

    const alertGravidade = (() => {
        const sev = wazuhRisk?.severidades;
        if (!sev) return [];
        const items = [
            { label: "Crítico", color: "#EC4899", count: sev.critico },
            { label: "Alto",    color: "#A855F7", count: sev.alto },
            { label: "Médio",   color: "#6A55DC", count: sev.medio },
            { label: "Baixo",   color: "#1DD69A", count: sev.baixo },
        ];
        const total = sev.total || 1;
        const max = Math.max(sev.critico, sev.alto, sev.medio, sev.baixo, 1);
        return items.map((item) => ({
            ...item,
            bar: Math.round((item.count / max) * 100),
            pct: total > 0
                ? item.count / total >= 0.01
                    ? `${Math.round((item.count / total) * 100)}%`
                    : "<1%"
                : "—",
        }));
    })();

    const openIncidents = data?.openIncidents;
    const ia = data?.iaPerformance;

    // IA Performance helpers ──────────────────────────────────────────────────
    // triageAutoRate and escalationRate are already 0-100 percentages.
    // avgAiTimeMinutes is capped at 60 min for the bar (100% = 60 min).
    const iaTriageBar    = ia?.triageAutoRate    ?? 0;
    const iaTriageLabel  = ia?.triageAutoRate    != null ? `${ia.triageAutoRate}%` : "—";

    const iaAvgRaw       = ia?.avgAiTimeMinutes  ?? null;
    const iaAvgBar       = iaAvgRaw != null ? Math.min(Math.round((iaAvgRaw / 60) * 100), 100) : 0;
    const iaAvgLabel     = iaAvgRaw != null
        ? iaAvgRaw >= 60
            ? `${Math.floor(iaAvgRaw / 60)}h ${Math.round(iaAvgRaw % 60)}m`
            : `${iaAvgRaw} min`
        : "—";

    const iaEscBar       = ia?.escalationRate    ?? 0;
    const iaEscLabel     = ia?.escalationRate    != null ? `${ia.escalationRate}%` : "—";

    return (
        <LayoutModel titulo="SOC Analytics">
            <section className="flex flex-col gap-6">

                {/* ── Filtro ────────────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-3 no-print">
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
                    {periodo === "Customizado" && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={customFrom}
                                onChange={(e) => setCustomFrom(e.target.value)}
                                className="text-gray-300 text-sm border border-[#2a2040] bg-[#160f2a] px-3 py-1.5 rounded-lg focus:border-[#4B06DD]/70 focus:outline-none transition [color-scheme:dark]"
                            />
                            <span className="text-gray-500 text-sm">até</span>
                            <input
                                type="date"
                                value={customTo}
                                min={customFrom || undefined}
                                onChange={(e) => setCustomTo(e.target.value)}
                                className="text-gray-300 text-sm border border-[#2a2040] bg-[#160f2a] px-3 py-1.5 rounded-lg focus:border-[#4B06DD]/70 focus:outline-none transition [color-scheme:dark]"
                            />
                        </div>
                    )}
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
                                onClick={() => navigate("/incidentes")}
                            />
                            <MetricCard
                                label="MTTA"
                                sublabel="Mean Time To Acknowledge"
                                value={formatKpiValue(data.mtta)}
                                unit={formatKpiUnit(data.mtta)}
                                trend={data.mtta?.trend ?? null}
                                trendValue={formatDelta(data.mtta?.deltaPercent)}
                                trendLabel="vs período anterior"
                                onClick={() => navigate("/incidentes")}
                            />
                            <MetricCard
                                label="MTTR"
                                sublabel="Mean Time To Resolve"
                                value={formatKpiValue(data.mttr)}
                                unit={formatKpiUnit(data.mttr)}
                                trend={data.mttr?.trend ?? null}
                                trendValue={formatDelta(data.mttr?.deltaPercent)}
                                trendLabel="vs período anterior"
                                onClick={() => navigate("/incidentes")}
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
                                alert={openIncidents?.badge && openIncidents.badge !== "Normal" ? openIncidents.badge.replace("HighAlert", "High Alert") : undefined}
                                onClick={() => navigate("/incidentes?origem=abertos")}
                            />
                        </div>

                        {/* ── Linha 2 – Risk / Donut / AI Performance ───── */}
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                            {/* Risk Level */}
                            <div className="xl:col-span-3 cards rounded-2xl p-6 flex flex-col gap-2">
                                <p className="text-white font-medium">Risk Level</p>
                                <p className="text-gray-500 text-xs">Risco operacional atual</p>

                                <div className="-mt-2">
                                    <GraficoGauge valor={Math.round(wazuhRisk?.indiceRisco ?? 0)} titulo="Nível de Risco" />
                                </div>

                                <div className="flex flex-col gap-2 mt-1">
                                    {(() => {
                                        const sev = wazuhRisk?.severidades;
                                        const total = sev?.total || 1;
                                        const items = [
                                            { severity: "Crítico", count: sev?.critico ?? 0, color: "#EC4899" },
                                            { severity: "Alto",    count: sev?.alto    ?? 0, color: "#A855F7" },
                                            { severity: "Médio",   count: sev?.medio   ?? 0, color: "#6A55DC" },
                                            { severity: "Baixo",   count: sev?.baixo   ?? 0, color: "#1DD69A" },
                                        ];
                                        return items.map((item, i) => {
                                            const ativo = severidadeIdx === i;
                                            const pct = sev ? Math.round((item.count / total) * 100) : 0;
                                            return (
                                                <button
                                                    key={item.severity}
                                                    onClick={() => setSeveridadeIdx(ativo ? null : i)}
                                                    className={`flex items-center justify-between text-sm transition-all ${ativo ? "scale-[1.02]" : "opacity-75 hover:opacity-100"}`}
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span className="w-3 h-3 rounded-xs" style={{ background: item.color, boxShadow: ativo ? `0 0 8px ${item.color}` : "none" }} />
                                                        <span className={`text-gray-400 ${ativo ? "text-white font-semibold" : ""}`}>{item.severity}</span>
                                                    </span>
                                                    <span className={ativo ? "text-white font-semibold" : "text-white"}>
                                                        {item.count.toLocaleString("pt-BR")} alertas
                                                        <span className="text-gray-400 text-xs ml-1">({pct}%)</span>
                                                    </span>
                                                </button>
                                            );
                                        });
                                    })()}
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

                                {donutSeries.some(v => v > 0) ? (
                                    <>
                                        <div className="flex-1 flex items-center justify-center relative">
                                            <GraficoDonutSimples
                                                labels={donutLabels}
                                                series={donutSeries}
                                                cores={donutColors}
                                                height={220}
                                                tooltipSoc={donutTooltipSoc}
                                                onSliceClick={(label) => navigate(`/incidentes?severity=${label}`)}
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
                                                        <span className="text-gray-500 font-medium">{LABEL_PT[b.severity] ?? b.severity}</span>
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
                                        value={iaTriageBar} valueLabel={iaTriageLabel} color="#1DD69A"
                                        /* @ts-ignore */
                                        icon={<LuWorkflow size={16} />}
                                    />
                                    <hr className="border-[#2a2040]" />
                                    <AIPerformanceBar
                                        label="Tempo Médio da IA"
                                        sublabel="entre criação e 1ª sugestão de IA"
                                        value={iaAvgBar} valueLabel={iaAvgLabel} color="#6366F1"
                                        /* @ts-ignore */
                                        icon={<LuClock size={16} />}
                                    />
                                    <hr className="border-[#2a2040]" />
                                    <AIPerformanceBar
                                        label="Casos escalados"
                                        sublabel="N1 → N2, acima do normal"
                                        value={iaEscBar} valueLabel={iaEscLabel} color="#A855F7"
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