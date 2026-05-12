// src/componentes/SOCAnalytics/DebugPanel.tsx
//
// Painel de debug visual para a página /soc-analytics.
// Oculto por padrão — habilite via console do browser:
//
//   __debugSOC()        → ativa
//   __debugSOC(false)   → desativa
//
// O estado persiste em localStorage ('__socDebug').

import { useEffect, useState } from "react";
import { FiX, FiMinus, FiMaximize2, FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SOCDebugData {
  timestamp: string;

  filtro: {
    label:        string;
    dias:         string;
    periodo:      { from: string; to: string } | null;
    socPeriodo:   string;
    startDate:    string | undefined;
    endDate:      string | undefined;
  };

  period: {
    currentStart:  string;
    currentEnd:    string;
    previousStart: string;
    previousEnd:   string;
    periodType:    string;
  } | null;

  kpis: {
    mttd: KpiDebug;
    mtta: KpiDebug;
    mttr: KpiDebug;
  };

  openIncidents: {
    count:         number | null;
    previousCount: number | null;
    deltaPercent:  number | null;
    badge:         string | null;
    hasCritical:   boolean;
  } | null;

  severityDistribution: {
    total: number;
    buckets: {
      severity:      string;
      count:         number;
      percent:       number;
      deltaPercent:  number | null;
      previousCount: number | null;
    }[];
  } | null;

  riskLevelIris: {
    score: number;
    level: string;
    alertsBySeverity: { severity: string; count: number }[];
  } | null;

  wazuhRisk: {
    indiceRisco: number;
    severidades: {
      critico: number;
      alto:    number;
      medio:   number;
      baixo:   number;
      total:   number;
    };
  } | null;

  iaPerformance: {
    triageAutoRate:         number | null;
    prevTriageAutoRate:     number | null;
    triageAutoRateDeltaPct: number | null;
    avgAiTimeMinutes:       number | null;
    prevAvgAiTimeMinutes:   number | null;
    avgAiTimeMinutesDeltaPct: number | null;
    escalationRate:         number | null;
    prevEscalationRate:     number | null;
    escalationRateDeltaPct: number | null;
  } | null;
}

interface KpiDebug {
  value:         number | null;
  previousValue: number | null;
  deltaPercent:  number | null;
  unit:          string | null;
  trend:         "up" | "down" | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number | null | undefined, decimals = 2): string {
  if (v === null || v === undefined) return "—";
  return Number(v).toFixed(decimals);
}

function fmtDelta(v: number | null | undefined): React.ReactNode {
  if (v === null || v === undefined) return <span className="text-gray-500">—</span>;
  const positive = v >= 0;
  return (
    <span className={positive ? "text-red-400" : "text-emerald-400"}>
      {positive ? "+" : ""}{v.toFixed(1)}%
    </span>
  );
}

function trendIcon(trend: "up" | "down" | null) {
  if (!trend) return <span className="text-gray-500">—</span>;
  return trend === "up"
    // @ts-ignore
    ? <FiArrowUpRight className="inline text-red-400 w-3 h-3" />
    // @ts-ignore
    : <FiArrowDownRight className="inline text-emerald-400 w-3 h-3" />;
}

function dateShort(iso: string | undefined) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleString("pt-BR"); } catch { return iso; }
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Section({
  title, accent, children,
}: {
  title: string; accent: string; children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="text-[10px] font-bold uppercase tracking-widest mb-1 px-1" style={{ color: accent }}>
        {title}
      </div>
      <div className="bg-white/[0.03] rounded-lg px-3 py-2 text-xs text-gray-300 space-y-1">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value, valueClass = "" }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className={`text-right break-all ${valueClass}`}>{value}</span>
    </div>
  );
}

