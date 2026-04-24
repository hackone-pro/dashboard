// src/services/azure-api/soc-analytics.service.ts

import { serviceHeaders } from "./headers";

const API_URL = import.meta.env.VITE_API_BASE_URL;

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type PeriodoOption = "Dia" | "Semana" | "Mês" | "Trimestre" | "Ano" | "Customizado";

export interface KpiMetric {
    value: number | null;
    previousValue: number | null;
    deltaPercent: number | null;
    unit: string | null;
    trend: "up" | "down" | null;
}

export interface OpenIncidents {
    count: number;
    previousCount: number;
    deltaPercent: number | null;
    badge: string | null;
    hasCritical: boolean;
}

export interface SeverityBucket {
    severity: string;
    count: number;
    percent: number;
    deltaPercent: number | null;
    previousCount: number | null;
}

export interface SeverityDistribution {
    buckets: SeverityBucket[];
    total: number;
}

export interface AlertBySeverity {
    severity: string;
    count: number;
}

export interface RiskLevel {
    score: number;
    level: string;
    alertsBySeverity: AlertBySeverity[];
}

export interface Period {
    currentStart: string;
    currentEnd: string;
    previousStart: string;
    previousEnd: string;
    periodType: string;
}

export interface IaPerformance {
    triageAutoRate: number | null;
    prevTriageAutoRate: number | null;
    triageAutoRateDeltaPct: number | null;
    avgAiTimeMinutes: number | null;
    prevAvgAiTimeMinutes: number | null;
    avgAiTimeMinutesDeltaPct: number | null;
    escalationRate: number | null;
    prevEscalationRate: number | null;
    escalationRateDeltaPct: number | null;
}

export interface SocAnalyticsResponse {
    mttd: KpiMetric;
    mtta: KpiMetric;
    mttr: KpiMetric;
    openIncidents: OpenIncidents;
    severityDistribution: SeverityDistribution;
    riskLevel: RiskLevel;
    iaPerformance: IaPerformance;
    period: Period;
}

// ─── Mapa de período ──────────────────────────────────────────────────────────

const PERIODO_API_MAP: Record<PeriodoOption, string> = {
    Dia: "Day",
    Semana: "Week",
    Mês: "Month",
    Trimestre: "Quarter",
    Ano: "Year",
    Customizado: "Custom",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * The backend sends "improving" | "worsening" | "stable" for KPI trend.
 * Normalize to the "up" | "down" | null shape used in the UI.
 * For time metrics (MTTD/MTTA/MTTR), "improving" = value went down = "down" (green).
 */
function normalizeTrend(raw: string | null | undefined): "up" | "down" | null {
    if (raw === "worsening") return "up";
    if (raw === "improving") return "down";
    return null;
}

function normalizeKpi(kpi: KpiMetric & { trend?: string | null }): KpiMetric {
    return { ...kpi, trend: normalizeTrend(kpi.trend) };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const socAnalyticsService = {
    async getSocAnalytics(
        periodo: PeriodoOption,
        token: string,
        startDate?: string,
        endDate?: string,
    ): Promise<SocAnalyticsResponse> {
        const periodType = PERIODO_API_MAP[periodo];
        const params = new URLSearchParams({ period: periodType });
        if (periodType === "Custom" && startDate && endDate) {
            params.set("startDate", new Date(startDate).toISOString());
            params.set("endDate", new Date(endDate + "T23:59:59").toISOString());
        }
        const url = `${API_URL}/api/analytics/soc?${params.toString()}`;

        const res = await fetch(url, {
            headers: serviceHeaders(),
        });

        if (!res.ok) {
            throw new Error(`Erro ${res.status}: ${res.statusText}`);
        }

        const raw = await res.json() as SocAnalyticsResponse;
        return {
            ...raw,
            mttd: normalizeKpi(raw.mttd),
            mtta: normalizeKpi(raw.mtta),
            mttr: normalizeKpi(raw.mttr),
        };
    },
};