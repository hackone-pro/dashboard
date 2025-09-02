// src/pages/Incidentes.tsx
import { useEffect, useMemo, useState } from "react";
import LayoutModel from "../componentes/LayoutModel";
import DescricaoFormatada from "../componentes/iris/DescricaoFormatada";

import { getTenant } from "../services/wazuh/tenant.service";
import { getTodosCasos, Incidente as ServiceIncidente } from "../services/iris/cases.service";
import { getToken } from "../utils/auth";
import { useSearchParams } from "react-router-dom";

import type { IconType } from "react-icons";
import { GoGraph } from "react-icons/go";
import { RiQuestionLine, RiProgress5Line } from "react-icons/ri";
import { FaLockOpen, FaRegCheckCircle } from "react-icons/fa";
import { IoStopCircleOutline } from "react-icons/io5";
import { MdOutlineGppBad, MdOutlineHealthAndSafety } from "react-icons/md";
import { GrTroubleshoot } from "react-icons/gr";
import { TbMessageReport } from "react-icons/tb";

/* ================= owners & utils ================= */
const OWNER_EXTRA = "automation_n8n";
const PAGE_SIZE = 10; // 10 por página (fixo)

const normaliza = (s?: string) =>
  (s || "")
    .normalize("NFD")
    // @ts-ignore unicode property
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();

function extractOwner(i: any): string | undefined {
  return (
    i.owner ??
    i.owner_name ??
    i.ownerUser ??
    i.owner_user ??
    i.assigned_to ??
    undefined
  );
}

// client do incidente (payload IRIS usa client_name)
function extractIncidentClient(i: any): string | undefined {
  return i.client_name ?? i.client ?? i.customer_name ?? i.tenant_name ?? undefined;
}

/* ================= tipos locais ================= */
type PageIncidente = ServiceIncidente & {
  owner?: string;
  owner_name?: string;
  opened_by?: string;
  state_name?: string;
  case_close_date?: string;
  case_uuid?: string;
  case_soc_id?: string;
};

type StatusMeta = {
  label: string;
  Icon: IconType;
  color: string;
};

