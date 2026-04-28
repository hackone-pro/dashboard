// src/utils/incidentes/helpers.ts

import { PageIncidente } from "../../types/incidentes.types";

/* ======================
 * Normalização / Texto
 * ====================== */

// Normaliza string com acentos e caixa
export const normaliza = (s?: string) =>
  (s || "")
    .normalize("NFD")
    // @ts-ignore unicode property
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();

/* ======================
 * Extract Helpers
 * ====================== */

// Extrai owner de possíveis campos.
// Prioriza metadata persistida no case_description (analista editado pelo usuário),
// pois o IRIS não persiste owner_id alterado por este fluxo.
export function extractOwner(i: any): string | undefined {
  const meta = lerMetadataDoCaso(i?.case_description);
  if (meta?.analista) return meta.analista;

  return (
    i.owner_name_iris ??
    i.owner ??
    i.owner_name ??
    i.ownerUser ??
    i.owner_user ??
    i.assigned_to ??
    undefined
  );
}

// Identifica se o owner é IA
export function isIAOwner(owner?: string) {
  const o = normaliza(owner);
  return (
    o === "inteligencia_artificial" ||
    o === "inteligencia artificial"
  );
}


// Extrai cliente de possíveis campos
export function extractIncidentClient(i: any): string | undefined {
  return i.client_name ?? i.client ?? i.customer_name ?? i.tenant_name ?? undefined;
}

/* ======================
 * Datas
 * ====================== */

// Converte "MM/DD/YYYY" em Date
export function parseDateBR(d: string) {
  const [mes, dia, ano] = d.split("/");
  return new Date(`${ano}-${mes}-${dia}`);
}

// recebe "MM/DD/YYYY" e devolve "DD/MM/YYYY"
export function formatDateBR(d: string) {
  if (!d) return "—";
  const [mes, dia, ano] = d.split("/");
  return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${ano}`;
}

// Filtra lista pelos últimos X dias (inclui hoje). 1 = hoje. 0 = todos.
export function filtrarPorDias(lista: PageIncidente[], dias: number) {
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

/* ======================
 * Severidade
 * ====================== */

// Badge de cor por severidade (PT/masc/fem)
export function getCorBadge(nivel: string) {
  switch (nivel) {
    case "Crítico":
    case "Crítica":
    case "CRÍTICA":
    case "CRÍTICO":
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

// Tradução simples de status (exibido)
export function statusPT(s?: string) {
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

// Agrupa incidentes por severidade (com normalização e tipo seguro)
export function agruparPorSeveridade(
  lista: PageIncidente[],
  nivelDoIncidente: (i: PageIncidente) => string
) {
  const base: Record<"Baixo" | "Médio" | "Alto" | "Crítico", number> = {
    Baixo: 0,
    Médio: 0,
    Alto: 0,
    Crítico: 0,
  };

  lista.forEach((i) => {
    let nivel = nivelDoIncidente(i) || "";

    // Normaliza texto (sem acento e minúsculo)
    const n = nivel
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    let chave: keyof typeof base;

    if (n.includes("crit")) chave = "Crítico";
    else if (n.includes("alt")) chave = "Alto";
    else if (n.includes("med")) chave = "Médio";
    else if (n.includes("baix")) chave = "Baixo";
    else chave = "Médio"; // fallback neutro

    base[chave] = (base[chave] || 0) + 1;
  });

  return base;
}



/* ======================
 * Título & Regex
 * ====================== */

// Aceita baixo/baixa, médio/média, alto/alta, crítico/crítica
export const NIVEIS_REGEX =
  "(Baixo|Baixa|M[eé]dio|M[eé]dia|Alto|Alta|Cr[ií]tico|Cr[ií]tica|CR[IÍ]TICO|CR[IÍ]TICA)";

// Sentence case
export const sentenceCase = (texto: string) =>
  texto ? texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase() : texto;

// Detecta severidade no início do nome
export function detectarNivelPorNome(nome: string): string | null {
  const comData = new RegExp(
    String.raw`^\s*(?:#?\d+\s*[-–]\s*)?\[\d{2}:\d{2}\s*[-–]\s*\d{2}\/\d{2}\/\d{4}\]\s*[-–]\s*${NIVEIS_REGEX}`,
    "i"
  );
  const semData = new RegExp(
    String.raw`^\s*(?:#?\d+\s*[-–]\s*)?\[\d{2}:\d{2}\]\s*[-–]\s*${NIVEIS_REGEX}\s*[-–]`,
    "i"
  );

  let m = nome.match(comData);
  if (m) return m[1];
  m = nome.match(semData);
  if (m) return m[1];
  return null;
}

/* ======================
 * Severidade real (do texto)
 * ====================== */

