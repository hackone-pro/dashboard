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
  it('pesos por severidade são 1/3/9/27', () => {
    expect(calcularRawPoints({ baixo: 1, medio: 1, alto: 1, critico: 1 })).toBe(40);
  });

  it('tudo zero → 0', () => {
    expect(calcularRawPoints({ baixo: 0, medio: 0, alto: 0, critico: 0 })).toBe(0);
  });

  it('5 baixo + 2 medio + 1 alto = 5+6+9 = 20', () => {
    expect(calcularRawPoints({ baixo: 5, medio: 2, alto: 1, critico: 0 })).toBe(20);
  });

  it('só crítico: 1 × 27 = 27', () => {
    expect(calcularRawPoints({ baixo: 0, medio: 0, alto: 0, critico: 1 })).toBe(27);
  });

  it('volume alto com crítico: 10 baixo + 5 medio + 3 alto + 2 critico = 10+15+27+54 = 106', () => {
    expect(calcularRawPoints({ baixo: 10, medio: 5, alto: 3, critico: 2 })).toBe(106);
  });
});

// ─── calcularRawCIS ───────────────────────────────────────────────────────────

describe('calcularRawCIS', () => {
  it('array vazio → 0', () => {
    expect(calcularRawCIS([])).toBe(0);
  });

  it('null → 0 (defensivo)', () => {
    expect(calcularRawCIS(null as any)).toBe(0);
  });

  it('agente 100% conforme → raw = 0', () => {
    expect(calcularRawCIS([{ agente: 'host1', score: 100 }])).toBe(0);
  });

  it('agente 43% conforme → raw = 57', () => {
    expect(calcularRawCIS([{ agente: 'host1', score: 43 }])).toBe(57);
  });

  it('dois agentes independentes: média global dos scores', () => {
    // host1=80%, host2=40% → global=60% → raw=40
    expect(calcularRawCIS([
      { agente: 'host1', score: 80 },
      { agente: 'host2', score: 40 },
    ])).toBe(40);
  });

  it('múltiplas políticas no mesmo agente: faz média intra-agente primeiro', () => {
    // host1: políticas 60% e 100% → média=80% → global=80% → raw=20
    expect(calcularRawCIS([
      { agente: 'host1', score: 60 },
      { agente: 'host1', score: 100 },
    ])).toBe(20);
  });

  it('agente 0% conforme → raw = 100', () => {
    expect(calcularRawCIS([{ agente: 'host1', score: 0 }])).toBe(100);
  });
});

// ─── atualizarBaseline ────────────────────────────────────────────────────────

describe('atualizarBaseline', () => {
  it('warmup (não inicializado): max(minFloor, raw × warmupFactor)', () => {
    // raw=30, warmup=2 → 60; minFloor=50 → max(50, 60) = 60
    expect(atualizarBaseline(30, 0, false, 0.98, 50)).toBe(60);
  });

  it('warmup com raw pequeno: minFloor vence', () => {
    // raw=5, warmup=2 → 10; minFloor=50 → max(50, 10) = 50
    expect(atualizarBaseline(5, 0, false, 0.98, 50)).toBe(50);
  });

  it('inicializado=true mas baseline=0: aplica warmup (baseline <= 0)', () => {
    // Mesma lógica de warmup: max(minFloor, raw × 2)
    expect(atualizarBaseline(30, 0, true, 0.98, 50)).toBe(60);
  });

  it('modo normal: decaimento vence quando raw < anterior×decay', () => {
    // anterior=200, decay=0.98 → 196; raw=100; max(50, 100, 196) = 196
    expect(atualizarBaseline(100, 200, true, 0.98, 50)).toBe(196);
  });

  it('modo normal: raw spike vence o decaimento', () => {
    // anterior=100, decay=0.98 → 98; raw=150; max(50, 150, 98) = 150
    expect(atualizarBaseline(150, 100, true, 0.98, 50)).toBe(150);
  });

  it('modo normal: minFloor vence quando raw e decaído estão abaixo', () => {
    // anterior=30, decay=0.98 → 29.4; raw=10; max(50, 10, 29.4) = 50
    expect(atualizarBaseline(10, 30, true, 0.98, 50)).toBe(50);
  });

  it('baseline decai a ~0.98/dia com PARAMS.decayAlertas em 288 ticks', () => {
    // Após 288 ticks (1 dia), baseline deve ser ≈ 98% do original
    let baseline = 1000;
    for (let i = 0; i < 288; i++) {
      // raw=0 (inatividade total) → baseline cai pelo decay; minFloor=50
      baseline = atualizarBaseline(0, baseline, true, PARAMS.decayAlertas, 50);
    }
    // Tolerância: entre 97% e 99% (fator real ≈ 0.98)
    expect(baseline).toBeGreaterThan(970);
    expect(baseline).toBeLessThan(990);
  });
});

