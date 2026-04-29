// src/componentes/incidentes/ModalEditarIncidente.tsx
//
// Modal de edição de incidente.
// Usa Modal, OptionGroup e ModalFooter genéricos.

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";

import Modal, { ModalFooter, ModalBotaoCancelar, ModalBotaoConfirmar } from "../../Modal";
import { OptionGroup } from "../../OptionGroup";

import { updateCasoIris } from "../../../services/iris/updatecase.service";
import { getToken } from "../../../utils/auth";
import { toastSuccess, toastError } from "../../../utils/toast";
import {
  normaliza,
  isIAOwner,
  extractOwner,
  lerMetadataDoCaso,
  escreverMetadataNoCaso,
  atualizarSeveridadeNoTexto,
} from "../../../utils/incidentes/helpers";
import { nivelDoIncidente } from "../../../hooks/useIncidentes";

import type { PageIncidente } from "../../../types/incidentes.types";

const NOTAS_MARKER = "<!-- NOTAS_ANALISE -->";

const MAP_CLASSIFICACAO_ID: Record<string, number | null> = {
  positivo: 5,
  falso_positivo: 1,
  "": null,
};

const MAP_SEVERIDADE_PT: Record<string, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

/* =========================================
 * TYPES
 * ======================================= */
interface ModalEditarIncidenteProps {
  inc: PageIncidente | null;
  usuariosTenant: any[];
  onClose: () => void;
  onAtualizar: (id: number | string, patch: Partial<PageIncidente>) => void;
}

/* =========================================
 * COMPONENTE
 * ======================================= */
