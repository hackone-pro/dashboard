import {
  calcularRawPoints,
  calcularRawCIS,
  atualizarBaseline,
  calcularRiscoCard,
  calcularRiscoTotal,
  PARAMS,
} from '../src/api/acesso-wazuh/services/risklevel.calculations';

// ─── calcularRawPoints ────────────────────────────────────────────────────────

describe('calcularRawPoints', () => {
  it('weights severities as 1/3/9/27', () => {
    const result = calcularRawPoints({ baixo: 1, medio: 1, alto: 1, critico: 1 });
    expect(result).toBe(1 + 3 + 9 + 27); // 40
  });

  it('returns 0 for all-zero counts', () => {
    expect(calcularRawPoints({ baixo: 0, medio: 0, alto: 0, critico: 0 })).toBe(0);
  });

  it('example: 5 baixo + 2 medio + 1 alto = 20', () => {
    expect(calcularRawPoints({ baixo: 5, medio: 2, alto: 1, critico: 0 })).toBe(20);
  });
});

// ─── calcularRawCIS ───────────────────────────────────────────────────────────

describe('calcularRawCIS', () => {
  it('returns 0 for empty list', () => {
    expect(calcularRawCIS([])).toBe(0);
  });

  it('single agent 100% conformant → raw = 0', () => {
    expect(calcularRawCIS([{ agente: 'host1', score: 100 }])).toBe(0);
  });

  it('single agent 43% conformant → raw = 57', () => {
    expect(calcularRawCIS([{ agente: 'host1', score: 43 }])).toBe(57);
  });

  it('two agents — averages their scores', () => {
    // host1: 80%, host2: 40% → global 60% → raw = 40
    const result = calcularRawCIS([
      { agente: 'host1', score: 80 },
      { agente: 'host2', score: 40 },
    ]);
    expect(result).toBe(40);
  });

  it('multiple policies per agent — averages within agent first', () => {
    // host1 has 2 policies: 60% and 100% → agent score = 80%
    // global = 80% → raw = 20
    const result = calcularRawCIS([
      { agente: 'host1', score: 60 },
      { agente: 'host1', score: 100 },
    ]);
    expect(result).toBe(20);
  });
});

// ─── atualizarBaseline ────────────────────────────────────────────────────────

describe('atualizarBaseline', () => {
  it('warmup (não inicializado): baseline = max(minFloor, raw × 2)', () => {
    const result = atualizarBaseline(30, 0, false, 0.98, 50);
    expect(result).toBe(60); // max(50, 30×2) = 60
  });

  it('warmup com raw baixo respeita o minFloor', () => {
    const result = atualizarBaseline(5, 0, false, 0.98, 50);
    expect(result).toBe(50); // max(50, 5×2=10) = 50
  });

  it('decay normal: max(minFloor, raw, anterior × decay)', () => {
    // anterior=200, decay=0.98 → 196; raw=100; floor=50 → max(50,100,196)=196
    const result = atualizarBaseline(100, 200, true, 0.98, 50);
    expect(result).toBe(196);
  });

  it('raw spike: raw maior que anterior×decay vence', () => {
    // anterior=100, decay=0.98 → 98; raw=150 → max(50,150,98)=150
    const result = atualizarBaseline(150, 100, true, 0.98, 50);
    expect(result).toBe(150);
  });
});

// ─── calcularRiscoCard ────────────────────────────────────────────────────────

describe('calcularRiscoCard', () => {
  it('returns 0 when baseline is 0', () => {
    expect(calcularRiscoCard(100, 0)).toBe(0);
  });

  it('returns 1 when raw >= baseline (cap at 1)', () => {
    expect(calcularRiscoCard(200, 100)).toBe(1);
  });

  it('raw = baseline → r = 1.0', () => {
    expect(calcularRiscoCard(100, 100)).toBe(1);
  });

  it('raw = 50% of baseline → r ≈ 0.354 (0.5^1.5)', () => {
    const result = calcularRiscoCard(50, 100);
    expect(result).toBeCloseTo(Math.pow(0.5, 1.5), 3);
  });
});

// ─── calcularRiscoTotal (R03 — degradação graciosa) ───────────────────────────