// ─── calcularRiscoCard ────────────────────────────────────────────────────────

describe('calcularRiscoCard', () => {
  it('baseline = 0 → risco = 0 (sem divisão por zero)', () => {
    expect(calcularRiscoCard(100, 0)).toBe(0);
  });

  it('raw = 0, baseline > 0 → risco = 0', () => {
    expect(calcularRiscoCard(0, 1000)).toBe(0);
  });

  it('raw = baseline → risco = 1.0 (teto)', () => {
    expect(calcularRiscoCard(100, 100)).toBe(1);
  });

  it('raw > baseline → clamped a 1.0', () => {
    expect(calcularRiscoCard(200, 100)).toBe(1);
  });

  it('raw = 50% do baseline → (0.5)^gamma = (0.5)^1.5 ≈ 0.354', () => {
    expect(calcularRiscoCard(50, 100)).toBeCloseTo(Math.pow(0.5, 1.5), 5);
  });

  it('raw = 75% do baseline → (0.75)^1.5 ≈ 0.6495', () => {
    expect(calcularRiscoCard(75, 100)).toBeCloseTo(Math.pow(0.75, 1.5), 5);
  });

  it('gamma > 1 suprime riscos baixos: 90% do baseline resulta em risco < 0.9', () => {
    // Com gamma=1.5, x^1.5 < x para 0<x<1 → risco é menor que a proporção linear
    // (0.9)^1.5 ≈ 0.854, nunca > 0.9
    expect(calcularRiscoCard(90, 100)).toBeLessThan(0.9);
    expect(calcularRiscoCard(90, 100)).toBeCloseTo(Math.pow(0.9, 1.5), 5);
  });

  it('usa PARAMS.gamma da spec', () => {
    const expected = Math.min(1, Math.pow(0.5, PARAMS.gamma));
    expect(calcularRiscoCard(50, 100)).toBeCloseTo(expected, 5);
  });
});

// ─── calcularRiscoTotal ───────────────────────────────────────────────────────
//
// PESOS FIXOS (conforme spec seção 8):
//   RiskTotal = 100 × (0.25×r1 + 0.25×r2 + 0.25×r3 + 0.25×r4)
//   Cards sem dados (raw=0) contribuem 0 — NÃO redistribuem pesos.
//   Consequência: com 1 card ativo em r=0.5 → índice = 12.5 (não 50).
// ─────────────────────────────────────────────────────────────────────────────

