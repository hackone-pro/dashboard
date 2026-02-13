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

// Extrai owner de possíveis campos
export function extractOwner(i: any): string | undefined {
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

  const match = descricao.match(
    /Severidade:\s*(Baixo|Baixa|M[eé]dio|M[eé]dia|Alto|Alta|Cr[ií]tico|Cr[ií]tica)/i
  );

  return match ? match[1] : null;
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
