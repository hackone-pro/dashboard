// src/pages/Incidentes.tsx
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import LayoutModel from "../componentes/LayoutModel";
import DescricaoFormatada from "../componentes/iris/DescricaoFormatada";
import GraficoDonutIncidentes from "../componentes/graficos/GraficoDonutIncidentes";

import { getTenant } from "../services/wazuh/tenant.service";
import { getTodosCasos } from "../services/iris/cases.service";
import { getToken } from "../utils/auth";

import { GoGraph } from "react-icons/go";
import { RiQuestionLine, RiProgress5Line } from "react-icons/ri";
import { FaLockOpen, FaRegCheckCircle, FaSort } from "react-icons/fa";
import { HiLockClosed } from "react-icons/hi";
import { IoStopCircleOutline } from "react-icons/io5";
import { MdOutlineGppBad, MdOutlineHealthAndSafety } from "react-icons/md";
import { GrTroubleshoot } from "react-icons/gr";
import { TbMessageReport } from "react-icons/tb";
import { VscError } from "react-icons/vsc";
import { FiRotateCcw } from "react-icons/fi";

import { useTenant } from "../context/TenantContext";

import {
  normaliza,
  extractOwner,
  extractIncidentClient,
  parseDateBR,
  formatDateBR,
  filtrarPorDias,
  getCorBadge,
  statusPT,
  agruparPorSeveridade,
  detectarNivelPorNome,
  formatCaseName,
  sentenceCase,
} from "../utils/incidentes/helpers";

import type { IconType } from "react-icons";
import type { PageIncidente } from "../types/incidentes.types";

/* =========================================
 * CONSTANTES & TYPES
 * ======================================= */
const PAGE_SIZE = 10;

type SortKey = "id" | "data" | "severidade" | "status";
type SortDir = "asc" | "desc";

type StatusMeta = { label: string; Icon: IconType; color: string };

const STATUS_MAP: Record<string, StatusMeta> = {
  open: { label: "Aberto", Icon: FaLockOpen, color: "text-gray-500" },
  "in progress": { label: "Em progresso", Icon: RiProgress5Line, color: "text-gray-500" },
  containment: { label: "Contenção", Icon: IoStopCircleOutline, color: "text-gray-500" },
  eradication: { label: "Erradicação", Icon: MdOutlineGppBad, color: "text-gray-500" },
  recovery: { label: "Recuperação", Icon: MdOutlineHealthAndSafety, color: "text-gray-500" },
  "post-incident": { label: "Pós-incidente", Icon: GrTroubleshoot, color: "text-gray-500" },
  reporting: { label: "Reportando", Icon: TbMessageReport, color: "text-gray-500" },
  closed: { label: "Fechado", Icon: FaRegCheckCircle, color: "text-gray-500" },
  unspecified: { label: "Não especificado", Icon: RiQuestionLine, color: "text-gray-500" },
};

const DEFAULT_STATUS: StatusMeta = { label: "—", Icon: RiQuestionLine, color: "text-gray-400" };

const STATUS_ORDER: Record<string, number> = {
  open: 1,
  "in progress": 2,
  containment: 3,
  eradication: 4,
  recovery: 5,
  "post-incident": 6,
  reporting: 7,
  closed: 8,
  unspecified: 9,
};

/* =========================================
 * HELPERS
 * ======================================= */