export function extrairSeveridadeDoTexto(descricao?: string): string | null {
  if (!descricao) return null;

  const textoLimpo = descricao
    .replace(/\*\*/g, "")       // remove **
    .replace(/`/g, "")          // remove crase
    .replace(/^\s*-\s*/gm, "")  // remove "- " no início das linhas
    .replace(/\u00A0/g, " ")    // remove espaço especial
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos de verdade

  const match = textoLimpo.match(
    /Severidade\s*:\s*(Baixo|Baixa|Medio|Media|Alto|Alta|Critico|Critica)/i
  );

  if (!match) return null;

  const v = match[1].toLowerCase();

  if (v.startsWith("crit")) return "Crítica";
  if (v.startsWith("alt")) return "Alta";
  if (v.startsWith("med")) return "Média";
  if (v.startsWith("baix")) return "Baixa";

  return null;
}


// Limpa prefixos do título
export function formatCaseName(name: string) {
  let s = (name || "").replace(/\u00A0/g, " ").replace(/\s+/g, " ").trimStart();
  s = s.replace(/^\s*#?\d+\s*[-–]\s*/i, "");
  s = s.replace(
    new RegExp(String.raw`\[\s*${NIVEIS_REGEX}\s*\]\s*[-–]\s*`, "i"),
    ""
  );
  s = s.replace(
    new RegExp(
      String.raw`^\s*\[\d{2}:\d{2}\s*[-–]\s*\d{2}\/\d{2}\/\d{4}\]\s*[-–]\s*${NIVEIS_REGEX}\s*[-–]\s*`,
      "i"
    ),
    ""
  );
  s = s.replace(
    new RegExp(
      String.raw`^\s*\[\d{2}:\d{2}\]\s*[-–]\s*${NIVEIS_REGEX}\s*[-–]\s*`,
      "i"
    ),
    ""
  );
  s = s.replace(/^\s*\[\d{2}:\d{2}\]\s*[-–]\s*/i, "");
  return s.trim();
}

// Normaliza qualquer variação de gênero/capitalização para um padrão único
export type NivelSeveridade = "Baixa" | "Média" | "Alta" | "Crítica";

export function normalizarNivel(valor: string | null | undefined): NivelSeveridade {
  const v = valor?.trim().toLowerCase() ?? "";

  if (v === "baixo" || v === "baixa")       return "Baixa";
  if (v === "medio" || v === "média" || v === "media" || v === "médio") return "Média";
  if (v === "alto"  || v === "alta")        return "Alta";
  if (v === "critico" || v === "crítico" || v === "critica" || v === "crítica") return "Crítica";

  return "Baixa"; // fallback seguro
}

/* ======================
 * Metadata persistida em case_description
 * ======================
 *
 * O IRIS não persiste severidade/analista/classificação alterados pelo modal
 * de edição (mismatch de IDs e lookup frágil de owner). Para evitar perda
 * dessas mudanças no reload, a UI grava um bloco oculto no case_description.
 *
 * Formato:
 *   <!-- METADATA_ANALISE
 *   analista: João Silva
 *   classificacao: positivo
 *   severidade: Alta
 *   -->
 *
 * Comentário HTML não é renderizado pelo ReactMarkdown.
 */

export const METADATA_MARKER_INICIO = "<!-- METADATA_ANALISE";
export const METADATA_MARKER_FIM = "-->";

export type MetadataCaso = {
  analista?: string;
  classificacao?: string;
  severidade?: string;
};

const METADATA_REGEX = /<!--\s*METADATA_ANALISE\s*([\s\S]*?)-->/i;

export function lerMetadataDoCaso(descricao?: string | null): MetadataCaso | null {
  if (!descricao) return null;
  const match = descricao.match(METADATA_REGEX);
  if (!match) return null;

  const corpo = match[1];
  const meta: MetadataCaso = {};

  for (const linha of corpo.split(/\r?\n/)) {
    const m = linha.match(/^\s*(analista|classificacao|severidade)\s*:\s*(.+?)\s*$/i);
    if (!m) continue;
    const chave = m[1].toLowerCase() as keyof MetadataCaso;
    const valor = m[2].trim();
    if (valor) meta[chave] = valor;
  }

  return Object.keys(meta).length ? meta : null;
}

export function escreverMetadataNoCaso(
  textoBase: string,
  meta: MetadataCaso
): string {
  const semBloco = (textoBase || "").replace(METADATA_REGEX, "").trimEnd();

  const linhas: string[] = [];
  if (meta.analista) linhas.push(`analista: ${meta.analista}`);
  if (meta.classificacao) linhas.push(`classificacao: ${meta.classificacao}`);
  if (meta.severidade) linhas.push(`severidade: ${meta.severidade}`);

  if (!linhas.length) return semBloco;

  const bloco = `${METADATA_MARKER_INICIO}\n${linhas.join("\n")}\n${METADATA_MARKER_FIM}`;
  return `${semBloco}\n\n${bloco}`;
}

// Substitui o valor logo após qualquer variação de "Severidade:" preservando
// formatação markdown (ex.: **Severidade:** `Alta`). Se não encontrar, anexa
// "Severidade: <novo>" ao final do texto.
export function atualizarSeveridadeNoTexto(
  textoBase: string,
  novaSeveridade: string
): string {
  if (!textoBase) return `Severidade: ${novaSeveridade}`;

  // 1) Remove anexações órfãs "Severidade: X" em linha isolada (sem markdown),
  //    legado de versões anteriores que apenas concatenavam no fim.
  const orfaoRegex =
    /\n+\s*Severidade\s*:\s*(Baixo|Baixa|M[eé]dio|M[eé]dia|Alto|Alta|Cr[ií]tico|Cr[ií]tica)\s*(?=\n|$)/gi;
  const limpo = textoBase.replace(orfaoRegex, "");

  // 2) Captura prefixo (asteriscos/crases/aspas opcionais) e o valor atual.
  //    Substitui só o valor, mantendo asteriscos/crases de fechamento intactos.
  const regex =
    /(\*{0,2}Severidade\*{0,2}\s*:\s*\*{0,2}\s*[`'"]?\s*)(Baixo|Baixa|M[eé]dio|M[eé]dia|Alto|Alta|Cr[ií]tico|Cr[ií]tica)/gi;

  if (regex.test(limpo)) {
    return limpo.replace(regex, `$1${novaSeveridade}`);
  }
  return `${limpo.trimEnd()}\n\nSeveridade: ${novaSeveridade}`;
}