export default function Incidentes() {
  const token = getToken();

  const [dados, setDados] = useState<PageIncidente[]>([]);
  const [filtroDias, setFiltroDias] = useState<number>(0); // Hoje
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [expandido, setExpandido] = useState<number | string | null>(null);
  const [irisUrl, setIrisUrl] = useState<string>("");

  // paginação (fixo 10 por página)
  const [page, setPage] = useState(1);

  // query string (?open=ID)
  const [searchParams] = useSearchParams();
  const openFromQS = searchParams.get("open");

  const STATUS_MAP: Record<string, StatusMeta> = {
    open: { label: "Aberto", Icon: FaLockOpen, color: "text-emerald-400" },
    "in progress": { label: "Em progresso", Icon: RiProgress5Line, color: "text-[#744CD8]" },
    containment: { label: "Contenção", Icon: IoStopCircleOutline, color: "text-[#D0592E]" },
    eradication: { label: "Erradicação", Icon: MdOutlineGppBad, color: "text-[#D35555]" },
    recovery: { label: "Recuperação", Icon: MdOutlineHealthAndSafety, color: "text-[#5EC059]" },
    "post-incident": { label: "Pós-incidente", Icon: GrTroubleshoot, color: "text-[#59C0B4]" },
    reporting: { label: "Reportando", Icon: TbMessageReport, color: "text-[#C0598B]" },
    closed: { label: "Fechado", Icon: FaRegCheckCircle, color: "text-[#1DD69A]" },
    unspecified: { label: "Não especificado", Icon: RiQuestionLine, color: "text-[#D5974F]" },
  };

  const DEFAULT_STATUS: StatusMeta = { label: "—", Icon: RiQuestionLine, color: "text-gray-400" };

  function getStatusMeta(s?: string): StatusMeta {
    const v = (s ?? "").toLowerCase().trim();
    return STATUS_MAP[v] ?? { ...DEFAULT_STATUS, label: s || "—" };
  }

  // ====== lógica de nível (mesma do TopIncidentes) ======

  // Detecta nível no NOME (casos da IA), ex: "[hh:mm - dd/mm/aaaa] - Alto - ..."
  function detectarNivelPorNome(nome: string): string | null {
    const match = nome.match(
      /\[\d{2}:\d{2}\s*-\s*\d{2}\/\d{2}\/\d{4}\]\s*-\s*(Baixo|Baixa|M[eé]dio|M[eé]dia|Alto|Alta|Cr[ií]tico|Cr[ií]tica)/i
    );
    return match ? match[1] : null;
  }

  // Remove "#1098 - " e também o prefixo "[hora - data] - Nível - " do título
  function formatCaseName(name: string) {
    return name
      .replace(/^\s*#\s*\d+\s*-\s*/i, "")
      .replace(
        /\[\d{2}:\d{2}\s*-\s*\d{2}\/\d{2}\/\d{4}\]\s*-\s*(Baixo|Baixa|M[eé]dio|M[eé]dia|Alto|Alta|Cr[ií]tico|Cr[ií]tica)\s*-\s*/i,
        ""
      )
      .trim();
  }

  // Fallback: mapeia pelo classification_id
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

  // Suporta masculino e feminino (Baixo/Baixa, Médio/Média, ...), igual ao TopIncidentes
  function getCorBadge(nivel: string) {
    switch (nivel) {
      case "Crítico":
      case "Crítica":
        return "badge-pink";
      case "Alto":
      case "Alta":
        return "badge-high";
      case "Médio":
      case "Média":
        return "badge-darkpink";
      case "Baixo":
      case "Baixa":
        return "badge-green";
      default:
        return "bg-gray-500";
    }
  }

  useEffect(() => {
    let ativo = true;
    async function fetch() {
      try {
        setCarregando(true);
        setErro(null);
        setExpandido(null);

        const tenant = await getTenant();
        setIrisUrl(tenant?.iris_url || "");
        const alvoOwnerTenant = normaliza(tenant?.owner_name);
        const alvoOwnerExtra = normaliza(OWNER_EXTRA);
        const alvoClienteTenant = normaliza(tenant?.cliente_name); // seu campo no Strapi

        if (!tenant?.cliente_name) {
          console.warn("[Incidentes] tenant.cliente_name ausente — bloqueando listagem por segurança.");
          setDados([]);
          setCarregando(false);
          return;
        }

        const listaBruta = await getTodosCasos(token || "");
        const src: any = listaBruta as any;
        const lista: PageIncidente[] = Array.isArray(src)
          ? src
          : Array.isArray(src?.data)
            ? src.data
            : Array.isArray(src?.results)
              ? src.results
              : Array.isArray(src?.items)
                ? src.items
                : [];

        // Filtro final: (owner = você OU automation_n8n) E (client_name = tenant.cliente_name)
        const doOwnerECliente = lista.filter((i) => {
          const dono = normaliza(extractOwner(i));
          const clienteIncidente = normaliza(extractIncidentClient(i));
          const matchOwner = dono === alvoOwnerTenant || dono === alvoOwnerExtra;
          const matchCliente = clienteIncidente === alvoClienteTenant;
          return matchOwner && matchCliente;
        });

        // Filtro de datas
        const filtrado = filtrarPorDias(doOwnerECliente, filtroDias);

        // Ordenação desc por data de abertura
        filtrado.sort(
          (a, b) =>
            parseDateBR(b.case_open_date).getTime() -
            parseDateBR(a.case_open_date).getTime()
        );

        if (!ativo) return;
        setDados(filtrado);
        setPage(1); // reset página ao recarregar dados/filtro
      } catch (e: any) {
        if (!ativo) return;
        setErro(e?.message ?? "Erro ao carregar incidentes");
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    fetch();
    return () => {
      ativo = false;
    };
  }, [token, filtroDias]);

  // paginação (fixo 10 por página)
  const total = dados.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const clampPage = (p: number) => Math.min(Math.max(1, p), totalPages);

  useEffect(() => {
    setPage((p) => clampPage(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const start = (page - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const linhas = useMemo(() => dados.slice(start, end), [dados, start, end]);

  const toggle = (id: number | string) => setExpandido((cur) => (cur === id ? null : id));

  // 🔗 Deep-link: quando há ?open=ID, navegar até a página do item e abrir o acordeão
  useEffect(() => {
    if (!openFromQS) return;
    const alvo = Number(openFromQS);
    if (Number.isNaN(alvo) || dados.length === 0) return;

    // Encontrar índice do item na lista completa
    const idx = dados.findIndex((i) => Number(i.case_id) === alvo);
    if (idx === -1) return;

    // Página onde o item está
    const pageDoItem = Math.floor(idx / PAGE_SIZE) + 1;

    // Se ainda não estamos na página, ir para ela
    setPage((p) => (p === pageDoItem ? p : pageDoItem));

    // Abrir após a página correta renderizar
    const t = setTimeout(() => {
      setExpandido(alvo);
      const el = document.querySelector(`[data-case-id="${alvo}"]`);
      if (el) (el as HTMLElement).scrollIntoView({ behavior: "smooth", block: "center" });
    }, 0);

    return () => clearTimeout(t);
  }, [openFromQS, dados]);

  return (
    <LayoutModel titulo="Incidentes">
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
                onChange={(e) => setFiltroDias(Number(e.target.value))}
              >
                <option value={1}>Hoje</option>
                <option value={7}>7 dias</option>
                <option value={15}>15 dias</option>
                <option value={30}>30 dias</option>
                <option value={0}>Todos</option>
              </select>
            </label>

            <div className="text-xs text-gray-400">
              {total > 0 ? (
                <>
                  Mostrando <span className="text-gray-2 00">{start + 1}</span>–<span className="text-gray-200">{end}</span> de <span className="text-gray-200">{total}</span>
                </>
              ) : (
                <>Mostrando 0 de 0</>
              )}
            </div>

            {/* Controles de paginação simples */}
            <div className="flex gap-2">
              <button
                className="px-2 py-1 btn hover:bg-purple-600 text-[12px] text-white rounded-md disabled:opacity-40"
                onClick={() => setPage((p) => clampPage(p - 1))}
                disabled={page <= 1}
              >
                ← Anterior
              </button>
              <button
                className="px-2 py-1 btn hover:bg-purple-600 text-[12px] text-white rounded-md disabled:opacity-40"
                onClick={() => setPage((p) => clampPage(p + 1))}
                disabled={page >= totalPages}
              >
                Próxima →
              </button>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="cards rounded-2xl overflow-hidden">
          {/* Cabeçalho */}
          <div className="grid grid-cols-12 px-5 py-5 bg-[#0A0617] text-xs text-gray-300">
            <div className="col-span-1 text-center border-[#1D1929] border-r-2 text-[14px]">ID do Incidente</div>
            <div className="col-span-2 text-center border-[#1D1929] border-r-2 text-[14px]">Data</div>
            <div className="col-span-4 text-center border-[#1D1929] border-r-2 text-[14px]">Descrição</div>
            <div className="col-span-2 text-center border-[#1D1929] border-r-2 text-[14px]">Severidade</div>
            <div className="col-span-1 text-center border-[#1D1929] border-r-2 text-[14px]">Status</div>
            <div className="col-span-2 text-center border-[#1D1929] border-r-2 text-[14px]">Ação</div>
          </div>

          {/* Corpo */}
          {carregando ? (
            <ListaSkeleton />
          ) : erro ? (
            <div className="p-5 text-xs text-red-400 bg-red-950/30 border-t border-red-900">
              {erro}
            </div>
          ) : linhas.length === 0 ? (
            <div className="p-5 text-xs text-gray-400">Nenhum incidente encontrado.</div>
          ) : (
            <div className="divide-y divide-[#ffffff12]">
              {linhas.map((inc) => {
                const id = inc.case_id;
                const aberto = expandido === id;

                const dataBR = inc.case_open_date; // "MM/DD/YYYY"
                const agenteOrigem = inc.case_name;

                // 👇 prioridade: nível no nome (IA) > fallback por classification_id
                const nivelManual = detectarNivelPorNome(inc.case_name || "");
                const nivel = nivelManual || mapNivelPorClassificationId(inc.classification_id as any);
                const badge = getCorBadge(nivel);
                const status = statusPT(inc.state_name);

                const meta = getStatusMeta(inc.state_name);
                const StatusIcon = meta.Icon;

                return (
                  <div key={String(id)} className="group" data-case-id={String(id)}>
                    {/* Linha */}
                    <div
                      className={`grid grid-cols-12 px-5 py-4 items-center ${aberto ? "bg-[#2a2250]" : "hover:bg-[#ffffff07]"
                        } transition-colors`}
                    >
                      <div className="col-span-1 text-center text-sm text-gray-400 truncate">
                        {irisUrl ? (
                          <a
                            href={`${irisUrl}/case?cid=${id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:underline"
                          >
                            #{id}
                          </a>
                        ) : (
                          <>#{id}</>
                        )}
                      </div>
                      <div className="col-span-2 text-center text-xs text-gray-400">
                        {dataBR}
                      </div>
                      <div className="col-span-4 text-center text-xs text-gray-400 truncate">
                        {formatCaseName(agenteOrigem || "") || "—"}
                      </div>
                      <div className="col-span-2 text-center">
                        <span className={`text-[11px] px-2 py-0.5 rounded-md badge ${badge}`}>
                          {nivel}
                        </span>
                      </div>

                      {/* Status com ícone + cor */}
                      <div className="col-span-1 text-center">
                        <span className="inline-flex items-center justify-center gap-1 text-xs text-gray-400">
                          {/* @ts-ignore */}
                          <StatusIcon className={`w-4 h-4 ${meta.color}`} />
                          {meta.label}
                        </span>
                      </div>

                      <div className="col-span-2 flex justify-center">
                        <button
                          onClick={() => toggle(id)}
                          className="px-3 py-1.5 btn hover:bg-purple-600 text-[12px] text-white rounded-md"
                        >
                          {aberto ? "Recolher —" : "Ver detalhes  +"}
                        </button>
                      </div>
                    </div>

                    {/* Accordion */}
                    {aberto && (
                      <div className="px-5 py-5 bg-[#2a2250]">
                        <div className="rounded-xl p-5 bg-[#1b1730] border border-[#3B2A70] space-y-5">
                          <Secao titulo="Resumo">
                            <Linha label="Título:" valor={formatCaseName(inc.case_name)} />
                            <div className="mt-2">
                              <DescricaoFormatada texto={inc.case_description} />
                            </div>
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
                            <Linha
                              label="Classification ID:"
                              valor={
                                (inc as any).classification_id != null
                                  ? String((inc as any).classification_id)
                                  : "—"
                              }
                            />
                            <Linha label="Classification:" valor={(inc as any).classification || "—"} />
                            <Linha label="Severidade (mapeada):" valor={nivel} />
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
    </LayoutModel>
  );
}

/* ================= helpers ================= */

function parseDateBR(d: string) {
  // "MM/DD/YYYY" -> Date
  const [mes, dia, ano] = d.split("/");
  return new Date(`${ano}-${mes}-${dia}`);
}

function filtrarPorDias(lista: PageIncidente[], dias: number) {
  if (dias === 0) return lista; // todos
  if (dias === 1) {
    // hoje
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return lista.filter((i) => {
      const d = parseDateBR(i.case_open_date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === hoje.getTime();
    });
  }
  // últimos X dias (inclui hoje)
  const hoje = new Date();
  const limite = new Date(hoje);
  limite.setDate(hoje.getDate() - (dias - 1));
  limite.setHours(0, 0, 0, 0);
  return lista.filter((i) => parseDateBR(i.case_open_date) >= limite);
}

function getCorBadge(nivel: string) {
  switch (nivel) {
    case "Crítico":
    case "Crítica":
      return "badge-pink";
    case "Alto":
    case "Alta":
      return "badge-high";
    case "Médio":
    case "Média":
      return "badge-darkpink";
    case "Baixo":
    case "Baixa":
      return "badge-green";
    default:
      return "bg-gray-500";
  }
}

function statusPT(s?: string) {
  switch ((s || "").toLowerCase()) {
    case "open":
      return "Aberto";
    case "resolved":
      return "Resolvido";
    case "assigned":
      return "Atribuído";
    case "closed":
      return "Fechado";
    default:
      return s || "—";
  }
}

/* ============== componentes menores ============== */

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
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
        <div
          key={i}
          className="grid grid-cols-12 px-5 py-4 items-center border-t border-[#ffffff12]"
        >
          <div className="col-span-3">
            <div className="h-4 w-28 bg-[#ffffff0a] rounded animate-pulse" />
          </div>
          <div className="col-span-2">
            <div className="h-4 w-16 bg-[#ffffff0a] rounded animate-pulse" />
          </div>
          <div className="col-span-3">
            <div className="h-4 w-40 bg-[#ffffff0a] rounded animate-pulse" />
          </div>
          <div className="col-span-2">
            <div className="h-5 w-16 bg-[#ffffff0a] rounded animate-pulse" />
          </div>
          <div className="col-span-1">
            <div className="h-4 w-16 bg-[#ffffff0a] rounded animate-pulse" />
          </div>
          <div className="col-span-1 flex justify-end">
            <div className="h-7 w-24 bg-[#ffffff0a] rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
