// src/componentes/incidentes/IncidenteTabela.tsx
import { useState } from "react";

import DescricaoFormatada from "../../iris/DescricaoFormatada";
import { SortableHeader, Secao, Linha, ListaSkeleton } from "./ui";
import ModalEditarIncidente from "./ModalEditar";

import { getStatusMeta } from "../../../utils/incidentes/status";
import {
  extractOwner,
  extractIncidentClient,
  formatDateBR,
  getCorBadge,
  statusPT,
  formatCaseName,
  sentenceCase,
} from "../../../utils/incidentes/helpers";
import { nivelDoIncidente } from "../../../hooks/useIncidentes";

import { GoGraph } from "react-icons/go";
import { FaSearch, FaRegEdit } from "react-icons/fa";

import type { PageIncidente } from "../../../types/incidentes.types";
import type { SortKey, SortDir } from "../../../hooks/useIncidentes";

/* =========================================
 * TYPES
 * ======================================= */
interface IncidenteTabelaProps {
  linhas: PageIncidente[];
  carregando: boolean;
  erro: string | null;
  irisUrl: string;
  usuariosTenant: any[];
  page: number;
  total: number;
  totalPages: number;
  start: number;
  end: number;
  onPageChange: (p: number) => void;
  clampPage: (p: number) => number;
  sortBy: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  busca: string;
  onBuscaChange: (v: string) => void;
  expandido: number | string | null;
  onExpandido: (id: number | string | null) => void;
  onAtualizar: (id: number | string, patch: Partial<PageIncidente>) => void;
}

/* =========================================
 * HELPERS
 * ======================================= */
function classificacaoPT(c?: string | null) {
  if (c === "positivo") return "Positivo";
  if (c === "falso_positivo") return "Falso Positivo";
  return c || "—";
}

/* =========================================
 * COMPONENTE
 * ======================================= */