function getStatusMeta(s?: string): StatusMeta {
  const v = (s ?? "").toLowerCase().trim();
  return STATUS_MAP[v] ?? { ...DEFAULT_STATUS, label: s || "—" };
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

function severidadeRank(nivel: string) {
  const n = (nivel || "").toLowerCase();
  if (n.startsWith("crít")) return 4;
  if (n.startsWith("alto") || n.startsWith("alta")) return 3;
  if (n.startsWith("méd") || n.startsWith("med")) return 2;
  if (n.startsWith("baix")) return 1;
  return 0;
}

function nivelDoIncidente(i: PageIncidente) {
  if (i.severity) {
    const s = i.severity.toLowerCase();
    if (s.includes("crit")) return "Crítico";
    if (s.includes("high") || s.includes("alto")) return "Alto";
    if (s.includes("med")) return "Médio";
    if (s.includes("low") || s.includes("baix")) return "Baixo";
  }

  const manual = detectarNivelPorNome(i.case_name || "");
  if (manual) return manual;

  const nome = (i.case_name || "").toLowerCase();
  if (nome.includes("crít")) return "Crítico";
  if (nome.includes("alto") || nome.includes("alta")) return "Alto";
  if (nome.includes("méd") || nome.includes("media")) return "Médio";
  if (nome.includes("baix")) return "Baixo";

  // 👇 ÚNICO AJUSTE: se não houver classification_id, retorna "Médio"
  if (!i.classification_id) return "Médio";

  return mapNivelPorClassificationId(i.classification_id as any);
}


function matchSeveridade(nivelItem: string, filtro: string) {
  const norm = (txt: string) =>
    (txt || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // remove acentos

  const a = norm(nivelItem);
  const b = norm(filtro);

  // trata equivalências de gênero, plural e inglês
  if (a.startsWith("crit") && b.startsWith("crit")) return true;
  if (a.startsWith("alt") && b.startsWith("alt")) return true;
  if (a.startsWith("med") && b.startsWith("med")) return true;
  if (a.startsWith("baix") && b.startsWith("baix")) return true;
  return false;
}

/* =========================================
 * COMPONENTES AUXILIARES
 * ======================================= */
function SortableHeader({ label, active, dir, onClick }: {
  label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1 hover:text-white transition-colors w-full"
      title={active ? `Ordenado por ${label} (${dir})` : `Ordenar por ${label}`}
    >
      <span>{label}</span>
      {/* @ts-ignore */}
      <FaSort
        className={[
          "text-[12px] transition-transform",
          active ? "opacity-100" : "opacity-60",
          active && dir === "desc" ? "rotate-180" : "rotate-0",
        ].join(" ")}
      />
    </button>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm text-white font-semibold mb-2 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
        {titulo}
      </h4>
      <div className="pl-0 space-y-1">{children}</div>
    </div>
  );
}

function Linha({ label, valor }: { label: string; valor?: string }) {
  return (
    <p className="text-sm text-gray-300">
      <span className="text-gray-400">{label} </span>
      <span className="text-gray-200">{valor || "—"}</span>
    </p>
  );
}

function ListaSkeleton() {
  return (
    <div className="p-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 px-5 py-4 items-center border-t border-[#ffffff12]">
          <div className="col-span-3 h-4 w-28 bg-[#ffffff0a] rounded animate-pulse" />
          <div className="col-span-2 h-4 w-16 bg-[#ffffff0a] rounded animate-pulse" />
          <div className="col-span-3 h-4 w-40 bg-[#ffffff0a] rounded animate-pulse" />
          <div className="col-span-2 h-5 w-16 bg-[#ffffff0a] rounded animate-pulse" />
          <div className="col-span-1 h-4 w-16 bg-[#ffffff0a] rounded animate-pulse" />
          <div className="col-span-1 h-7 w-24 bg-[#ffffff0a] rounded animate-pulse ml-auto" />
        </div>
      ))}
    </div>
  );
}

/* =========================================
 * PÁGINA: INCIDENTES
 * ======================================= */
