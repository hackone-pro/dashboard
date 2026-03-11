// src/componentes/incidentes/IncidenteTabela.tsx
//
import { useAuth } from "../../../context/AuthContext";
import Swal from "sweetalert2";
import { toastSuccess, toastError } from "../../../utils/toast";

import DescricaoFormatada from "../../iris/DescricaoFormatada";
import { SortableHeader, Secao, Linha, ListaSkeleton } from "./ui";

import { updateCasoIris } from "../../../services/iris/updatecase.service";
import { getToken } from "../../../utils/auth";
import { getStatusMeta } from "../../../utils/incidentes/status";
import {
  normaliza,
  isIAOwner,
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

  // Paginação
  page: number;
  total: number;
  totalPages: number;
  start: number;
  end: number;
  onPageChange: (p: number) => void;
  clampPage: (p: number) => number;

  // Ordenação
  sortBy: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;

  // Busca
  busca: string;
  onBuscaChange: (v: string) => void;

  // Accordion
  expandido: number | string | null;
  onExpandido: (id: number | string | null) => void;

  // Atualização local
  onAtualizar: (id: number | string, patch: Partial<PageIncidente>) => void;
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

  const token = getToken();
  const { user } = useAuth();
  const NOTAS_MARKER = "<!-- NOTAS_ANALISE -->";

  function classificacaoPT(c?: string | null) {
    if (c === "positivo") return "Positivo";
    if (c === "falso_positivo") return "Falso Positivo";
    return c || "—";
  }

  const handleEditar = async (inc: PageIncidente) => {
    const id = inc.case_id;

    // Busca o inc atualizado do array ao invés de usar a referência capturada
    const incAtual = linhas.find((i) => i.case_id === id) ?? inc;
    const statusAtual = (incAtual.state_name || "").toLowerCase().trim();
    const ownerAtual = normaliza(extractOwner(incAtual) || "");
    const ownerIdAtual = (incAtual as any).owner_id ?? null;
    const classificacaoAtual = (incAtual as any).classification ?? "";
    
    const severidadeAtual = (() => {
      // 1 — campo salvo localmente após edição
      const local = (incAtual as any).severity?.toLowerCase();
      if (local) return local;
    
      // 2 — mapeia a severidade extraída do texto para o valor do select
      const nivel = nivelDoIncidente(incAtual).toLowerCase();
      if (nivel.startsWith("crít") || nivel.startsWith("crit")) return "critical";
      if (nivel.startsWith("alt")) return "high";
      if (nivel.startsWith("méd") || nivel.startsWith("med")) return "medium";
      if (nivel.startsWith("baix")) return "low";
    
      return "medium";
    })();

    const mapClassificacaoId: Record<string, number | null> = {
      positivo: 5,
      falso_positivo: 1,
      "": null,
    };

    const mapSeveridadePT: Record<string, string> = {
      low: "Baixa",
      medium: "Média",
      high: "Alta",
      critical: "Crítica",
    };

    const optionsAnalistas = [
      `<option value="inteligencia_artificial" ${isIAOwner(ownerAtual) ? "selected" : ""
      }>Inteligência Artificial</option>`,
      ...usuariosTenant.map(
        (u: any, idx: number) => {
          const isSelected = ownerIdAtual
            ? ownerIdAtual === `idx_${idx}`
            : normaliza(u.owner_name_iris) === ownerAtual;

          return `<option value="idx_${idx}" ${isSelected ? "selected" : ""}>${u.nome}</option>`;
        }
      ),
    ].join("");

    const notaAtual = (incAtual.case_description || "")
      .split(NOTAS_MARKER)[1]
      ?.split("Mensagem:")[1]
      ?.trim() ?? "";

    const { value: formValues } = await Swal.fire({
      title: `Incidente #${id}`,
      html: `
        <div class="mt-5" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;text-align:left">
          <div>
            <label class="text-sm text-gray-300">Status</label>
            <select id="swal-status" class="w-full mt-2 rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3">
              <option value="open" ${statusAtual === "open" ? "selected" : ""}>Aberto</option>
              <option value="closed" ${statusAtual === "closed" ? "selected" : ""}>Fechado</option>
            </select>
          </div>
          <div>
            <label class="text-sm text-gray-300">Analista</label>
            <select id="swal-verdict" class="w-full mt-2 rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3">
              ${optionsAnalistas}
            </select>
          </div>
          <div>
            <label class="text-sm text-gray-300">Severidade</label>
            <select id="swal-severity" class="w-full mt-2 rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3">
              <option value="low" ${severidadeAtual === "low" ? "selected" : ""}>Baixa</option>
              <option value="medium" ${severidadeAtual === "medium" ? "selected" : ""}>Média</option>
              <option value="high" ${severidadeAtual === "high" ? "selected" : ""}>Alta</option>
              <option value="critical" ${severidadeAtual === "critical" ? "selected" : ""}>Crítica</option>
            </select>
          </div>
          <div>
            <label class="text-sm text-gray-300">Classificação</label>
            <select id="swal-classificacao" class="w-full mt-2 rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3">
              <option value="" ${classificacaoAtual === "" || !classificacaoAtual ? "selected" : ""}>Nenhum</option>
              <option value="positivo" ${classificacaoAtual === "positivo" ? "selected" : ""}>Positivo</option>
              <option value="falso_positivo" ${classificacaoAtual === "falso_positivo" ? "selected" : ""}>Falso Positivo</option>
            </select>
          </div>
        </div>
        <div style="margin-top:16px;text-align:left">
          <label class="text-sm text-gray-300">Notas da Análise</label>
          <textarea id="swal-notas" rows="4" class="w-full mt-2 rounded-xl bg-[#383838] border border-[#2c2450] text-gray-100 px-4 py-3">${notaAtual}</textarea>
        </div>
      `,
      background: "#0A0617",
      color: "#fff",
      confirmButtonText: "Salvar",
      showCancelButton: true,
      reverseButtons: true,
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#A855F7",
      cancelButtonColor: "#4B5563",
      customClass: { popup: "rounded-2xl shadow-lg border border-[#3c2d6e]" },
      focusConfirm: false,
      preConfirm: () => ({
        status: (document.getElementById("swal-status") as HTMLSelectElement)?.value,
        verdict: (document.getElementById("swal-verdict") as HTMLSelectElement)?.value,
        severidade: (document.getElementById("swal-severity") as HTMLSelectElement)?.value,
        classificacao: (document.getElementById("swal-classificacao") as HTMLSelectElement)?.value,
        notas: (document.getElementById("swal-notas") as HTMLTextAreaElement)?.value,
      }),
    });

    if (!formValues) return;

    const agora = new Date().toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    const descricaoBase = (incAtual.case_description || "")
      .split(NOTAS_MARKER)[0]  // pega só a parte antes das notas anteriores
      .trimEnd();

    const blocoNotas = formValues.notas?.trim()
      ? `\n\n${NOTAS_MARKER}\n\n---\n\n<h3 style="display:flex">📝 Nota de Análise</h3>\n\nAutor: ${user?.nome || user?.username || "—"}\n\nData: ${agora}\n\nMensagem: ${formValues.notas.trim()}`
      : null;

    try {
      const isIA = formValues.verdict === "inteligencia_artificial";
      const isIdx = formValues.verdict.startsWith("idx_");

      const usuario = isIA
        ? { owner_name_iris: "Inteligencia_Artificial" }
        : isIdx
          ? usuariosTenant[Number(formValues.verdict.replace("idx_", ""))]
          : usuariosTenant.find((u) => normaliza(u.owner_name_iris) === normaliza(formValues.verdict));

      // ← adicione o updateCasoIris aqui
      await updateCasoIris(token || "", {
        caseId: id,
        status: formValues.status,
        owner: usuario?.owner_name_iris,
        outcome: formValues.classificacao || undefined,
        notas: blocoNotas || undefined,
        descricaoAtual: descricaoBase,
      });

      toastSuccess("Incidente atualizado!");

      onAtualizar(id, {
        state_name: formValues.status,
        owner_name: usuario?.owner_name_iris,
        owner: usuario?.owner_name_iris,
        owner_id: isIA ? "inteligencia_artificial" : formValues.verdict,
        classification: formValues.classificacao || null,
        classification_id: mapClassificacaoId[formValues.classificacao] ?? null,
        severity: formValues.severidade,
        severidade_label: mapSeveridadePT[formValues.severidade],
        severidade_override: mapSeveridadePT[formValues.severidade],
        case_description: blocoNotas
          ? descricaoBase + blocoNotas  // com nota
          : descricaoBase,              // sem nota — remove o bloco anterior
      } as any);

    } catch (err) {
      console.error(err);
      toastError("Erro ao atualizar incidente");
    }
  };

  return (
    <section className="cards p-6 rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">

        {/* Título */}
        <div className="flex items-center gap-2">
          {/* @ts-ignore */}
          <GoGraph className="text-[#744CD8] size-[20px]" />
          <h2 className="text-white whitespace-nowrap">Incidentes — Nível de Detalhe</h2>
        </div>

        {/* Busca */}
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

        {/* Paginação */}
        <div className="flex items-center gap-3 justify-end">
          <div className="text-xs text-gray-400 whitespace-nowrap">
            {total > 0
              ? <>Mostrando <span className="text-gray-200">{start + 1}</span>–<span className="text-gray-200">{end}</span> de <span className="text-gray-200">{total}</span></>
              : <>Mostrando 0 de 0</>}
          </div>
          <div className="flex gap-2">
            <button
              className="px-2 py-1 btn hover:bg-purple-600 text-[12px] text-white rounded-md disabled:opacity-40"
              onClick={() => onPageChange(clampPage(page - 1))}
              disabled={page <= 1}
            >
              ← Anterior
            </button>
            <button
              className="px-2 py-1 btn hover:bg-purple-600 text-[12px] text-white rounded-md disabled:opacity-40"
              onClick={() => onPageChange(clampPage(page + 1))}
              disabled={page >= totalPages}
            >
              Próxima →
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="cards rounded-2xl overflow-hidden table-incidente">

        {/* Cabeçalho das colunas */}
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
                    <div className="col-span-2 text-center text-xs text-gray-400">
                      {formatDateBR(inc.case_open_date)}
                    </div>
                    <div className="col-span-4 text-center text-xs text-gray-400 truncate">
                      #{id} - {formatCaseName(inc.case_name || "") || "—"}
                    </div>
                    <div className="col-span-2 text-center">
                      <span className={`text-[11px] px-2 py-0.5 rounded-md badge ${badge}`}>
                        {sentenceCase(nivel)}
                      </span>
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
                        onClick={() => handleEditar(inc)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#744CD8] hover:bg-[#5f3ac6] text-[12px] text-white rounded-md transition"
                      >
                        {/* @ts-ignore */}
                        <FaRegEdit size={12} /> Editar
                      </button>
                    </div>
                  </div>

                  {/* Accordion de detalhes */}
                  {aberto && (
                    <div className="px-5 py-5 bg-[#2a2250]">
                      <div className="rounded-xl p-5 bg-[#1b1730] border border-[#3B2A70] space-y-5">
                        <Secao titulo="Resumo">
                          <Linha label="Título:" valor={`#${inc.case_id} - ${formatCaseName(inc.case_name)}`} />
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
                          <Linha label="Classification ID:" valor={(inc as any).classification_id != null ? String((inc as any).classification_id) : "—"} />                          <Linha label="Classification:" valor={classificacaoPT((inc as any).classification)} />
                          <Linha
                            label="Severidade (mapeada):"
                            valor={(inc as any).severidade_label || sentenceCase(nivel)}
                          />
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
  );
}