// src/componentes/iris/IncidentesDebugPanel.tsx
//
// Painel de debug visual para a página /incidentes.
// Oculto por padrão — habilite via console do browser:
//
//   __debugINC()        → ativa
//   __debugINC(false)   → desativa
//
// O estado persiste em localStorage ('__incDebug').

import { useEffect, useState } from "react";
import { FiX, FiMinus, FiMaximize2 } from "react-icons/fi";
import type { IncidentesFetchDebug } from "../../hooks/useIncidentes";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface IncidentesDebugProps {
  fetchDebug:       IncidentesFetchDebug | null;
  // filtros UI ativos
  filtroSeveridade: string | null;
  filtroOrigem:     string | null;
  busca:            string;
  sortBy:           string;
  sortDir:          string;
  // paginação
  total:            number;
  totalPages:       number;
  page:             number;
  start:            number;
  end:              number;
  // subconjuntos
  abertos:          number;
  fechados:         number;
  atribuidos:       number;
  naoAtribuidos:    number;
  // período
  periodo:          { from: string; to: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(part: number, total: number) {
  if (!total) return "—";
  return `${Math.round((part / total) * 100)}%`;
}

function reducao(de: number, para: number) {
  if (!de) return "";
  const lost = de - para;
  if (!lost) return <span className="text-emerald-400 ml-1">(sem perda)</span>;
  return <span className="text-yellow-400 ml-1">(-{lost})</span>;
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
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

// ─── Componente principal ─────────────────────────────────────────────────────

export default function IncidentesDebugPanel(props: IncidentesDebugProps) {
  const {
    fetchDebug, filtroSeveridade, filtroOrigem, busca,
    sortBy, sortDir, total, totalPages, page, start, end,
    abertos, fechados, atribuidos, naoAtribuidos, periodo,
  } = props;

  const [visible,   setVisible]   = useState(() => localStorage.getItem("__incDebug") === "1");
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    (window as any).__debugINC = (on = true) => {
      const ativo = Boolean(on);
      localStorage.setItem("__incDebug", ativo ? "1" : "0");
      setVisible(ativo);
      setMinimized(false);
      console.log(
        `%c[DebugINC] painel ${ativo ? "✅ ativado" : "❌ desativado"}`,
        "color:#EC4899;font-weight:bold"
      );
    };
    return () => { delete (window as any).__debugINC; };
  }, []);

  if (!visible) return null;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="
          fixed bottom-4 right-4 z-[9999]
          bg-[#0A0617] border border-pink-700/60
          text-pink-300 text-xs font-mono
          px-3 py-2 rounded-lg shadow-xl
          flex items-center gap-2
          hover:border-pink-500 transition-colors
        "
      >
        <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
        INC Debug
        <span className="text-white font-bold">{total}</span>
        {/* @ts-ignore */}
        <FiMaximize2 className="w-3 h-3 opacity-60" />
      </button>
    );
  }

  const fd = fetchDebug;

  return (
    <div className="
      fixed bottom-4 right-4 z-[9999]
      w-[400px] max-h-[85vh]
      bg-[#0A0617] border border-[#2D1F4E]
      rounded-xl shadow-2xl shadow-black/60
      flex flex-col overflow-hidden
      font-mono text-xs
    ">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1D1929] bg-[#0D0820] shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
          <span className="text-pink-300 font-bold text-[11px] tracking-wide">INCIDENTES DEBUG</span>
          <span className="px-2 py-0.5 rounded bg-pink-900/40 text-pink-200 text-[10px] font-bold">{total}</span>
        </div>
        <div className="flex items-center gap-2">
          {fd?.timestamp && <span className="text-gray-600 text-[10px]">{fd.timestamp}</span>}
          <button onClick={() => setMinimized(true)} className="text-gray-500 hover:text-gray-300 transition-colors">
            {/* @ts-ignore */}
            <FiMinus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => { localStorage.removeItem("__incDebug"); setVisible(false); }}
            className="text-gray-500 hover:text-red-400 transition-colors"
          >
            {/* @ts-ignore */}
            <FiX className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-pink-900/50">

        {/* FILTRO ATIVO */}
        <Section title="Filtro Ativo" accent="#A855F7">
          <Row
            label="Período"
            value={fd?.label ?? "—"}
            valueClass="text-purple-300 font-bold"
          />
          <Row label="from" value={periodo?.from ?? <span className="text-gray-500">—</span>} valueClass="text-blue-300" />
          <Row label="to"   value={periodo?.to   ?? <span className="text-gray-500">—</span>} valueClass="text-blue-300" />
          <div className="border-t border-white/5 mt-1 pt-1" />
          <Row
            label="Severidade"
            value={filtroSeveridade ?? "todos"}
            valueClass={filtroSeveridade ? "text-yellow-300 font-bold" : "text-gray-500"}
          />
          <Row
            label="Origem"
            value={filtroOrigem ?? "todos"}
            valueClass={filtroOrigem ? "text-yellow-300 font-bold" : "text-gray-500"}
          />
          <Row
            label="Busca"
            value={busca || <span className="text-gray-500">—</span>}
            valueClass="text-yellow-200"
          />
        </Section>

        {/* PIPELINE DE FILTRAGEM */}
        <Section title="Pipeline IRIS → Tabela" accent="#34D399">
          {fd ? (
            <>
              {/* Diagrama de funil */}
              <div className="space-y-1.5 mt-0.5">
                {[
                  { label: "Brutos (IRIS)",        count: fd.brutos,         prev: null,           color: "#60A5FA" },
                  { label: "→ Filtro data",         count: fd.aposData,       prev: fd.brutos,       color: "#A855F7" },
                  { label: "→ Filtro cliente",      count: fd.aposCliente,    prev: fd.aposData,     color: "#FBBF24" },
                  { label: "→ Filtro severidade",   count: fd.aposSeveridade, prev: fd.aposCliente,  color: "#34D399" },
                  { label: "→ Filtros UI (tabela)", count: total,             prev: fd.aposSeveridade, color: "#EC4899" },
                ].map(({ label, count, prev, color }) => (
                  <div key={label} className="flex items-center justify-between gap-2">
                    <span className="text-gray-400 shrink-0">{label}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="font-bold" style={{ color }}>{count}</span>
                      {prev !== null && reducao(prev, count)}
                      {prev !== null && prev > 0 && (
                        <span className="text-gray-600 text-[10px]">({pct(count, prev)})</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/5 mt-2 pt-1">
                <Row label="Tenant cliente" value={fd.tenantCliente} valueClass="text-gray-200" />
                <Row label="Fetch"          value={`${fd.elapsedMs} ms`} valueClass={fd.elapsedMs > 3000 ? "text-red-400" : fd.elapsedMs > 1500 ? "text-yellow-400" : "text-emerald-400"} />
                <Row label="IRIS URL"       value={<span className="text-blue-300 break-all">{fd.irisUrl || "—"}</span>} />
              </div>
            </>
          ) : (
            <span className="text-gray-500">aguardando primeiro fetch…</span>
          )}
        </Section>

        {/* SUBCONJUNTOS */}
        <Section title="Subconjuntos (base da tabela)" accent="#F472B6">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-gray-500 border-b border-white/5">
                <th className="text-left pb-1">Grupo</th>
                <th className="text-right pb-1">Qtd</th>
                <th className="text-right pb-1">% do total</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Abertos",        count: abertos,       color: "#A855F7" },
                { label: "Fechados",       count: fechados,      color: "#1DD69A" },
                { label: "Atribuídos",     count: atribuidos,    color: "#60A5FA" },
                { label: "Não atribuídos", count: naoAtribuidos, color: "#FBBF24" },
              ].map(({ label, count, color }) => (
                <tr key={label} className="border-b border-white/[0.03]">
                  <td className="py-0.5" style={{ color }}>{label}</td>
                  <td className="py-0.5 text-right text-white font-bold">{count}</td>
                  <td className="py-0.5 text-right text-gray-400">{pct(count, fd?.aposSeveridade || total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* PAGINAÇÃO */}
        <Section title="Paginação" accent="#60A5FA">
          <Row label="Total filtrado" value={total}      valueClass="text-white font-bold" />
          <Row label="Total páginas"  value={totalPages} />
          <Row label="Página atual"   value={page}       valueClass="text-blue-300 font-bold" />
          <Row label="Registros"      value={`${start + 1} – ${end} de ${total}`} valueClass="text-gray-200" />
        </Section>

        {/* ORDENAÇÃO */}
        <Section title="Ordenação" accent="#FBBF24">
          <Row label="Coluna"  value={sortBy}  valueClass="text-yellow-300 font-bold" />
          <Row label="Direção" value={sortDir} valueClass="text-yellow-200" />
        </Section>

      </div>
    </div>
  );
}
