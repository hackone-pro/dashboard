// src/hooks/useIncidentes.ts
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { getTenant } from "../services/wazuh/tenant.service";
import { getTodosCasos } from "../services/iris/cases.service";
import { getUsuariosTenant } from "../services/user/userstenant.service";
import { getToken } from "../utils/auth";

import {
  normaliza,
  extractOwner,
  extractIncidentClient,
  parseDateBR,
  isIAOwner,
  extrairSeveridadeDoTexto,
} from "../utils/incidentes/helpers";

import { useTenant } from "../context/TenantContext";
import type { PageIncidente } from "../types/incidentes.types";

/* =========================================
 * CONSTANTES
 * ======================================= */
export const PAGE_SIZE = 10;

export type SortKey = "id" | "data" | "severidade" | "status";
export type SortDir = "asc" | "desc";
export type FiltroOrigem = "abertos" | "fechados" | "atribuidos" | "nao_atribuidos" | null;

export const STATUS_ORDER: Record<string, number> = {
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
 * HELPERS INTERNOS
 * ======================================= */
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

export function nivelDoIncidente(i: PageIncidente): "Crítico" | "Alto" | "Médio" | "Baixo" {
  // Prioridade 1 — override manual pelo usuário
  const override = (i as any).severidade_override;
  if (override) {
    const o = override.toLowerCase();
    if (o.startsWith("crít") || o.startsWith("crit")) return "Crítico";
    if (o.startsWith("alt")) return "Alto";
    if (o.startsWith("méd") || o.startsWith("med")) return "Médio";
    if (o.startsWith("baix")) return "Baixo";
  }

  // Prioridade 2 — extrai do texto da descrição (comportamento original)
  const severidadeTexto = extrairSeveridadeDoTexto(i.case_description);
  if (severidadeTexto) return severidadeTexto as "Crítico" | "Alto" | "Médio" | "Baixo";

  return "Médio";
}

export function severidadeRank(nivel: string): number {
  const n = (nivel || "").toLowerCase();
  if (n.startsWith("crít")) return 4;
  if (n.startsWith("alto") || n.startsWith("alta")) return 3;
  if (n.startsWith("méd") || n.startsWith("med")) return 2;
  if (n.startsWith("baix")) return 1;
  return 0;
}

export function matchSeveridade(nivelItem: string, filtro: string): boolean {
  const norm = (txt: string) =>
    (txt || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const a = norm(nivelItem);
  const b = norm(filtro);

  if (a.startsWith("crit") && b.startsWith("crit")) return true;
  if (a.startsWith("alt") && b.startsWith("alt")) return true;
  if (a.startsWith("med") && b.startsWith("med")) return true;
  if (a.startsWith("baix") && b.startsWith("baix")) return true;
  return false;
}

/* =========================================
 * HOOK PRINCIPAL
 * ======================================= */
export interface UseIncidentesReturn {
  // Dados
  dados: PageIncidente[];
  linhas: PageIncidente[];
  usuariosTenant: any[];

  // Subconjuntos para os gráficos
  abertos: PageIncidente[];
  fechados: PageIncidente[];
  atribuidos: PageIncidente[];
  naoAtribuidos: PageIncidente[];

  // Estado de carregamento
  carregando: boolean;
  animReady: boolean;
  erro: string | null;

  // Metadados do tenant
  irisUrl: string;
  tenantOwner: string;

  // Paginação
  page: number;
  total: number;
  totalPages: number;
  start: number;
  end: number;
  setPage: (p: number) => void;
  clampPage: (p: number) => number;

  // Ordenação
  sortBy: SortKey;
  sortDir: SortDir;
  setSortBy: (key: SortKey) => void;
  setSortDir: (dir: SortDir) => void;
  handleSort: (key: SortKey) => void;

  // Filtros
  busca: string;
  setBusca: (v: string) => void;
  filtroSeveridade: string | null;
  setFiltroSeveridade: (v: string | null) => void;
  filtroOrigem: FiltroOrigem;
  setFiltroOrigem: (v: FiltroOrigem) => void;
  periodo: { from: string; to: string } | null;
  setPeriodo: (v: { from: string; to: string } | null) => void;
  limparFiltros: () => void;

  // Ações
  expandido: number | string | null;
  setExpandido: (v: number | string | null) => void;
  atualizarIncidente: (id: number | string, patch: Partial<PageIncidente>) => void;

  // Chave de reset dos gráficos
  chartResetKey: number;
}

export function useIncidentes(): UseIncidentesReturn {
  const { tenantAtivo } = useTenant();
  const token = getToken();
  const [searchParams] = useSearchParams();
  const openFromQS = searchParams.get("open");

  // --- Dados ---
  const [dados, setDados] = useState<PageIncidente[]>([]);
  const [usuariosTenant, setUsuariosTenant] = useState<any[]>([]);

  // --- Loading ---
  const [carregando, setCarregando] = useState(true);
  const [animReady, setAnimReady] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // --- Tenant ---
  const [irisUrl, setIrisUrl] = useState("");
  const [tenantOwner, setTenantOwner] = useState("");

  // --- UI ---
  const [expandido, setExpandido] = useState<number | string | null>(null);
  const [chartResetKey, setChartResetKey] = useState(0);

  // --- Ordenação ---
  const [sortBy, setSortByState] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // --- Filtros ---
  const [busca, setBusca] = useState("");
  const [filtroSeveridade, setFiltroSeveridade] = useState<string | null>(null);
  const [filtroOrigem, setFiltroOrigem] = useState<FiltroOrigem>(null);
  const [periodo, setPeriodo] = useState<{ from: string; to: string } | null>(null);

  // --- Paginação ---
  const [page, setPage] = useState(1);

  /* -----------------------------------------
   * FETCH: Usuários do tenant
   * --------------------------------------- */
  useEffect(() => {
    async function carregarUsuarios() {
      try {
        const lista = await getUsuariosTenant(token || "");
        const filtrados = lista.filter(
          (u: any) => u.owner_name_iris && u.confirmed && !u.blocked
        );
        setUsuariosTenant(filtrados);
      } catch (err) {
        console.error("[useIncidentes] Erro ao buscar usuários", err);
      }
    }
    carregarUsuarios();
  }, [token]);

  /* -----------------------------------------
   * FETCH: Incidentes
   * --------------------------------------- */
  useEffect(() => {
    if (!tenantAtivo) return;

    let ativo = true;

    async function fetchIncidentes() {
      try {
        setCarregando(true);
        setErro(null);
        setAnimReady(false);
        setExpandido(null);

        const inicioFetch = Date.now();

        const tenant = await getTenant();
        setIrisUrl(tenant?.iris_url || "");
        setTenantOwner(tenant?.owner_name || "");

        if (!tenant?.cliente_name) {
          console.warn("[useIncidentes] tenant.cliente_name ausente");
          setDados([]);
          return;
        }

        const lista: PageIncidente[] = await getTodosCasos(
          token || "",
          periodo || undefined
        );

        const filtradoCliente = lista.filter(
          (i) =>
            normaliza(extractIncidentClient(i)) ===
            normaliza(tenant.cliente_name)
        );

        const baseLimpa = filtradoCliente.filter(
          (i) =>
            nivelDoIncidente(i) !== "Baixo" ||
            i.severity?.toLowerCase() === "low"
        );

        baseLimpa.sort((a, b) => Number(b.case_id) - Number(a.case_id));

        const elapsed = Date.now() - inicioFetch;
        const delay = Math.max(500 - elapsed, 0);

        setTimeout(() => {
          if (ativo) {
            setDados(baseLimpa);
            setPage(1);
            setAnimReady(true);
          }
        }, delay);
      } catch (e: any) {
        console.error("[useIncidentes] Erro no fetch", e);
        if (ativo) setErro(e?.message ?? "Erro ao carregar incidentes");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    fetchIncidentes();
    return () => { ativo = false; };
  }, [token, tenantAtivo, periodo]);

  /* -----------------------------------------
   * EFEITO: Abrir incidente via query string
   * --------------------------------------- */
  useEffect(() => {
    if (!openFromQS || dados.length === 0) return;

    const id = Number(openFromQS);
    setExpandido(id);

    setTimeout(() => {
      const el = document.getElementById(`incidente-${id}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  }, [openFromQS, dados]);

  /* -----------------------------------------
   * DERIVADOS: Subconjuntos para gráficos
   * --------------------------------------- */
  const baseTabela = useMemo(() =>
    dados.filter((i) => {
      const nivel = nivelDoIncidente(i);
      if (nivel === "Baixo" && i.severity?.toLowerCase() !== "low") return false;
      return true;
    }),
    [dados]
  );

  const abertos = useMemo(() =>
    baseTabela.filter((i) => (i.state_name || "").toLowerCase() === "open"),
    [baseTabela]
  );

  const fechados = useMemo(() =>
    baseTabela.filter((i) => (i.state_name || "").toLowerCase() === "closed"),
    [baseTabela]
  );

  const atribuidos = useMemo(() =>
    baseTabela.filter((i) => !isIAOwner(extractOwner(i))),
    [baseTabela]
  );

  const naoAtribuidos = useMemo(() =>
    baseTabela.filter((i) => isIAOwner(extractOwner(i))),
    [baseTabela]
  );

  /* -----------------------------------------
   * DERIVADOS: Dados ordenados
   * --------------------------------------- */
  const ordenados = useMemo(() => {
    return [...dados].sort((a, b) => {
      let va = 0,
        vb = 0;

      if (sortBy === "id") {
        va = Number(a.case_id) || 0;
        vb = Number(b.case_id) || 0;
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

  /* -----------------------------------------
   * DERIVADOS: Paginação
   * --------------------------------------- */
  const total = dados.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const clampPage = (p: number) => Math.min(Math.max(1, p), totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);

  // Garante que a página não fique além do total após mudança de dados
  useEffect(() => { setPage((p) => clampPage(p)); }, [totalPages]);

  // Volta para pág 1 ao mudar ordenação
  useEffect(() => { setPage(1); }, [sortBy, sortDir]);

  /* -----------------------------------------
   * DERIVADOS: Linhas visíveis (filtro + paginação)
   * --------------------------------------- */
  const linhas = useMemo(() => {
    let base = [...ordenados];

    if (busca.trim() !== "") {
      const termo = busca.toLowerCase();
      base = base.filter((i) => {
        const id = String(i.case_id);
        const nome = (i.case_name || "").toLowerCase();
        const desc = (i.case_description || "").toLowerCase();
        const status = (i.state_name || "").toLowerCase();
        const owner = (extractOwner(i) || "").toLowerCase();
        const cliente = (extractIncidentClient(i) || "").toLowerCase();
        const nivel = nivelDoIncidente(i).toLowerCase();

        return (
          id.includes(termo) ||
          nome.includes(termo) ||
          desc.includes(termo) ||
          status.includes(termo) ||
          owner.includes(termo) ||
          cliente.includes(termo) ||
          nivel.includes(termo)
        );
      });
    }

    if (filtroSeveridade || filtroOrigem) {
      base = base.filter((i) => {
        const nivelOk = filtroSeveridade
          ? matchSeveridade(nivelDoIncidente(i), filtroSeveridade)
          : true;

        const origemOk = (() => {
          if (!filtroOrigem) return true;
          const state = (i.state_name || "").toLowerCase();
          if (filtroOrigem === "abertos") return state === "open";
          if (filtroOrigem === "fechados") return state === "closed";
          if (filtroOrigem === "atribuidos") return !isIAOwner(extractOwner(i));
          if (filtroOrigem === "nao_atribuidos") return isIAOwner(extractOwner(i));
          return true;
        })();

        return nivelOk && origemOk;
      });
    }

    return base.slice(start, end);
  }, [ordenados, start, end, busca, filtroSeveridade, filtroOrigem]);

  /* -----------------------------------------
   * AÇÕES
   * --------------------------------------- */
  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortByState(key);
      setSortDir("desc");
    }
  };

  const setSortBy = (key: SortKey) => {
    setSortByState(key);
  };

  const limparFiltros = () => {
    setPeriodo(null);
    setFiltroSeveridade(null);
    setFiltroOrigem(null);
    setBusca("");
    setChartResetKey((k) => k + 1);
  };

  const atualizarIncidente = (
    id: number | string,
    patch: Partial<PageIncidente>
  ) => {
    setDados((prev) =>
      prev.map((i) => (i.case_id === id ? { ...i, ...patch } : i))
    );
  };

  return {
    // Dados
    dados,
    linhas,
    usuariosTenant,

    // Gráficos
    abertos,
    fechados,
    atribuidos,
    naoAtribuidos,

    // Loading
    carregando,
    animReady,
    erro,

    // Tenant
    irisUrl,
    tenantOwner,

    // Paginação
    page,
    total,
    totalPages,
    start,
    end,
    setPage,
    clampPage,

    // Ordenação
    sortBy,
    sortDir,
    setSortBy,
    setSortDir,
    handleSort,

    // Filtros
    busca,
    setBusca,
    filtroSeveridade,
    setFiltroSeveridade,
    filtroOrigem,
    setFiltroOrigem,
    periodo,
    setPeriodo,
    limparFiltros,

    // UI
    expandido,
    setExpandido,
    atualizarIncidente,
    chartResetKey,
  };
}