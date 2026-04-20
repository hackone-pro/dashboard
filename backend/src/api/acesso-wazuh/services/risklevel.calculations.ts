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

// ── Raw Points ────────────────────────────────────────────────────────────────

export function calcularRawPoints(counts: SeveridadeCounts): number {
  return (
    counts.baixo   * SEVERITY_WEIGHTS.baixo   +
    counts.medio   * SEVERITY_WEIGHTS.medio   +
    counts.alto    * SEVERITY_WEIGHTS.alto    +
    counts.critico * SEVERITY_WEIGHTS.critico
  );
}

// ── Raw do CIS — não-conformidade média dos agentes ───────────────────────────

export function calcularRawCIS(agentes: any[]): number {
  if (!agentes?.length) return 0;

  const porAgente = new Map<string, { scoreSum: number; policies: number }>();

  agentes.forEach((a: any) => {
    const nome  = a.agente ?? "unknown";
    const score = Number(a.score ?? 0);
    if (!porAgente.has(nome)) porAgente.set(nome, { scoreSum: 0, policies: 0 });
    const entry = porAgente.get(nome)!;
    entry.scoreSum += score;
    entry.policies += 1;
  });

  let totalScore = 0, totalAgentes = 0;
  porAgente.forEach(({ scoreSum, policies }) => {
    totalScore   += scoreSum / policies;
    totalAgentes += 1;
  });

  if (totalAgentes === 0) return 0;
  return Math.max(0, 100 - totalScore / totalAgentes);
}

// ── Baseline e Decaimento ─────────────────────────────────────────────────────

export function atualizarBaseline(
  rawAtual: number,
  baselineAnterior: number,
  inicializado: boolean,
  decay: number,
  minFloor: number
): number {
  if (!inicializado || baselineAnterior <= 0)
    return Math.max(minFloor, rawAtual * PARAMS.warmupFactor);

  return Math.max(minFloor, rawAtual, baselineAnterior * decay);
}

// ── Normalização (0 a 1) ──────────────────────────────────────────────────────

export function calcularRiscoCard(raw: number, baseline: number): number {
  if (baseline <= 0) return 0;
  return Math.min(1, Math.pow(raw / baseline, PARAMS.gamma));
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
  const dataAvailability: DataAvailability = {
    topHosts: cards.raw1 > 0 ? "ok" : "missing",
    cis:      cards.raw2 > 0 ? "ok" : "missing",
    firewall: cards.raw3 > 0 ? "ok" : "missing",
    iris:     cards.raw4 > 0 ? "ok" : "missing",
  };

  const activeCards = [
    { r: cards.r1, peso: cards.peso1, hasData: cards.raw1 > 0 },
    { r: cards.r2, peso: cards.peso2, hasData: cards.raw2 > 0 },
    { r: cards.r3, peso: cards.peso3, hasData: cards.raw3 > 0 },
    { r: cards.r4, peso: cards.peso4, hasData: cards.raw4 > 0 },
  ].filter((c) => c.hasData);

  if (activeCards.length === 0) {
    return { indiceRisco: null, dataAvailability };
  }

  const pesoTotal = activeCards.reduce((s, c) => s + c.peso, 0);
  const indiceRisco = parseFloat(
    (100 * activeCards.reduce((s, c) => s + (c.peso / pesoTotal) * c.r, 0)).toFixed(2)
  );

  return { indiceRisco, dataAvailability };
}