function KpiRow({ label, kpi }: { label: string; kpi: KpiDebug }) {
  return (
    <div className="border-b border-white/[0.04] pb-1 mb-1 last:border-0 last:mb-0 last:pb-0">
      <div className="flex justify-between items-center">
        <span className="text-gray-400 font-semibold">{label}</span>
        <span className="text-white font-bold">
          {kpi.value ?? "—"} <span className="text-gray-500 font-normal text-[10px]">{kpi.unit ?? ""}</span>
        </span>
      </div>
      <div className="flex justify-between text-[10px] mt-0.5">
        <span className="text-gray-600">Anterior: {kpi.previousValue ?? "—"} {kpi.unit ?? ""}</span>
        <span className="flex items-center gap-1">
          {trendIcon(kpi.trend)} {fmtDelta(kpi.deltaPercent)}
        </span>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function SOCDebugPanel({ data }: { data: SOCDebugData | null }) {
  const [visible,   setVisible]   = useState(() => localStorage.getItem("__socDebug") === "1");
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    (window as any).__debugSOC = (on = true) => {
      const ativo = Boolean(on);
      localStorage.setItem("__socDebug", ativo ? "1" : "0");
      setVisible(ativo);
      setMinimized(false);
      console.log(
        `%c[DebugSOC] painel ${ativo ? "✅ ativado" : "❌ desativado"}`,
        "color:#6366F1;font-weight:bold"
      );
    };
    return () => { delete (window as any).__debugSOC; };
  }, []);

  if (!visible) return null;

  const score = data?.riskLevelIris?.score ?? data?.wazuhRisk?.indiceRisco ?? null;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="
          fixed bottom-4 right-4 z-[9999]
          bg-[#0A0617] border border-indigo-700/60
          text-indigo-300 text-xs font-mono
          px-3 py-2 rounded-lg shadow-xl
          flex items-center gap-2
          hover:border-indigo-500 transition-colors
        "
      >
        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
        SOC Debug
        {score !== null && <span className="text-white font-bold">{Math.round(score)}</span>}
        {/* @ts-ignore */}
        <FiMaximize2 className="w-3 h-3 opacity-60" />
      </button>
    );
  }

  const sev    = data?.wazuhRisk?.severidades;
  const total  = sev?.total || 1;
  const period = data?.period;

  return (
    <div className="
      fixed bottom-4 right-4 z-[9999]
      w-[420px] max-h-[85vh]
      bg-[#0A0617] border border-[#2D1F4E]
      rounded-xl shadow-2xl shadow-black/60
      flex flex-col overflow-hidden
      font-mono text-xs
    ">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1D1929] bg-[#0D0820] shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-indigo-300 font-bold text-[11px] tracking-wide">SOC ANALYTICS DEBUG</span>
        </div>
        <div className="flex items-center gap-2">
          {data?.timestamp && (
            <span className="text-gray-600 text-[10px]">{data.timestamp}</span>
          )}
          <button onClick={() => setMinimized(true)} className="text-gray-500 hover:text-gray-300 transition-colors">
            {/* @ts-ignore */}
            <FiMinus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { localStorage.removeItem("__socDebug"); setVisible(false); }}
            className="text-gray-500 hover:text-red-400 transition-colors"
          >
            {/* @ts-ignore */}
            <FiX className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-indigo-900/50">

        {/* FILTRO */}
        <Section title="Filtro Ativo" accent="#A855F7">
          <Row label="Label"       value={data?.filtro.label      ?? "—"} valueClass="text-purple-300 font-bold" />
          <Row label="Dias"        value={data?.filtro.dias       ?? "—"} />
          <Row label="SOC período" value={data?.filtro.socPeriodo ?? "—"} valueClass="text-indigo-300" />
          <Row label="startDate"   value={data?.filtro.startDate ? dateShort(data.filtro.startDate) : "—"} valueClass="text-blue-300" />
          <Row label="endDate"     value={data?.filtro.endDate   ? dateShort(data.filtro.endDate)   : "—"} valueClass="text-blue-300" />
          {data?.filtro.periodo && (
            <>
              <Row label="from" value={<span className="text-purple-200">{data.filtro.periodo.from}</span>} />
              <Row label="to"   value={<span className="text-purple-200">{data.filtro.periodo.to}</span>} />
            </>
          )}
        </Section>

        {/* PERÍODO RETORNADO */}
        {period && (
          <Section title="Período Retornado pela API" accent="#60A5FA">
            <Row label="Tipo"           value={period.periodType}                valueClass="text-blue-300 font-bold" />
            <Row label="Current start"  value={dateShort(period.currentStart)}   valueClass="text-gray-200" />
            <Row label="Current end"    value={dateShort(period.currentEnd)}     valueClass="text-gray-200" />
            <Row label="Previous start" value={dateShort(period.previousStart)}  valueClass="text-gray-500" />
            <Row label="Previous end"   value={dateShort(period.previousEnd)}    valueClass="text-gray-500" />
          </Section>
        )}

        {/* KPIs */}
        <Section title="KPIs — MTTD / MTTA / MTTR" accent="#34D399">
          {data?.kpis ? (
            <>
              <KpiRow label="MTTD" kpi={data.kpis.mttd} />
              <KpiRow label="MTTA" kpi={data.kpis.mtta} />
              <KpiRow label="MTTR" kpi={data.kpis.mttr} />
            </>
          ) : (
            <span className="text-gray-500">sem dados</span>
          )}
        </Section>

        {/* INCIDENTES ABERTOS */}
        <Section title="Incidentes Abertos" accent="#F472B6">
          {data?.openIncidents ? (
            <>
              <Row label="Count"       value={data.openIncidents.count ?? "—"}         valueClass="text-white font-bold" />
              <Row label="Anterior"    value={data.openIncidents.previousCount ?? "—"} />
              <Row label="Delta"       value={fmtDelta(data.openIncidents.deltaPercent)} />
              <Row label="Badge"       value={data.openIncidents.badge ?? "—"}         valueClass={data.openIncidents.badge && data.openIncidents.badge !== "Normal" ? "text-pink-400 font-bold" : ""} />
              <Row label="hasCritical" value={String(data.openIncidents.hasCritical)}  valueClass={data.openIncidents.hasCritical ? "text-red-400 font-bold" : "text-gray-400"} />
            </>
          ) : (
            <span className="text-gray-500">sem dados</span>
          )}
        </Section>

        {/* DISTRIBUIÇÃO DE SEVERIDADE */}
        <Section title="Distribuição de Severidade (IRIS)" accent="#FBBF24">
          {data?.severityDistribution ? (
            <>
              <Row label="Total" value={data.severityDistribution.total} valueClass="text-white font-bold" />
              <table className="w-full text-[11px] mt-1">
                <thead>
                  <tr className="text-gray-500 border-b border-white/5">
                    <th className="text-left pb-1">Severidade</th>
                    <th className="text-right pb-1">Count</th>
                    <th className="text-right pb-1">%</th>
                    <th className="text-right pb-1">Anterior</th>
                    <th className="text-right pb-1">Δ%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.severityDistribution.buckets.map((b) => (
                    <tr key={b.severity} className="border-b border-white/[0.03]">
                      <td className="py-0.5 text-gray-300">{b.severity}</td>
                      <td className="py-0.5 text-right text-white font-bold">{b.count}</td>
                      <td className="py-0.5 text-right text-gray-400">{b.percent.toFixed(1)}%</td>
                      <td className="py-0.5 text-right text-gray-500">{b.previousCount ?? "—"}</td>
                      <td className="py-0.5 text-right">{fmtDelta(b.deltaPercent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <span className="text-gray-500">sem dados</span>
          )}
        </Section>

        {/* RISK LEVEL IRIS */}
        <Section title="Risk Level (IRIS)" accent="#EC4899">
          {data?.riskLevelIris ? (
            <>
              <Row label="Score" value={data.riskLevelIris.score} valueClass="text-white font-bold text-base" />
              <Row label="Level" value={data.riskLevelIris.level} valueClass="text-pink-300 font-bold" />
              {data.riskLevelIris.alertsBySeverity?.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {data.riskLevelIris.alertsBySeverity.map((a) => (
                    <Row key={a.severity} label={a.severity} value={a.count} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <span className="text-gray-500">sem dados</span>
          )}
        </Section>

        {/* WAZUH RISK */}
        <Section title="Risk Level (Wazuh)" accent="#A855F7">
          {sev ? (
            <>
              <Row label="Índice" value={fmt(data?.wazuhRisk?.indiceRisco ?? null, 1)} valueClass="text-white font-bold text-base" />
              <div className="border-t border-white/5 mt-1 pt-1" />
              <Row label="Crítico" value={`${sev.critico}  (${Math.round((sev.critico / total) * 100)}%)`} valueClass="text-red-400" />
              <Row label="Alto"    value={`${sev.alto}  (${Math.round((sev.alto    / total) * 100)}%)`} valueClass="text-orange-400" />
              <Row label="Médio"   value={`${sev.medio}  (${Math.round((sev.medio  / total) * 100)}%)`} valueClass="text-yellow-400" />
              <Row label="Baixo"   value={`${sev.baixo}  (${Math.round((sev.baixo  / total) * 100)}%)`} valueClass="text-emerald-400" />
              <Row label="Total"   value={sev.total} valueClass="text-white font-bold" />
            </>
          ) : (
            <span className="text-gray-500">sem dados</span>
          )}
        </Section>

        {/* IA PERFORMANCE */}
        <Section title="IA Performance (N1)" accent="#6366F1">
          {data?.iaPerformance ? (
            <>
              {/* Triagem */}
              <div className="border-b border-white/[0.05] pb-1 mb-1">
                <span className="text-gray-400 font-semibold">Triagem Automatizada</span>
                <div className="flex justify-between mt-0.5">
                  <span className="text-gray-600">Atual / Anterior</span>
                  <span>
                    <span className="text-white font-bold">{data.iaPerformance.triageAutoRate ?? "—"}%</span>
                    <span className="text-gray-500 mx-1">/</span>
                    <span className="text-gray-400">{data.iaPerformance.prevTriageAutoRate ?? "—"}%</span>
                    <span className="ml-2">{fmtDelta(data.iaPerformance.triageAutoRateDeltaPct)}</span>
                  </span>
                </div>
              </div>
              {/* Tempo médio IA */}
              <div className="border-b border-white/[0.05] pb-1 mb-1">
                <span className="text-gray-400 font-semibold">Tempo Médio IA</span>
                <div className="flex justify-between mt-0.5">
                  <span className="text-gray-600">Atual / Anterior (min)</span>
                  <span>
                    <span className="text-white font-bold">{fmt(data.iaPerformance.avgAiTimeMinutes, 1)}</span>
                    <span className="text-gray-500 mx-1">/</span>
                    <span className="text-gray-400">{fmt(data.iaPerformance.prevAvgAiTimeMinutes, 1)}</span>
                    <span className="ml-2">{fmtDelta(data.iaPerformance.avgAiTimeMinutesDeltaPct)}</span>
                  </span>
                </div>
              </div>
              {/* Escalação */}
              <div>
                <span className="text-gray-400 font-semibold">Taxa de Escalação</span>
                <div className="flex justify-between mt-0.5">
                  <span className="text-gray-600">Atual / Anterior</span>
                  <span>
                    <span className="text-white font-bold">{data.iaPerformance.escalationRate ?? "—"}%</span>
                    <span className="text-gray-500 mx-1">/</span>
                    <span className="text-gray-400">{data.iaPerformance.prevEscalationRate ?? "—"}%</span>
                    <span className="ml-2">{fmtDelta(data.iaPerformance.escalationRateDeltaPct)}</span>
                  </span>
                </div>
              </div>
            </>
          ) : (
            <span className="text-gray-500">sem dados</span>
          )}
        </Section>

      </div>
    </div>
  );
}
