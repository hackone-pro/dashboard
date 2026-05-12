// src/pages/Incidentes.tsx

import LayoutModel from "../componentes/LayoutModel";
import DateRangePicker from "../componentes/DataRangePicker";
import GraficosPainel from "../componentes/iris/incidentes/GraficosPainel";
import IncidenteTabela from "../componentes/iris/incidentes/IncidenteTabela";

import { FiRotateCcw } from "react-icons/fi";

import { useIncidentes, nivelDoIncidente } from "../hooks/useIncidentes";
import IncidentesDebugPanel from "../componentes/iris/IncidentesDebugPanel";
import { statusPT, formatCaseName } from "../utils/incidentes/helpers";
import { useEffect } from "react";
import { useScreenContext } from "../context/ScreenContext";
import type { DateRangePayload } from "../componentes/DataRangePicker";

export default function Incidentes() {
  const {
    linhas,
    usuariosTenant,
    abertos, fechados, atribuidos, naoAtribuidos,
    carregando, erro,
    irisUrl,
    page, total, totalPages, start, end, setPage, clampPage,
    sortBy, sortDir, handleSort,
    busca, setBusca,
    filtroSeveridade, setFiltroSeveridade,
    filtroOrigem, setFiltroOrigem,
    periodo, setPeriodo,
    limparFiltros,
    expandido, setExpandido,
    atualizarIncidente,
    chartResetKey,
    fetchDebug,
  } = useIncidentes();

  const { setScreenData } = useScreenContext();

  const LABEL_DIAS: Record<string, string> = { "1": "24h", "2": "48h", "7": "7d", "15": "15d", "30": "30d" };

  function handleFiltro(payload: DateRangePayload) {
    if (payload.dias) {
      const to   = new Date();
      const from = new Date(to.getTime() - Number(payload.dias) * 24 * 60 * 60 * 1000);
      const label = LABEL_DIAS[payload.dias] ?? `${payload.dias}d`;
      console.log(`[Incidentes] filtro: ${label} | from=${from.toISOString()} to=${to.toISOString()}`);
      setPeriodo({ from: from.toISOString(), to: to.toISOString(), label });
    } else {
      console.log(`[Incidentes] filtro: custom | from=${payload.from} to=${payload.to}`);
      setPeriodo({ from: payload.from!, to: payload.to!, label: "custom" });
    }
  }

  useEffect(() => {
    setScreenData("incidentes", {
      nomePagina: "Incidentes",
      periodo: periodo ? `${periodo.from} a ${periodo.to}` : "todos",
      abertos: abertos.length,
      fechados: fechados.length,
      atribuidos: atribuidos.length,
      naoAtribuidos: naoAtribuidos.length,
      total,
      paginaAtual: page,
      totalPaginas: totalPages,
      filtroSeveridade: (() => { const m: Record<string,string> = { LOW:"Baixo", MEDIUM:"Médio", HIGH:"Alto", CRITICAL:"Crítico" }; return filtroSeveridade ? (m[filtroSeveridade.toUpperCase()] ?? filtroSeveridade) : "todos"; })(),
      filtroOrigem: filtroOrigem || "todos",
      busca: busca || null,
      incidentesPagina: linhas.map((inc) => ({
        id: inc.case_id,
        data: inc.case_open_date,
        descricao: `#${inc.case_id} - ${formatCaseName(inc.case_name || "")}`,
        severidade: nivelDoIncidente(inc),
        status: statusPT(inc.state_name),
      })),
    });
  }, [abertos, fechados, atribuidos, naoAtribuidos, total, filtroSeveridade, filtroOrigem, busca, linhas, periodo, page, totalPages]);

  return (
    <LayoutModel titulo="Incidentes">
      <div>
        {/* Barra de período e reset */}
        <div className="flex justify-end mt-5 mb-3 px-6">
          <DateRangePicker onApply={handleFiltro} resetKey={chartResetKey} />
          <button
            onClick={limparFiltros}
            className="flex items-center gap-1 text-[14px] text-purple-400 hover:text-purple-200 transition-colors"
          >
            {/* @ts-ignore */}
            <FiRotateCcw className="ml-3 w-4 h-4" />
            Limpar filtros
          </button>
        </div>

        {/* Donuts de resumo */}
        <GraficosPainel
          carregando={carregando}
          chartResetKey={chartResetKey}
          abertos={abertos}
          fechados={fechados}
          atribuidos={atribuidos}
          naoAtribuidos={naoAtribuidos}
          onFiltrar={(nivel, origem) => {
            setFiltroSeveridade(nivel);
            setFiltroOrigem(origem);
          }}
        />

        {/* Tabela detalhada */}
        <IncidenteTabela
          linhas={linhas}
          carregando={carregando}
          erro={erro}
          irisUrl={irisUrl}
          usuariosTenant={usuariosTenant}
          page={page}
          total={total}
          totalPages={totalPages}
          start={start}
          end={end}
          onPageChange={setPage}
          clampPage={clampPage}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          busca={busca}
          onBuscaChange={setBusca}
          expandido={expandido}
          onExpandido={setExpandido}
          onAtualizar={atualizarIncidente}
        />
      </div>
      <IncidentesDebugPanel
        fetchDebug={fetchDebug}
        filtroSeveridade={filtroSeveridade}
        filtroOrigem={filtroOrigem}
        busca={busca}
        sortBy={sortBy}
        sortDir={sortDir}
        total={total}
        totalPages={totalPages}
        page={page}
        start={start}
        end={end}
        abertos={abertos.length}
        fechados={fechados.length}
        atribuidos={atribuidos.length}
        naoAtribuidos={naoAtribuidos.length}
        periodo={periodo}
      />
    </LayoutModel>
  );
}