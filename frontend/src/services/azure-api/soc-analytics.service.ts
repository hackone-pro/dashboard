// src/services/socAnalyticsService.ts

const API_URL = import.meta.env.VITE_API_BASE_URL;

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type PeriodoOption = "Semana" | "Mês" | "Trimestre" | "Ano";

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

export interface SocAnalyticsResponse {
    mttd: KpiMetric;
    mtta: KpiMetric;
    mttr: KpiMetric;
    openIncidents: OpenIncidents;
    severityDistribution: SeverityDistribution;
    riskLevel: RiskLevel;
    period: Period;
}

// ─── Mapa de período ──────────────────────────────────────────────────────────

const PERIODO_API_MAP: Record<PeriodoOption, string> = {
    Semana: "week",
    Mês: "month",
    Trimestre: "quarter",
    Ano: "year",
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const socAnalyticsService = {
    async getSocAnalytics(
        periodo: PeriodoOption,
        token: string,
    ): Promise<SocAnalyticsResponse> {
        const periodType = PERIODO_API_MAP[periodo];
        const url = `${API_URL}/api/analytics/soc?periodType=${periodType}`;

        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            throw new Error(`Erro ${res.status}: ${res.statusText}`);
        }

        return res.json() as Promise<SocAnalyticsResponse>;
    },
};