describe('calcularRiscoTotal', () => {

  // ── Edge: todas as fontes off ─────────────────────────────────────────────

  it('todas fontes off → indiceRisco = null', () => {
    const result = calcularRiscoTotal({
      r1: 0, raw1: 0, peso1: 0.25,
      r2: 0, raw2: 0, peso2: 0.25,
      r3: 0, raw3: 0, peso3: 0.25,
      r4: 0, raw4: 0, peso4: 0.25,
    });
    expect(result.indiceRisco).toBeNull();
    expect(result.dataAvailability).toEqual({
      topHosts: 'missing', cis: 'missing', firewall: 'missing', iris: 'missing',
    });
  });

  // ── Cenário full: 4 cards ativos ─────────────────────────────────────────

  it('4 cards ativos: soma ponderada com pesos 0.25 cada', () => {
    // 100 × (0.25×0.8 + 0.25×0.6 + 0.25×0.7 + 0.25×0.5) = 100 × 0.65 = 65
    const result = calcularRiscoTotal({
      r1: 0.8, raw1: 400, peso1: 0.25,
      r2: 0.6, raw2: 300, peso2: 0.25,
      r3: 0.7, raw3: 350, peso3: 0.25,
      r4: 0.5, raw4: 250, peso4: 0.25,
    });
    expect(result.indiceRisco).toBe(65);
    expect(result.dataAvailability).toEqual({
      topHosts: 'ok', cis: 'ok', firewall: 'ok', iris: 'ok',
    });
  });

  it('4 cards com risco máximo → índice = 100', () => {
    const result = calcularRiscoTotal({
      r1: 1, raw1: 1, peso1: 0.25,
      r2: 1, raw2: 1, peso2: 0.25,
      r3: 1, raw3: 1, peso3: 0.25,
      r4: 1, raw4: 1, peso4: 0.25,
    });
    expect(result.indiceRisco).toBe(100);
  });

  // ── Cenário parcial: 1 card ativo ─────────────────────────────────────────

  it('só firewall ativo (r=0.5): índice = 100×0.25×0.5 = 12.5', () => {
    // Pesos fixos: card ativo contribui 0.25×r, demais contribuem 0
    const result = calcularRiscoTotal({
      r1: 0,   raw1: 0,   peso1: 0.25,
      r2: 0,   raw2: 0,   peso2: 0.25,
      r3: 0.5, raw3: 100, peso3: 0.25,
      r4: 0,   raw4: 0,   peso4: 0.25,
    });
    expect(result.indiceRisco).toBe(12.5);
    expect(result.dataAvailability.firewall).toBe('ok');
    expect(result.dataAvailability.topHosts).toBe('missing');
    expect(result.dataAvailability.cis).toBe('missing');
    expect(result.dataAvailability.iris).toBe('missing');
  });

  // ── Cenário parcial: 2 cards ativos ──────────────────────────────────────

  it('firewall (r=0.6) + incidentes (r=0.4): índice = 100×(0.25×0.6+0.25×0.4) = 25', () => {
    const result = calcularRiscoTotal({
      r1: 0,   raw1: 0,   peso1: 0.25,
      r2: 0,   raw2: 0,   peso2: 0.25,
      r3: 0.6, raw3: 200, peso3: 0.25,
      r4: 0.4, raw4: 80,  peso4: 0.25,
    });
    expect(result.indiceRisco).toBe(25);
    expect(result.dataAvailability.firewall).toBe('ok');
    expect(result.dataAvailability.iris).toBe('ok');
    expect(result.dataAvailability.topHosts).toBe('missing');
    expect(result.dataAvailability.cis).toBe('missing');
  });

  // ── Pesos fixos: contribuição de cada card é invariante ───────────────────

  it('pesos fixos: contribuição de r3 é 0.25×r3 independente dos outros cards', () => {
    // Com 1 card ativo:
    const r3Only = calcularRiscoTotal({
      r1: 0,   raw1: 0, peso1: 0.25,
      r2: 0,   raw2: 0, peso2: 0.25,
      r3: 0.8, raw3: 1, peso3: 0.25,
      r4: 0,   raw4: 0, peso4: 0.25,
    });
    // Com 4 cards ativos (outros em r=0.3):
    const r3WithOthers = calcularRiscoTotal({
      r1: 0.3, raw1: 1, peso1: 0.25,
      r2: 0.3, raw2: 1, peso2: 0.25,
      r3: 0.8, raw3: 1, peso3: 0.25,
      r4: 0.3, raw4: 1, peso4: 0.25,
    });
    // Contribuição de r3 deve ser 0.25×0.8=0.2 em ambos → 20 pontos
    expect(r3Only.indiceRisco).toBe(20);
    expect(r3WithOthers.indiceRisco! - r3Only.indiceRisco!).toBeCloseTo(
      // diferença = contribuição dos outros 3 cards
      100 * (0.25 * 0.3 + 0.25 * 0.3 + 0.25 * 0.3), 5
    );
  });

  // ── dataAvailability ─────────────────────────────────────────────────────

  it('dataAvailability reflete presença de raw > 0', () => {
    const result = calcularRiscoTotal({
      r1: 0.5, raw1: 10, peso1: 0.25,
      r2: 0,   raw2: 0,  peso2: 0.25,
      r3: 0.5, raw3: 10, peso3: 0.25,
      r4: 0,   raw4: 0,  peso4: 0.25,
    });
    expect(result.dataAvailability.topHosts).toBe('ok');
    expect(result.dataAvailability.cis).toBe('missing');
    expect(result.dataAvailability.firewall).toBe('ok');
    expect(result.dataAvailability.iris).toBe('missing');
  });

  // ── decay para janelas longas (1 tick/dia) ───────────────────────────────
  //
  // PARAMS.decayAlertas foi calibrado para o cron de 5 min (288 ticks/dia).
  // Para janelas longas (7d/15d/30d) que rodam 1x/dia usa-se
  // PARAMS.decayAlertasLongo — half-life ≈ 14 dias por execução.
  // ─────────────────────────────────────────────────────────────────────────

  const BASELINE_BOOTSTRAP = 112_000_000; // bootstrap típico 30d (baseline_1d × 30)
  const RAW_REAL_30D       =  25_000_000; // volume real observado nos últimos 30d

  it('PARAMS.decayAlertasLongo existe, é < 1 e < decayAlertas por tick', () => {
    expect(PARAMS.decayAlertasLongo).toBeDefined();
    expect(PARAMS.decayAlertasLongo).toBeGreaterThan(0.9);
    expect(PARAMS.decayAlertasLongo).toBeLessThan(1);
    expect(PARAMS.decayAlertasLongo).toBeLessThan(PARAMS.decayAlertas);
  });

  it('decayAlertas (5min) em 90 dias de 1 tick/dia quase não converge', () => {
    let baseline = BASELINE_BOOTSTRAP;
    for (let dia = 0; dia < 90; dia++) {
      baseline = atualizarBaseline(RAW_REAL_30D, baseline, true, PARAMS.decayAlertas, 50);
    }
    // 0.9999298^90 ≈ 0.9937 → baseline ≈ 111.3M, longe dos 25M reais
    expect(baseline).toBeGreaterThan(110_000_000);
  });

  it('decayAlertasLongo: 1 tick reduz mais que decayAlertas × 288 ticks', () => {
    const apos1TickLongo = atualizarBaseline(
      RAW_REAL_30D, BASELINE_BOOTSTRAP, true, PARAMS.decayAlertasLongo, 50,
    );
    let apos288TicksCurto = BASELINE_BOOTSTRAP;
    for (let i = 0; i < 288; i++) {
      apos288TicksCurto = atualizarBaseline(
        RAW_REAL_30D, apos288TicksCurto, true, PARAMS.decayAlertas, 50,
      );
    }
    // 1 execução/dia com decayLongo reduz mais que 288 execuções/dia com decayCurto
    expect(apos1TickLongo).toBeLessThan(apos288TicksCurto);
  });

  it('decayAlertasLongo converge abaixo de 50M em 20 dias de 1 tick/dia', () => {
    let baseline = BASELINE_BOOTSTRAP;
    for (let dia = 0; dia < 20; dia++) {
      baseline = atualizarBaseline(RAW_REAL_30D, baseline, true, PARAMS.decayAlertasLongo, 50);
    }
    // half-life ≈ 14d → após 20d: < 50M e ainda > raw
    expect(baseline).toBeLessThan(50_000_000);
    expect(baseline).toBeGreaterThan(RAW_REAL_30D);
  });

  it('decayAlertasLongo converge próximo do raw após 60 dias de 1 tick/dia', () => {
    let baseline = BASELINE_BOOTSTRAP;
    for (let dia = 0; dia < 60; dia++) {
      baseline = atualizarBaseline(RAW_REAL_30D, baseline, true, PARAMS.decayAlertasLongo, 50);
    }
    // Após ~4 half-lives (60d / 14d): baseline ≈ RAW_REAL
    expect(baseline).toBeLessThan(30_000_000);
  });

  // ── Consistência com a spec (seção 8) ───────────────────────────────────

  it('spec seção 8: RiskTotal = 100 × Σ(peso_k × r_k) com pesos 0.25 fixos', () => {
    const r1 = 0.4, r2 = 0.7, r3 = 0.2, r4 = 0.9;
    const expected = parseFloat((100 * (0.25 * r1 + 0.25 * r2 + 0.25 * r3 + 0.25 * r4)).toFixed(2));
    const result = calcularRiscoTotal({
      r1, raw1: 1, peso1: 0.25,
      r2, raw2: 1, peso2: 0.25,
      r3, raw3: 1, peso3: 0.25,
      r4, raw4: 1, peso4: 0.25,
    });
    expect(result.indiceRisco).toBe(expected);
  });
});