export default function IncidenteTabela({
  linhas,
  carregando,
  erro,
  irisUrl,
  usuariosTenant,
  page,
  total,
  totalPages,
  start,
  end,
  onPageChange,
  clampPage,
  sortBy,
  sortDir,
  onSort,
  busca,
  onBuscaChange,
  expandido,
  onExpandido,
  onAtualizar,
}: IncidenteTabelaProps) {
  const [incEditando, setIncEditando] = useState<PageIncidente | null>(null);

  return (
    <section className="cards p-6 rounded-2xl shadow-lg">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          {/* @ts-ignore */}
          <GoGraph className="text-[#744CD8] size-[20px]" />
          <h2 className="text-white whitespace-nowrap">Incidentes — Nível de Detalhe</h2>
        </div>

        <div className="flex justify-center items-center flex-1">
          <label className="text-xs text-gray-400 whitespace-nowrap pr-2">Pesquisar:</label>
          <div className="relative w-64 md:w-80">
            {/* @ts-ignore */}
            <FaSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar incidente..."
              value={busca}
              onChange={(e) => { onBuscaChange(e.target.value); onPageChange(1); }}
              className="bg-[#0d0c22] border border-[#cacaca31] text-white text-xs pl-3 pr-3 py-2 rounded-md w-full focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <div className="text-xs text-gray-400 whitespace-nowrap">
            {total > 0
              ? <>Mostrando <span className="text-gray-200">{start + 1}</span>–<span className="text-gray-200">{end}</span> de <span className="text-gray-200">{total}</span></>
              : <>Mostrando 0 de 0</>}
          </div>
          <div className="flex gap-2">
            <button className="px-2 py-1 btn hover:bg-purple-600 text-[12px] text-white rounded-md disabled:opacity-40" onClick={() => onPageChange(clampPage(page - 1))} disabled={page <= 1}>← Anterior</button>
            <button className="px-2 py-1 btn hover:bg-purple-600 text-[12px] text-white rounded-md disabled:opacity-40" onClick={() => onPageChange(clampPage(page + 1))} disabled={page >= totalPages}>Próxima →</button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="cards rounded-2xl overflow-hidden table-incidente">

        {/* Cabeçalho */}
        <div className="grid grid-cols-12 px-5 py-5 bg-[#0A0617] text-xs text-gray-300">
          <div className="col-span-1 text-center border-[#1D1929] border-r-2 text-[14px]">
            <SortableHeader label="ID" active={sortBy === "id"} dir={sortDir} onClick={() => onSort("id")} />
          </div>
          <div className="col-span-2 text-center border-[#1D1929] border-r-2 text-[14px]">
            <SortableHeader label="Data" active={sortBy === "data"} dir={sortDir} onClick={() => onSort("data")} />
          </div>
          <div className="col-span-4 text-center border-[#1D1929] border-r-2 text-[14px]">Descrição</div>
          <div className="col-span-2 text-center border-[#1D1929] border-r-2 text-[14px]">
            <SortableHeader label="Severidade" active={sortBy === "severidade"} dir={sortDir} onClick={() => onSort("severidade")} />
          </div>
          <div className="col-span-1 text-center border-[#1D1929] border-r-2 text-[14px]">
            <SortableHeader label="Status" active={sortBy === "status"} dir={sortDir} onClick={() => onSort("status")} />
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
            {linhas.map((inc) => {
              const id = inc.case_id;
              const aberto = expandido === id;
              const nivel = nivelDoIncidente(inc);
              const badge = getCorBadge(nivel);
              const status = statusPT(inc.state_name);
              const meta = getStatusMeta(inc.state_name);
              const StatusIcon = meta.Icon;

              return (
                <div key={String(id)} id={`incidente-${id}`} className="group" data-case-id={String(id)}>

                  {/* Linha principal */}
                  <div className={`grid grid-cols-12 px-5 py-4 items-center ${aberto ? "bg-[#2a2250]" : "hover:bg-[#ffffff07]"} transition-colors`}>
                    <div className="col-span-1 text-center text-sm text-gray-400 truncate">
                      {irisUrl
                        ? <a href={`${irisUrl}/case?cid=${id}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">#{id}</a>
                        : <>#{id}</>}
                    </div>
                    <div className="col-span-2 text-center text-xs text-gray-400">{formatDateBR(inc.case_open_date)}</div>
                    <div className="col-span-4 text-center text-xs text-gray-400 truncate">#{id} - {formatCaseName(inc.case_name || "") || "—"}</div>
                    <div className="col-span-2 text-center">
                      <span className={`text-[11px] px-2 py-0.5 rounded-md badge ${badge}`}>{sentenceCase(nivel)}</span>
                    </div>
                    <div className="col-span-1 text-center">
                      <span className="inline-flex items-center justify-center gap-1 text-xs text-gray-400">
                        {/* @ts-ignore */}
                        <StatusIcon className={`w-4 h-4 ${meta.color}`} />
                        {meta.label}
                      </span>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button
                        onClick={() => onExpandido(aberto ? null : id)}
                        className="mx-2 px-3 py-1.5 btn hover:bg-purple-600 text-[12px] text-white rounded-md"
                      >
                        {aberto ? "Recolher —" : "Ver detalhes  +"}
                      </button>
                      <button
                        onClick={() => setIncEditando(linhas.find(i => i.case_id === id) ?? inc)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#744CD8] hover:bg-[#5f3ac6] text-[12px] text-white rounded-md transition"
                      >
                        {/* @ts-ignore */}
                        <FaRegEdit size={12} /> Editar
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
                          <Linha label="Classification:" valor={classificacaoPT((inc as any).classification)} />
                          <Linha label="Severidade (mapeada):" valor={(inc as any).severidade_label || sentenceCase(nivel)} />
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

      {/* Modal de edição */}
      <ModalEditarIncidente
        inc={incEditando}
        usuariosTenant={usuariosTenant}
        onClose={() => setIncEditando(null)}
        onAtualizar={onAtualizar}
      />

    </section>
  );
}