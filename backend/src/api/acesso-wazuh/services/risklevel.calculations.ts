// Pure calculation functions for Risk Level algorithm.
// No strapi dependency — fully testable.

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SeveridadeCounts {
  baixo: number;
  medio: number;
  alto: number;
  critico: number;
}

export type DataStatus = "ok" | "missing";

export interface DataAvailability {
  topHosts: DataStatus;
  cis:      DataStatus;
  firewall: DataStatus;
  iris:     DataStatus;
}

export interface RiscoTotalResult {
  indiceRisco: number | null;
  dataAvailability: DataAvailability;
}

// ── Parâmetros do algoritmo ───────────────────────────────────────────────────

export const PARAMS = {
  base:                3,
  gamma:               1.5,
  decayAlertas:        0.98,
  decayIncidentes:     0.99,
  minFloorAlertas:     50,
  minFloorIncidentes:  10,
  warmupFactor:        2,
  pesoTopHosts:        0.25,
  pesoCIS:             0.25,
  pesoFirewall:        0.25,
  pesoIncidentes:      0.25,
} as const;

export const SEVERITY_WEIGHTS = {
  baixo:   Math.pow(PARAMS.base, 0), // 1
  medio:   Math.pow(PARAMS.base, 1), // 3
  alto:    Math.pow(PARAMS.base, 2), // 9
  critico: Math.pow(PARAMS.base, 3), // 27
} as const;

// ── Helpers de log ────────────────────────────────────────────────────────────

const SEP  = "─".repeat(60);
const SEP2 = "┄".repeat(60);

function line(msg: string) { console.log(msg); }
function sep()             { console.log(SEP);  }
function sep2()            { console.log(SEP2); }

// ── Raw Points ────────────────────────────────────────────────────────────────

export function calcularRawPoints(counts: SeveridadeCounts, label = "card"): number {
  const parcBaixo   = counts.baixo   * SEVERITY_WEIGHTS.baixo;
  const parcMedio   = counts.medio   * SEVERITY_WEIGHTS.medio;
  const parcAlto    = counts.alto    * SEVERITY_WEIGHTS.alto;
  const parcCritico = counts.critico * SEVERITY_WEIGHTS.critico;
  const raw         = parcBaixo + parcMedio + parcAlto + parcCritico;

  sep2();
  line(`[RiskCalc][${label}] ▶ STEP 1 — calcularRawPoints`);
  line(`  Entrada de severidades:`);
  line(`    baixo   = ${counts.baixo.toLocaleString("pt-BR")} alertas × peso ${SEVERITY_WEIGHTS.baixo}   = ${parcBaixo.toLocaleString("pt-BR")} pts`);
  line(`    medio   = ${counts.medio.toLocaleString("pt-BR")} alertas × peso ${SEVERITY_WEIGHTS.medio}   = ${parcMedio.toLocaleString("pt-BR")} pts`);
  line(`    alto    = ${counts.alto.toLocaleString("pt-BR")} alertas × peso ${SEVERITY_WEIGHTS.alto}   = ${parcAlto.toLocaleString("pt-BR")} pts`);
  line(`    critico = ${counts.critico.toLocaleString("pt-BR")} alertas × peso ${SEVERITY_WEIGHTS.critico}  = ${parcCritico.toLocaleString("pt-BR")} pts`);
  line(`  ➤ raw total = ${parcBaixo} + ${parcMedio} + ${parcAlto} + ${parcCritico} = ${raw.toLocaleString("pt-BR")} pts`);

  return raw;
}

// ── Raw do CIS — não-conformidade média dos agentes ───────────────────────────