export default function ModalEditarIncidente({
  inc,
  usuariosTenant,
  onClose,
  onAtualizar,
}: ModalEditarIncidenteProps) {
  const token = getToken();
  const { user } = useAuth();

  const [status, setStatus] = useState<"open" | "closed">("open");
  const [verdict, setVerdict] = useState("inteligencia_artificial");
  const [severidade, setSeveridade] = useState("medium");
  const [classificacao, setClassificacao] = useState("");
  const [notas, setNotas] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Preenche os campos ao abrir com os valores atuais do incidente
  useEffect(() => {
    if (!inc) return;

    const meta = lerMetadataDoCaso(inc.case_description);
    const ownerAtual = normaliza(extractOwner(inc) || "");
    const ownerIdAtual = (inc as any).owner_id ?? null;
    const estadoAtual = (inc.state_name || "open").toLowerCase().trim();
    // status
    setStatus(estadoAtual === "closed" ? "closed" : "open");

    // severidade — sempre via nivelDoIncidente (override in-memory + texto persistido).
    // inc.severity vem direto do IRIS, mas o modal não atualiza severity_id no IRIS,
    // então pós-refresh esse valor fica desatualizado.
    const nivel = nivelDoIncidente(inc).toLowerCase();
    if (nivel.startsWith("crít") || nivel.startsWith("crit")) setSeveridade("critical");
    else if (nivel.startsWith("alt")) setSeveridade("high");
    else if (nivel.startsWith("méd") || nivel.startsWith("med")) setSeveridade("medium");
    else setSeveridade("low");

    // classificação — prioriza metadata
    setClassificacao(meta?.classificacao ?? (inc as any).classification ?? "");

    // analista — prioriza metadata
    const analistaMeta = meta?.analista ? normaliza(meta.analista) : null;
    if (analistaMeta) {
      if (isIAOwner(analistaMeta)) {
        setVerdict("inteligencia_artificial");
      } else {
        const idx = usuariosTenant.findIndex(
          (u) => normaliza(u.owner_name_iris) === analistaMeta
        );
        setVerdict(idx >= 0 ? `idx_${idx}` : "inteligencia_artificial");
      }
    } else if (isIAOwner(ownerAtual)) {
      setVerdict("inteligencia_artificial");
    } else if (ownerIdAtual) {
      setVerdict(ownerIdAtual);
    } else {
      const idx = usuariosTenant.findIndex(
        (u) => normaliza(u.owner_name_iris) === ownerAtual
      );
      setVerdict(idx >= 0 ? `idx_${idx}` : "inteligencia_artificial");
    }

    // notas — extrai só o texto da mensagem
    const notaAtual = (inc.case_description || "")
      .split(NOTAS_MARKER)[1]
      ?.split("Mensagem:")[1]
      ?.trim() ?? "";
    setNotas(notaAtual);
  }, [inc, usuariosTenant]);

  if (!inc) return null;

  const id = inc.case_id;

  const opcoesAnalista = [
    { value: "inteligencia_artificial", label: "Inteligência Artificial" },
    ...usuariosTenant.map((u: any, idx: number) => ({
      value: `idx_${idx}`,
      label: u.nome,
    })),
  ];

  const formularioValido = !!verdict && !!classificacao;

  const handleSalvar = async () => {
    if (!formularioValido) {
      toastError("Preencha analista e classificação para salvar.");
      return;
    }
    setSalvando(true);
    try {
      const isIA = verdict === "inteligencia_artificial";
      const isIdx = verdict.startsWith("idx_");

      const usuario = isIA
        ? { owner_name_iris: "Inteligencia_Artificial" }
        : isIdx
          ? usuariosTenant[Number(verdict.replace("idx_", ""))]
          : usuariosTenant.find((u) => normaliza(u.owner_name_iris) === normaliza(verdict));

      const agora = new Date().toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });

      const descricaoBase = (inc.case_description || "")
        .split(NOTAS_MARKER)[0]
        .trimEnd();

      // 1) atualiza "Severidade: X" no corpo do texto (lido por extrairSeveridadeDoTexto)
      const descricaoComSev = atualizarSeveridadeNoTexto(
        descricaoBase,
        MAP_SEVERIDADE_PT[severidade] ?? severidade
      );

      // 2) grava bloco oculto com analista/classificacao/severidade para releitura confiável
      const descricaoComMeta = escreverMetadataNoCaso(descricaoComSev, {
        analista: usuario?.owner_name_iris,
        classificacao: classificacao || undefined,
        severidade: MAP_SEVERIDADE_PT[severidade] ?? severidade,
      });

      const blocoNotas = notas.trim()
        ? `\n\n${NOTAS_MARKER}\n\n---\n\n<h3 style="display:flex">📝 Nota de Análise</h3>\n\nAutor: ${user?.nome || user?.username || "—"}\n\nData: ${agora}\n\nMensagem: ${notas.trim()}`
        : null;

      await updateCasoIris(token || "", {
        caseId: id,
        status,
        owner: usuario?.owner_name_iris,
        outcome: classificacao || undefined,
        notas: blocoNotas || undefined,
        descricaoAtual: descricaoComMeta,
      });

      toastSuccess("Incidente atualizado!");

      onAtualizar(id, {
        state_name: status,
        owner_name: usuario?.owner_name_iris,
        owner: usuario?.owner_name_iris,
        owner_id: isIA ? "inteligencia_artificial" : verdict,
        classification: classificacao || null,
        classification_id: MAP_CLASSIFICACAO_ID[classificacao] ?? null,
        severity: severidade,
        severidade_label: MAP_SEVERIDADE_PT[severidade],
        severidade_override: MAP_SEVERIDADE_PT[severidade],
        case_description: blocoNotas
          ? descricaoComMeta + blocoNotas
          : descricaoComMeta,
      } as any);

      onClose();
    } catch (err) {
      console.error(err);
      toastError("Erro ao atualizar incidente");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      open={!!inc}
      onClose={onClose}
      titulo={`Incidente #${id}`}
      maxWidth="max-w-2xl"
    >
      <div className="grid grid-cols-2 gap-4 mb-4">
        <OptionGroup
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "open", label: "Aberto" },
            { value: "closed", label: "Fechado" },
          ]}
        />

        <OptionGroup
          label="Severidade"
          value={severidade}
          onChange={setSeveridade}
          options={[
            { value: "low", label: "Baixa" },
            { value: "medium", label: "Média" },
            { value: "high", label: "Alta" },
            { value: "critical", label: "Crítica" },
          ]}
        />

        <OptionGroup
          label="Analista"
          value={verdict}
          onChange={setVerdict}
          options={opcoesAnalista}
          maxHeight="220px"
        />

        <OptionGroup
          label="Classificação"
          value={classificacao}
          onChange={setClassificacao}
          options={[
            { value: "", label: "Nenhum" },
            { value: "positivo", label: "Positivo" },
            { value: "falso_positivo", label: "Falso Positivo" },
          ]}
        />
      </div>

      <div className="mb-2">
        <p className="text-sm text-gray-300 mb-2">Notas da Análise</p>
        <textarea
          rows={4}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Escreva suas notas aqui..."
          className="w-full rounded-xl bg-[#161125] border border-white/10 text-gray-100 px-4 py-3 text-sm focus:outline-none focus:border-purple-500 transition-all resize-none"
        />
      </div>

      {!formularioValido && (
        <p className="text-xs text-amber-400 mt-2">
          Preencha analista e classificação para salvar.
        </p>
      )}

      <ModalFooter>
        <ModalBotaoCancelar onClick={onClose} />
        <ModalBotaoConfirmar onClick={handleSalvar} disabled={salvando || !formularioValido}>
          {salvando ? "Salvando..." : "Salvar"}
        </ModalBotaoConfirmar>
      </ModalFooter>
    </Modal>
  );
}