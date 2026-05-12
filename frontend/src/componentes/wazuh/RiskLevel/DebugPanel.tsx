// src/componentes/wazuh/RiskLevel/DebugPanel.tsx
//
// Painel de debug visual para a página /risk-level.
// Oculto por padrão — habilite via console do browser:
//
//   __debugRL()        → ativa
//   __debugRL(false)   → desativa
//
// O estado persiste em localStorage ('__rlDebug').

import { useEffect, useState } from "react";
import { FiX, FiMinus, FiMaximize2 } from "react-icons/fi";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface RLDebugData {
  timestamp: string;
  filtro: {
    label: string;
    dias: string;
    periodo: { from: string; to: string } | null;
    queryParams: string;
  };
  resposta: {
    filtrosUsados: any;
    dataAvailability: any;
    janela: string | null;
    warmup: boolean | null;
  };
  cards: {
    topHosts:   CardDebug | null;
    cis:        CardDebug | null;
    firewall:   CardDebug | null;
    incidents:  CardDebug | null;
  };
  resultado: {
    indiceRisco: number;
    severidades: {
      critico: number;
      alto:    number;
      medio:   number;
      baixo:   number;
      total:   number;
    };
  };
}

interface CardDebug {
  raw:      number | null;
  baseline: number | null;
  risco:    number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(s: string | undefined) {
  if (!s) return "text-gray-500";
  if (s === "ok") return "text-emerald-400";
  if (s === "warmup") return "text-yellow-400";
  return "text-red-400";
}

function riscoColor(v: number | null) {
  if (v === null) return "text-gray-500";
  if (v >= 0.7) return "text-red-400";
  if (v >= 0.4) return "text-yellow-400";
  return "text-emerald-400";
}

function fmt(v: number | null, decimals = 2) {
  if (v === null || v === undefined) return "—";
  return Number(v).toFixed(decimals);
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div
        className="text-[10px] font-bold uppercase tracking-widest mb-1 px-1"
        style={{ color: accent }}
      >
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

// ─── Componente principal ─────────────────────────────────────────────────────

export default function DebugPanel({ data }: { data: RLDebugData | null }) {
  const [visible,   setVisible]   = useState(() => localStorage.getItem("__rlDebug") === "1");
  const [minimized, setMinimized] = useState(false);

  // Expõe __debugRL() no console
  useEffect(() => {
    (window as any).__debugRL = (on = true) => {
      const ativo = Boolean(on);
      localStorage.setItem("__rlDebug", ativo ? "1" : "0");
      setVisible(ativo);
      setMinimized(false);
      console.log(
        `%c[DebugRL] painel ${ativo ? "✅ ativado" : "❌ desativado"}`,
        "color:#A855F7;font-weight:bold"
      );
    };
    return () => {
      delete (window as any).__debugRL;
    };
  }, []);

  if (!visible) return null;

  const score = data?.resultado.indiceRisco ?? null;

  // ── Minimizado: badge flutuante ──
  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="
          fixed bottom-4 right-4 z-[9999]
          bg-[#0A0617] border border-purple-700/60
          text-purple-300 text-xs font-mono
          px-3 py-2 rounded-lg shadow-xl
          flex items-center gap-2
          hover:border-purple-500 transition-colors
        "
      >
        <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
        RL Debug
        {score !== null && (
          <span className="text-white font-bold">{Math.round(score)}</span>
        )}
        {/* @ts-ignore */}
        <FiMaximize2 className="w-3 h-3 opacity-60" />
      </button>
    );
  }

  const av   = data?.resposta.dataAvailability ?? {};
  const sev  = data?.resultado.severidades;
  const total = sev?.total || 1;

  const cards = [
    { nome: "TopHosts",   d: data?.cards.topHosts,   status: av?.topHosts },
    { nome: "CIS",        d: data?.cards.cis,         status: av?.cis      },
    { nome: "Firewall",   d: data?.cards.firewall,    status: av?.firewall  },
    { nome: "Incidentes", d: data?.cards.incidents,   status: av?.iris      },
  ];

  return (
    <div
      className="
        fixed bottom-4 right-4 z-[9999]
        w-[400px] max-h-[80vh]
        bg-[#0A0617] border border-[#2D1F4E]
        rounded-xl shadow-2xl shadow-black/60
        flex flex-col overflow-hidden
        font-mono text-xs
      "
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1D1929] bg-[#0D0820] shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-purple-300 font-bold text-[11px] tracking-wide">
            RISK LEVEL DEBUG
          </span>
          {score !== null && (
            <span
              className={`
                ml-1 px-2 py-0.5 rounded text-[10px] font-bold
                ${score >= 70 ? "bg-red-900/50 text-red-300" :
                  score >= 40 ? "bg-yellow-900/50 text-yellow-300" :
                  "bg-emerald-900/50 text-emerald-300"}
              `}
            >
              {Math.round(score)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {data?.timestamp && (
            <span className="text-gray-600 text-[10px]">{data.timestamp}</span>
          )}
          <button
            onClick={() => setMinimized(true)}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            {/* @ts-ignore */}
            <FiMinus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("__rlDebug");
              setVisible(false);
            }}
            className="text-gray-500 hover:text-red-400 transition-colors"
          >
            {/* @ts-ignore */}
            <FiX className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-purple-900/50">

        {/* FILTRO */}
        <Section title="Filtro Ativo" accent="#A855F7">
          <Row label="Label"   value={data?.filtro.label   ?? "—"} valueClass="text-purple-300 font-bold" />
          <Row label="Dias"    value={data?.filtro.dias    ?? "—"} />
          <Row label="Período" value={
            data?.filtro.periodo
              ? <span className="text-purple-200">{data.filtro.periodo.from}<br />→ {data.filtro.periodo.to}</span>
              : <span className="text-gray-500">—</span>
          } />
          <Row label="Query"   value={<span className="text-blue-300 break-all">{data?.filtro.queryParams ?? "—"}</span>} />
        </Section>

        {/* DISPONIBILIDADE */}
        <Section title="Disponibilidade dos Dados" accent="#60A5FA">
          {Object.keys(av).length === 0
            ? <span className="text-gray-500">sem dados</span>
            : Object.entries(av).map(([k, v]) => (
              <Row
                key={k}
                label={k}
                value={String(v)}
                valueClass={statusColor(String(v))}
              />
            ))
          }
          <Row label="Janela baseline" value={data?.resposta.janela ?? "—"} valueClass="text-yellow-300" />
          <Row label="Warmup"         value={data?.resposta.warmup === null ? "—" : String(data?.resposta.warmup)} />
        </Section>

        {/* FILTROS USADOS */}
        {data?.resposta.filtrosUsados && (
          <Section title="Filtros Usados (backend)" accent="#FBBF24">
            {Object.entries(data.resposta.filtrosUsados).map(([k, v]) => (
              <Row key={k} label={k} value={String(v)} valueClass="text-yellow-200" />
            ))}
          </Section>
        )}

        {/* CÁLCULO POR CARD */}
        <Section title="Cálculo por Card" accent="#34D399">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-gray-500 border-b border-white/5">
                <th className="text-left pb-1">Card</th>
                <th className="text-right pb-1">Raw</th>
                <th className="text-right pb-1">Baseline</th>
                <th className="text-right pb-1">Risco</th>
                <th className="text-right pb-1">Status</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(({ nome, d, status }) => (
                <tr key={nome} className="border-b border-white/[0.03]">
                  <td className="py-0.5 text-gray-400">{nome}</td>
                  <td className="py-0.5 text-right text-gray-200">{fmt(d?.raw ?? null, 0)}</td>
                  <td className="py-0.5 text-right text-gray-200">{fmt(d?.baseline ?? null)}</td>
                  <td className={`py-0.5 text-right font-bold ${riscoColor(d?.risco ?? null)}`}>
                    {fmt(d?.risco ?? null, 4)}
                  </td>
                  <td className={`py-0.5 text-right ${statusColor(status)}`}>
                    {status ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* RESULTADO */}
        <Section title="Resultado" accent="#F472B6">
          <Row
            label="Índice de Risco"
            value={score !== null ? Math.round(score) : "—"}
            valueClass={`font-bold text-lg ${
              (score ?? 0) >= 70 ? "text-red-400" :
              (score ?? 0) >= 40 ? "text-yellow-400" :
              "text-emerald-400"
            }`}
          />
          {sev && (
            <>
              <div className="border-t border-white/5 mt-1 pt-1" />
              <Row label="Crítico" value={`${sev.critico}  (${Math.round((sev.critico / total) * 100)}%)`} valueClass="text-red-400" />
              <Row label="Alto"    value={`${sev.alto}  (${Math.round((sev.alto    / total) * 100)}%)`} valueClass="text-orange-400" />
              <Row label="Médio"   value={`${sev.medio}  (${Math.round((sev.medio  / total) * 100)}%)`} valueClass="text-yellow-400" />
              <Row label="Baixo"   value={`${sev.baixo}  (${Math.round((sev.baixo  / total) * 100)}%)`} valueClass="text-emerald-400" />
              <div className="border-t border-white/5 mt-1 pt-1" />
              <Row label="Total" value={sev.total} valueClass="text-white font-bold" />
            </>
          )}
        </Section>

      </div>
    </div>
  );
}