export function calcularRawCIS(agentes: any[]): number {
  sep2();
  line(`[RiskCalc][CIS] ▶ STEP 1 — calcularRawCIS`);

  if (!agentes?.length) {
    line(`  Entrada: nenhum agente recebido (array vazio ou null)`);
    line(`  ➤ raw = 0 (sem dados CIS)`);
    return 0;
  }

  line(`  Entrada: ${agentes.length} registros de políticas CIS recebidos`);
  line(`  Agrupando por agente e calculando score médio por política:`);

  const porAgente = new Map<string, { scoreSum: number; policies: number }>();

  agentes.forEach((a: any) => {
    const nome  = a.agente ?? "unknown";
    const score = Number(a.score ?? 0);
    if (!porAgente.has(nome)) porAgente.set(nome, { scoreSum: 0, policies: 0 });
    const entry = porAgente.get(nome)!;
    entry.scoreSum += score;
    entry.policies += 1;
  });

  let totalScore = 0, totalAgentes = 0, idx = 1;
  porAgente.forEach(({ scoreSum, policies }, nome) => {
    const mediaAgente = scoreSum / policies;
    line(`    [${idx++}] agente="${nome}" → ${policies} política(s) | scoreSum=${scoreSum.toFixed(2)} | scoreMedia=${mediaAgente.toFixed(2)}`);
    totalScore   += mediaAgente;
    totalAgentes += 1;
  });

  if (totalAgentes === 0) {
    line(`  ➤ raw = 0 (nenhum agente após agrupamento)`);
    return 0;
  }

  const mediaGlobal    = totalScore / totalAgentes;
  const naoConformidade = Math.max(0, 100 - mediaGlobal);

  line(`  Resumo:`);
  line(`    totalAgentes     = ${totalAgentes}`);
  line(`    mediaScoreGlobal = ${mediaGlobal.toFixed(2)} (média dos scores médios por agente)`);
  line(`    não-conformidade = max(0, 100 - ${mediaGlobal.toFixed(2)}) = ${naoConformidade.toFixed(2)}`);
  line(`  ➤ raw = ${naoConformidade.toFixed(2)} pts`);

  return naoConformidade;
}

// ── Baseline e Decaimento ─────────────────────────────────────────────────────

export function atualizarBaseline(
  rawAtual: number,
  baselineAnterior: number,
  inicializado: boolean,
  decay: number,
  minFloor: number,
  label = "card"
): number {
  sep2();
  line(`[RiskCalc][${label}] ▶ STEP 2 — atualizarBaseline`);
  line(`  inicializado     = ${inicializado}`);
  line(`  baselineAnterior = ${baselineAnterior.toFixed(2)}`);
  line(`  rawAtual         = ${rawAtual.toLocaleString("pt-BR")}`);
  line(`  decay            = ${decay}  |  minFloor = ${minFloor}`);

  if (!inicializado || baselineAnterior <= 0) {
    const novoBaseline = Math.max(minFloor, rawAtual * PARAMS.warmupFactor);
    line(`  Modo: WARMUP (primeira execução ou baseline zerado)`);
    line(`    warmupFactor = ${PARAMS.warmupFactor}`);
    line(`    candidato    = max(${minFloor}, ${rawAtual} × ${PARAMS.warmupFactor}) = max(${minFloor}, ${rawAtual * PARAMS.warmupFactor})`);
    line(`  ➤ novoBaseline = ${novoBaseline.toLocaleString("pt-BR")}`);
    return novoBaseline;
  }

  const decayed      = baselineAnterior * decay;
  const novoBaseline = Math.max(minFloor, rawAtual, decayed);
  const limitante    = novoBaseline === rawAtual && rawAtual >= decayed
    ? "rawAtual (raw atual >= baseline decaído → raw sobe o piso)"
    : novoBaseline === decayed
      ? "decayed (baseline decaiu normalmente)"
      : "minFloor (raw e decayed abaixo do piso mínimo)";

  line(`  Modo: NORMAL`);
  line(`    decayed    = ${baselineAnterior.toFixed(2)} × ${decay} = ${decayed.toFixed(2)}`);
  line(`    candidatos = max(${minFloor}, ${rawAtual}, ${decayed.toFixed(2)})`);
  line(`    limitante  = ${limitante}`);
  line(`  ➤ novoBaseline = ${novoBaseline.toFixed(2)}`);

  return novoBaseline;
}

// ── Normalização (0 a 1) ──────────────────────────────────────────────────────