describe('calcularRiscoTotal', () => {

  // ── Cenário 1: Essentials — só firewall ──────────────────────────────────────

  it('Cenário 1 (Essentials): apenas firewall ativo — sem penalização por cards ausentes', () => {
    // raw1=0 (TopHosts), raw2=0 (CIS), raw3=100 (Firewall), raw4=0 (IRIS)
    // r3=0.5 (raw/baseline = 50%), pesos redistribuídos: firewall usa 100%
    // → RiskTotal = 100 × (0.25/0.25) × 0.5 = 50
    const result = calcularRiscoTotal({
      r1: 0, raw1: 0,   peso1: 0.25,
      r2: 0, raw2: 0,   peso2: 0.25,
      r3: 0.5, raw3: 100, peso3: 0.25,
      r4: 0, raw4: 0,   peso4: 0.25,
    });
    expect(result.indiceRisco).toBe(50);
    expect(result.dataAvailability.firewall).toBe('ok');
    expect(result.dataAvailability.topHosts).toBe('missing');
    expect(result.dataAvailability.cis).toBe('missing');
    expect(result.dataAvailability.iris).toBe('missing');
  });

  // ── Cenário 2: Firewall + Incidentes variados ─────────────────────────────

  it('Cenário 2 (Firewall + Incidentes): dois cards ativos, pesos redistribuídos 50/50', () => {
    // r3=0.6 (Firewall), r4=0.4 (Incidentes), raw1=0, raw2=0
    // pesos redistribuídos: 0.25+0.25 = 0.5 total; cada card usa 0.25/0.5 = 50%
    // → RiskTotal = 100 × (0.5×0.6 + 0.5×0.4) = 100 × 0.5 = 50
    const result = calcularRiscoTotal({
      r1: 0,   raw1: 0,   peso1: 0.25,
      r2: 0,   raw2: 0,   peso2: 0.25,
      r3: 0.6, raw3: 200, peso3: 0.25,
      r4: 0.4, raw4: 80,  peso4: 0.25,
    });
    expect(result.indiceRisco).toBe(50);
    expect(result.dataAvailability.firewall).toBe('ok');
    expect(result.dataAvailability.iris).toBe('ok');
    expect(result.dataAvailability.topHosts).toBe('missing');
    expect(result.dataAvailability.cis).toBe('missing');
  });

  // ── Cenário 3: Completo com CIS (Full) — todos os 4 cards ─────────────────

  it('Cenário 3 (Full): todos os 4 cards ativos — pesos originais 25% cada', () => {
    // r1=0.8, r2=0.6, r3=0.7, r4=0.5
    // RiskTotal = 100 × (0.25×0.8 + 0.25×0.6 + 0.25×0.7 + 0.25×0.5)
    //           = 100 × 0.65 = 65
    const result = calcularRiscoTotal({
      r1: 0.8, raw1: 400, peso1: 0.25,
      r2: 0.6, raw2: 300, peso2: 0.25,
      r3: 0.7, raw3: 350, peso3: 0.25,
      r4: 0.5, raw4: 250, peso4: 0.25,
    });
    expect(result.indiceRisco).toBe(65);
    expect(result.dataAvailability.topHosts).toBe('ok');
    expect(result.dataAvailability.cis).toBe('ok');
    expect(result.dataAvailability.firewall).toBe('ok');
    expect(result.dataAvailability.iris).toBe('ok');
  });

  // ── Edge case: todas fontes indisponíveis ──────────────────────────────────

  it('todas fontes off → indiceRisco = null', () => {
    const result = calcularRiscoTotal({
      r1: 0, raw1: 0, peso1: 0.25,
      r2: 0, raw2: 0, peso2: 0.25,
      r3: 0, raw3: 0, peso3: 0.25,
      r4: 0, raw4: 0, peso4: 0.25,
    });
    expect(result.indiceRisco).toBeNull();
    expect(result.dataAvailability.topHosts).toBe('missing');
    expect(result.dataAvailability.cis).toBe('missing');
    expect(result.dataAvailability.firewall).toBe('missing');
    expect(result.dataAvailability.iris).toBe('missing');
  });

  it('cenário 1 sem penalização: score NOT zerado por cards ausentes', () => {
    // Garantia que degradação graciosa NÃO penaliza
    // Comparar score com 1 card vs score com 4 cards (todos r=0.5)
    const scoreUmCard = calcularRiscoTotal({
      r1: 0, raw1: 0, peso1: 0.25,
      r2: 0, raw2: 0, peso2: 0.25,
      r3: 0.5, raw3: 1, peso3: 0.25,
      r4: 0, raw4: 0, peso4: 0.25,
    }).indiceRisco;

    const scoreQuatroCards = calcularRiscoTotal({
      r1: 0.5, raw1: 1, peso1: 0.25,
      r2: 0.5, raw2: 1, peso2: 0.25,
      r3: 0.5, raw3: 1, peso3: 0.25,
      r4: 0.5, raw4: 1, peso4: 0.25,
    }).indiceRisco;

    // Ambos devem resultar em 50 (mesma r para cards ativos)
    expect(scoreUmCard).toBe(scoreQuatroCards);
  });
});