export default function Incidentes() {
  const { tenantAtivo } = useTenant();
  const token = getToken();
  const [dados, setDados] = useState<PageIncidente[]>([]);
  const [filtroDias, setFiltroDias] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<number | string | null>(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [filtroSeveridade, setFiltroSeveridade] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const openFromQS = searchParams.get("open");

  const [irisUrl, setIrisUrl] = useState("");
  const [tenantOwner, setTenantOwner] = useState("");
  const [filtroOrigem, setFiltroOrigem] = useState<"abertos" | "fechados" | "atribuidos" | "nao_atribuidos" | null>(null);
  const [chartResetKey, setChartResetKey] = useState(0);
  const [animReady, setAnimReady] = useState(false);

  // Quando dados forem carregados, aplica o expandido via querystring
  useEffect(() => {
    if (openFromQS && dados.length > 0) {
      setExpandido(Number(openFromQS));
    }
  }, [openFromQS, dados]);

  useEffect(() => {
    if (openFromQS && dados.length > 0) {
      const id = Number(openFromQS);
      setExpandido(id);

      // scroll até o elemento
      setTimeout(() => {
        const el = document.getElementById(`incidente-${id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300); // pequeno delay pra garantir render
    }
  }, [openFromQS, dados]);


  // Fetch dados
  useEffect(() => {
    if (!tenantAtivo) return;

    let ativo = true;
    async function fetch() {
      try {
        setCarregando(true);
        setErro(null);
        setAnimReady(false);
        setExpandido(null);

        const inicio = Date.now();
        const tenant = await getTenant();
        setIrisUrl(tenant?.iris_url || "");
        setTenantOwner(tenant?.owner_name || "");

        if (!tenant?.cliente_name) {
          console.warn("[Incidentes] tenant.cliente_name ausente");
          setDados([]);
          return;
        }

        const lista: PageIncidente[] = await getTodosCasos(token || "");
        const filtrado = filtrarPorDias(
          lista.filter(i => normaliza(extractIncidentClient(i)) === normaliza(tenant.cliente_name)),
          filtroDias
        );
        const baseLimpa = filtrado.filter(i => nivelDoIncidente(i) !== "Baixo" || i.severity?.toLowerCase() === "low");
        filtrado.sort((a, b) => Number(b.case_id) - Number(a.case_id));

        const elapsed = Date.now() - inicio;
        const delay = Math.max(500 - elapsed, 0);

        setTimeout(() => {
          if (ativo) {
            setDados(baseLimpa);
            setPage(1);
            setAnimReady(true);
          }
        }, delay);
      } catch (e: any) {
        console.error("[Incidentes] erro fetch", e);
        if (ativo) setErro(e?.message ?? "Erro ao carregar incidentes");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    fetch();
    return () => { ativo = false; };
  }, [token, filtroDias, tenantAtivo]);

  // Paginação
  const total = dados.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const clampPage = (p: number) => Math.min(Math.max(1, p), totalPages);

  useEffect(() => { setPage(p => clampPage(p)); }, [totalPages]);
  useEffect(() => { setPage(1); }, [sortBy, sortDir]);

  // Ordenação
  const ordenados = useMemo(() => {
    return [...dados].sort((a, b) => {
      let va = 0, vb = 0;
      if (sortBy === "id") {
        va = Number(a.case_id) || 0; vb = Number(b.case_id) || 0;
      } else if (sortBy === "data") {
        va = parseDateBR(a.case_open_date).getTime();
        vb = parseDateBR(b.case_open_date).getTime();
      } else if (sortBy === "severidade") {
        va = severidadeRank(nivelDoIncidente(a));
        vb = severidadeRank(nivelDoIncidente(b));
      } else if (sortBy === "status") {
        const sa = (a.state_name || "").toLowerCase().trim();
        const sb = (b.state_name || "").toLowerCase().trim();
        va = STATUS_ORDER[sa] ?? 999;
        vb = STATUS_ORDER[sb] ?? 999;
      }
      const cmp = va === vb ? 0 : va < vb ? -1 : 1;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [dados, sortBy, sortDir]);

  const start = (page - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const linhas = useMemo(() => {
    let base = [...ordenados];

    // 👇 aplica filtro de severidade se existir
    if (filtroSeveridade) {
      base = base.filter(i =>
        matchSeveridade(nivelDoIncidente(i), filtroSeveridade) &&
        (
          filtroOrigem === "abertos"
            ? (i.state_name || "").toLowerCase() === "open"
            : filtroOrigem === "fechados"
              ? (i.state_name || "").toLowerCase() === "closed"
              : filtroOrigem === "atribuidos"
                ? normaliza(extractOwner(i)) === normaliza(tenantOwner)
                : filtroOrigem === "nao_atribuidos"
                  ? normaliza(extractOwner(i)) !== normaliza(tenantOwner)
                  : true
        )
      );
    }

    return base.slice(start, end);
  }, [ordenados, start, end, filtroSeveridade]);

  const baseTabela = useMemo(() => {
    return [...dados].filter(i => {
      const nivel = nivelDoIncidente(i);
      // descarta "Baixo" se não tiver severity real "low"
      if (nivel === "Baixo" && !(i.severity?.toLowerCase() === "low")) return false;
      return true;
    });
  }, [dados]);

  // Subconjuntos para gráficos
  const abertos = baseTabela.filter(i =>
    (i.state_name || "").toLowerCase() === "open" || ""
  );

  const fechados = baseTabela.filter(i =>
    (i.state_name || "").toLowerCase() === "closed"
  );

  const atribuidos = baseTabela.filter(i =>
    normaliza(extractOwner(i)) === normaliza(tenantOwner)
  );

  const naoAtribuidos = baseTabela.filter(i =>
    normaliza(extractOwner(i)) !== normaliza(tenantOwner)
  );

  useEffect(() => {
    const resumo = baseTabela.reduce((acc, i) => {
      const n = nivelDoIncidente(i);
      acc[n] = (acc[n] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [baseTabela]);

  /* -----------------------------------------
   * RENDER
   * --------------------------------------- */
  return (
    <LayoutModel titulo="Incidentes">
      {/* Gráficos resumo */}
      <div>
        <div className="flex justify-end mt-5 mb-3 px-6">
          <button
            onClick={() => {
              setFiltroSeveridade(null);
              setFiltroOrigem(null);
              setChartResetKey((k) => k + 1); // 🔁 força recriação dos gráficos
            }}
            className="flex items-center gap-1 text-[14px] text-purple-400 hover:text-purple-200 transition-colors"
          >
            {/* @ts-ignore */}
            <FiRotateCcw className="w-4 h-4" />
            Limpar filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <GraficoDonutIncidentes
            key={`abertos-${chartResetKey}`}
            titulo={<span className="flex items-center gap-1">
              {/* @ts-ignore */}
              <FaLockOpen className="text-gray-400" /> Incidentes abertos</span>}
            total={abertos.length}
            valores={agruparPorSeveridade(abertos, nivelDoIncidente)}
            onFiltrarPorNivel={(nivel) => {
              if (!nivel) {
                setFiltroSeveridade(null);
                setFiltroOrigem(null);
              } else {
                setFiltroSeveridade(nivel);
                setFiltroOrigem("abertos"); // ou "fechados"
              }
            }}
          />

          <GraficoDonutIncidentes
            key={`fechados-${chartResetKey}`}
            titulo={<span className="flex items-center gap-1">
              {/* @ts-ignore */}
              <HiLockClosed className="text-gray-400" /> Incidentes fechados</span>}
            total={fechados.length}
            valores={agruparPorSeveridade(fechados, nivelDoIncidente)}
            onFiltrarPorNivel={(nivel) => {
              if (filtroSeveridade === nivel && filtroOrigem === "fechados") {
                setFiltroSeveridade(null);
                setFiltroOrigem(null);
              } else {
                setFiltroSeveridade(nivel);
                setFiltroOrigem("fechados");
              }
            }}
          />

          <GraficoDonutIncidentes
            key={`atribuidos-${chartResetKey}`}
            titulo={<span className="flex items-center gap-1">
              {/* @ts-ignore */}
              <FaRegCheckCircle className="text-gray-400" /> Incidentes atribuídos</span>}
            total={atribuidos.length}
            valores={agruparPorSeveridade(atribuidos, nivelDoIncidente)}
            onFiltrarPorNivel={(nivel) => {
              if (!nivel) {
                setFiltroSeveridade(null);
                setFiltroOrigem(null);
              } else {
                setFiltroSeveridade(nivel);
                setFiltroOrigem("atribuidos");
              }
            }}
          />

          <GraficoDonutIncidentes
            key={`naoatribuidos-${chartResetKey}`}
            titulo={<span className="flex items-center gap-1">
              {/* @ts-ignore */}
              <VscError className="text-gray-400" /> Incidentes não atribuídos</span>}
            total={naoAtribuidos.length}
            valores={agruparPorSeveridade(naoAtribuidos, nivelDoIncidente)}
            onFiltrarPorNivel={(nivel) => {
              if (!nivel) {
                setFiltroSeveridade(null);
                setFiltroOrigem(null);
              } else {
                setFiltroSeveridade(nivel);
                setFiltroOrigem("nao_atribuidos");
              }
            }}
          />
        </div>

        {/* Tabela */}
        <section className="cards p-6 rounded-2xl shadow-lg">
          {/* Header */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
            <div className="flex items-center gap-2">
              {/* @ts-ignore */}
              <GoGraph className="flex text-[#744CD8] size-[20px]" />
              <h2 className="text-white">Incidentes — Nível de Detalhe</h2>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-400">
                Intervalo:&nbsp;
                <select
                  className="bg-[#0d0c22] text-white text-xs px-2 py-1 rounded-md border border-[#cacaca31]"
                  value={filtroDias}
                  onChange={e => setFiltroDias(Number(e.target.value))}
                >
                  <option value={1}>Hoje</option>
                  <option value={7}>7 dias</option>
                  <option value={15}>15 dias</option>
                  <option value={30}>30 dias</option>
                  <option value={0}>Todos</option>
                </select>
              </label>
              <div className="text-xs text-gray-400">
                {total > 0 ? <>Mostrando <span className="text-gray-200">{start + 1}</span>–<span className="text-gray-200">{end}</span> de <span className="text-gray-200">{total}</span></> : <>Mostrando 0 de 0</>}
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 btn hover:bg-purple-600 text-[12px] text-white rounded-md disabled:opacity-40" onClick={() => setPage(p => clampPage(p - 1))} disabled={page <= 1}>← Anterior</button>
                <button className="px-2 py-1 btn hover:bg-purple-600 text-[12px] text-white rounded-md disabled:opacity-40" onClick={() => setPage(p => clampPage(p + 1))} disabled={page >= totalPages}>Próxima →</button>
              </div>
            </div>
          </div>

          {/* Cabeçalho tabela */}
          <div className="cards rounded-2xl overflow-hidden table-incidente">
            <div className="grid grid-cols-12 px-5 py-5 bg-[#0A0617] text-xs text-gray-300">
              <div className="col-span-1 text-center border-[#1D1929] border-r-2 text-[14px]">
                <SortableHeader label="ID" active={sortBy === "id"} dir={sortDir} onClick={() => setSortBy("id")} />
              </div>
              <div className="col-span-2 text-center border-[#1D1929] border-r-2 text-[14px]">
                <SortableHeader label="Data" active={sortBy === "data"} dir={sortDir} onClick={() => setSortBy("data")} />
              </div>
              <div className="col-span-4 text-center border-[#1D1929] border-r-2 text-[14px]">Descrição</div>
              <div className="col-span-2 text-center border-[#1D1929] border-r-2 text-[14px]">
                <SortableHeader label="Severidade" active={sortBy === "severidade"} dir={sortDir} onClick={() => setSortBy("severidade")} />
              </div>
              <div className="col-span-1 text-center border-[#1D1929] border-r-2 text-[14px]">
                <SortableHeader label="Status" active={sortBy === "status"} dir={sortDir} onClick={() => setSortBy("status")} />
              </div>
              <div className="col-span-2 text-center border-[#1D1929] border-r-2 text-[14px]">Ação</div>
            </div>

            {/* Corpo */}
            {carregando ? (
              <ListaSkeleton />
            ) : erro ? (
              <div className="p-5 text-xs text-red-400 bg-red-950/30 border-t border-red-900">{erro}</div>
            ) : linhas.length === 0 ? (
              <div className="p-5 text-xs text-gray-400">Nenhum incidente encontrado.</div>
            ) : (
              <div className="divide-y divide-[#ffffff12]">
                {linhas.map(inc => {
                  const id = inc.case_id;
                  const aberto = expandido === id;
                  const dataBR = inc.case_open_date;
                  const agenteOrigem = inc.case_name;

                  const nivelManual = detectarNivelPorNome(inc.case_name || "");
                  const nivel = nivelManual || mapNivelPorClassificationId(inc.classification_id as any);
                  const badge = getCorBadge(nivel);
                  const status = statusPT(inc.state_name);

                  const meta = getStatusMeta(inc.state_name);
                  const StatusIcon = meta.Icon;

                  return (
                    <div
                      key={String(id)}
                      id={`incidente-${id}`}
                      className="group"
                      data-case-id={String(id)}
                    >
                      {/* Linha */}
                      <div className={`grid grid-cols-12 px-5 py-4 items-center ${aberto ? "bg-[#2a2250]" : "hover:bg-[#ffffff07]"} transition-colors`}>
                        <div className="col-span-1 text-center text-sm text-gray-400 truncate">
                          {irisUrl ? (
                            <a href={`${irisUrl}/case?cid=${id}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">#{id}</a>
                          ) : <>#{id}</>}
                        </div>
                        <div className="col-span-2 text-center text-xs text-gray-400">{formatDateBR(dataBR)}</div>
                        <div className="col-span-4 text-center text-xs text-gray-400 truncate">
                          #{id} - {formatCaseName(agenteOrigem || "") || "—"}
                        </div>
                        <div className="col-span-2 text-center">
                          <span className={`text-[11px] px-2 py-0.5 rounded-md badge ${badge}`}>{sentenceCase(nivel)}</span>
                        </div>
                        <div className="col-span-1 text-center">
                          <span className="inline-flex items-center justify-center gap-1 text-xs text-gray-400">
                            {/* @ts-ignore */}
                            <StatusIcon className={`w-4 h-4 ${meta.color}`} />{meta.label}
                          </span>
                        </div>
                        <div className="col-span-2 flex justify-center">
                          <button onClick={() => setExpandido(c => (c === id ? null : id))} className="px-3 py-1.5 btn hover:bg-purple-600 text-[12px] text-white rounded-md">
                            {aberto ? "Recolher —" : "Ver detalhes  +"}
                          </button>
                        </div>
                      </div>

                      {/* Accordion */}
                      {aberto && (
                        <div className="px-5 py-5 bg-[#2a2250]">
                          <div className="rounded-xl p-5 bg-[#1b1730] border border-[#3B2A70] space-y-5">
                            <Secao titulo="Resumo">
                              <Linha label="Título:" valor={`#${inc.case_id} - ${formatCaseName(inc.case_name)}`} />
                              <div className="mt-2"><DescricaoFormatada texto={inc.case_description} /></div>
                            </Secao>
                            <Secao titulo="Propriedades">
                              <Linha label="Cliente:" valor={extractIncidentClient(inc) || "—"} />
                              <Linha label="Owner:" valor={extractOwner(inc) || "—"} />
                              <Linha label="Aberto por:" valor={inc.opened_by || "—"} />
                            </Secao>
                            <Secao titulo="Datas">
                              <Linha label="Abertura:" valor={inc.case_open_date || "—"} />
                              <Linha label="Fechamento:" valor={inc.case_close_date || "—"} />
                            </Secao>
                            <Secao titulo="Classificação">
                              <Linha label="Classification ID:" valor={(inc as any).classification_id != null ? String((inc as any).classification_id) : "—"} />
                              <Linha label="Classification:" valor={(inc as any).classification || "—"} />
                              <Linha label="Severidade (mapeada):" valor={sentenceCase(nivel)} />
                              <Linha label="Status:" valor={status} />
                            </Secao>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </LayoutModel>
  );
}