export function calcularRiscoCard(raw: number, baseline: number, label = "card"): number {
  sep2();
  line(`[RiskCalc][${label}] ▶ STEP 3 — calcularRiscoCard`);
  line(`  raw      = ${raw.toLocaleString("pt-BR")}`);
  line(`  baseline = ${baseline.toFixed(2)}`);
  line(`  gamma    = ${PARAMS.gamma}`);

  if (baseline <= 0) {
    line(`  AVISO: baseline = 0, impossível normalizar`);
    line(`  ➤ risco = 0`);
    return 0;
  }

  const ratio = raw / baseline;
  const potencia = Math.pow(ratio, PARAMS.gamma);
  const risco    = Math.min(1, potencia);

  line(`  ratio    = ${raw} / ${baseline.toFixed(2)} = ${ratio.toFixed(6)}`);
  line(`  potência = ${ratio.toFixed(6)} ^ ${PARAMS.gamma} = ${potencia.toFixed(6)}`);
  line(`  cap      = min(1, ${potencia.toFixed(6)}) = ${risco.toFixed(6)}`);
  if (risco === 1) {
    line(`  ⚠  CAPPED em 1.0 — raw igual ou superior ao baseline`);
    line(`     Isso indica que o volume atual já atingiu ou superou o histórico máximo`);
    line(`     Verifique se o baseline decaiu demais ou se houve pico real de alertas`);
  }
  line(`  ➤ risco = ${risco.toFixed(6)} (${(risco * 100).toFixed(2)}%)`);

  return risco;
}

// ── Risk Total com degradação graciosa ────────────────────────────────────────

/**
 * Calcula o Risk Total (0–100) redistribuindo pesos de cards sem dados.
 * Se todos os cards estão sem dados, retorna indiceRisco: null.
 */
export function calcularRiscoTotal(cards: {
  r1: number; raw1: number; peso1: number; // Top Hosts
  r2: number; raw2: number; peso2: number; // CIS
  r3: number; raw3: number; peso3: number; // Firewall
  r4: number; raw4: number; peso4: number; // Incidentes
}): RiscoTotalResult {
  sep();
  line(`[RiskCalc][Total] ▶ STEP 4 — calcularRiscoTotal`);

  const dataAvailability: DataAvailability = {
    topHosts: cards.raw1 > 0 ? "ok" : "missing",
    cis:      cards.raw2 > 0 ? "ok" : "missing",
    firewall: cards.raw3 > 0 ? "ok" : "missing",
    iris:     cards.raw4 > 0 ? "ok" : "missing",
  };

  const allCards = [
    { nome: "R01 TopHosts",   r: cards.r1, peso: cards.peso1, raw: cards.raw1 },
    { nome: "R02 CIS",        r: cards.r2, peso: cards.peso2, raw: cards.raw2 },
    { nome: "R03 Firewall",   r: cards.r3, peso: cards.peso3, raw: cards.raw3 },
    { nome: "R04 Incidentes", r: cards.r4, peso: cards.peso4, raw: cards.raw4 },
  ];

  line(`  Situação de cada card:`);
  allCards.forEach(({ nome, r, peso, raw }, i) => {
    const status = raw > 0 ? "✔ ATIVO" : "✘ SEM DADOS (ignorado)";
    line(`    [${i + 1}] ${nome}`);
    line(`         raw   = ${raw.toLocaleString("pt-BR")} pts`);
    line(`         risco = ${r.toFixed(6)} (${(r * 100).toFixed(2)}%)`);
    line(`         peso  = ${peso}`);
    line(`         status= ${status}`);
  });

  const activeCards = allCards.filter((c) => c.raw > 0);

  if (activeCards.length === 0) {
    line(`  ➤ Nenhum card com dados → indiceRisco = null`);
    sep();
    return { indiceRisco: null, dataAvailability };
  }

  // Pesos fixos conforme spec: cada card vale 0.25, independente de quantos têm dados.
  // Cards sem dados contribuem com 0 naturalmente (r_k = 0).
  line(`  Cards ativos: ${activeCards.map(c => c.nome).join(", ")}`);
  line(`  Pesos fixos (spec): cada card = 0.25 (soma total = 1.0)`);
  line(`  Contribuição de cada card para o índice:`);

  let soma = 0;
  allCards.forEach(({ nome, r, peso, raw }) => {
    const contribuicao = peso * r;
    soma += contribuicao;
    line(`    ${nome}: ${peso} × ${r.toFixed(6)} = ${contribuicao.toFixed(6)}${raw === 0 ? " (sem dados → 0)" : ""}`);
  });

  const indiceRisco = parseFloat((100 * soma).toFixed(2));

  line(`  soma = ${soma.toFixed(6)}`);
  line(`  indiceRisco = 100 × ${soma.toFixed(6)} = ${indiceRisco}`);
  sep();

  return { indiceRisco, dataAvailability };
}
