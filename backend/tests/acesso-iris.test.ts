// tests/acesso-iris.test.ts
//
// Testa buscarIncidentesIris isolado de HTTP real.
// Mocka axios.get para retornar casos controlados; strapi apenas para logging.

import axios from 'axios';
import { buscarIncidentesIris } from '../src/api/acesso-iris/services/acesso-iris';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

// Strapi global mínimo (só logging)
(global as any).strapi = {
  log: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
};

// ─── Fixtures ────────────────────────────────────────────────────────────────

const tenant = {
  iris_url:         'https://iris.test',
  iris_apikey:      'token-test',
  iris_customer_id: '1',
  cliente_name:     'Acme',
};

const userAnalista = { owner_name_iris: 'analista_x' };

/**
 * Cria um objeto no formato bruto que a API IRIS retorna (ANTES da normalização
 * feita por buscarCasos). open_date é YYYY-MM-DD.
 */
function casoIris(overrides: {
  case_id?:     number;
  open_date?:   string;   // YYYY-MM-DD
  state_id?:    number;
  owner?:       string;
  severity?:    string;
} = {}) {
  const hoje = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return {
    case_id:           overrides.case_id  ?? 1,
    open_date:         overrides.open_date ?? hoje,
    state:             { state_id: overrides.state_id ?? 3, state_name: 'Open' },
    owner:             { user_name: overrides.owner ?? 'analista_x' },
    severity:          { severity_name: overrides.severity ?? 'low' },
    name:              `Case ${overrides.case_id ?? 1}`,
    description:       '',
    client:            { customer_name: 'Acme' },
    classification_id: 1,
    initial_date:      null,
    soc_id:            null,
    close_date:        null,
    access_level:      0,
  };
}

/** Retorna uma data no formato YYYY-MM-DD relativa a hoje. */
function dataRelativa(diasAtras: number): string {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString().slice(0, 10);
}

function mockIris(casos: ReturnType<typeof casoIris>[]) {
  axiosMock.get.mockResolvedValue({ data: { data: casos } });
}

// ─── filtrarPorOwner: comportamento padrão ───────────────────────────────────

describe('buscarIncidentesIris — filtrarPorOwner (padrão = true)', () => {

  beforeEach(() => jest.clearAllMocks());

  it('sem opcoes: conta apenas casos do owner do usuário logado', async () => {
    mockIris([
      casoIris({ case_id: 1, owner: 'analista_x' }),    // ← incluído
      casoIris({ case_id: 2, owner: 'outro_analista' }), // ← excluído
    ]);

    const result = await buscarIncidentesIris(tenant, { dias: '7' }, userAnalista);
    expect(result.total).toBe(1);
  });

  it('user=null (cron legado): inclui owner vazio e Inteligencia_Artificial', async () => {
    mockIris([
      casoIris({ case_id: 1, owner: 'analista_x' }),             // excluído
      casoIris({ case_id: 2, owner: '' }),                        // incluído (owner vazio)
      casoIris({ case_id: 3, owner: 'Inteligencia_Artificial' }), // incluído
    ]);

    const result = await buscarIncidentesIris(tenant, { dias: '7' }, null);
    expect(result.total).toBe(2);
  });
});

// ─── filtrarPorOwner: false (modo risco) ────────────────────────────────────

describe('buscarIncidentesIris — filtrarPorOwner: false', () => {

  beforeEach(() => jest.clearAllMocks());

  it('conta TODOS os casos abertos do período, independente de owner', async () => {
    mockIris([
      casoIris({ case_id: 1, owner: 'analista_x' }),
      casoIris({ case_id: 2, owner: 'outro_analista' }),
      casoIris({ case_id: 3, owner: '' }),
    ]);

    const result = await buscarIncidentesIris(
      tenant, { dias: '7' }, userAnalista,
      { filtrarPorOwner: false },
    );
    expect(result.total).toBe(3);
  });

  it('user=null (cron): conta todos — sem filtro de owner', async () => {
    mockIris([
      casoIris({ case_id: 1, owner: 'analista_x' }),
      casoIris({ case_id: 2, owner: 'outro_analista' }),
      casoIris({ case_id: 3, owner: 'Inteligencia_Artificial' }),
    ]);

    const result = await buscarIncidentesIris(
      tenant, { dias: '30' }, null,
      { filtrarPorOwner: false },
    );
    expect(result.total).toBe(3);
  });

  it('casos fechados (state_id=9) são sempre excluídos', async () => {
    mockIris([
      casoIris({ case_id: 1, owner: 'x', state_id: 9 }), // fechado → excluído
      casoIris({ case_id: 2, owner: 'y' }),               // aberto  → incluído
    ]);

    const result = await buscarIncidentesIris(
      tenant, { dias: '7' }, null,
      { filtrarPorOwner: false },
    );
    expect(result.total).toBe(1);
  });

  it('filtro de data ainda exclui casos antigos', async () => {
    mockIris([
      casoIris({ case_id: 1, open_date: dataRelativa(3)  }), // dentro de 7d ✓
      casoIris({ case_id: 2, open_date: dataRelativa(10) }), // fora de 7d  ✗
    ]);

    const result = await buscarIncidentesIris(
      tenant, { dias: '7' }, null,
      { filtrarPorOwner: false },
    );
    expect(result.total).toBe(1);
  });

  it('range { from, to } com filtrarPorOwner: false conta todos no período', async () => {
    const from = new Date(dataRelativa(5)).toISOString();
    const to   = new Date().toISOString();

    mockIris([
      casoIris({ case_id: 1, open_date: dataRelativa(3), owner: 'a' }), // dentro ✓
      casoIris({ case_id: 2, open_date: dataRelativa(8), owner: 'b' }), // fora   ✗
    ]);

    const result = await buscarIncidentesIris(
      tenant, { from, to }, null,
      { filtrarPorOwner: false },
    );
    expect(result.total).toBe(1);
  });

  it('severidades são contadas corretamente com filtrarPorOwner: false', async () => {
    mockIris([
      casoIris({ case_id: 1, owner: 'a', severity: 'Critical' }),
      casoIris({ case_id: 2, owner: 'b', severity: 'High' }),
      casoIris({ case_id: 3, owner: 'c', severity: 'Medium' }),
      casoIris({ case_id: 4, owner: 'd', severity: 'Low' }),
    ]);

    const result = await buscarIncidentesIris(
      tenant, { dias: '7' }, null,
      { filtrarPorOwner: false },
    );

    expect(result.total).toBe(4);
    expect(result.critico).toBe(1);
    expect(result.alto).toBe(1);
    expect(result.medio).toBe(1);
    expect(result.baixo).toBe(1);
  });

  it('todos = 0 quando nenhum caso está no período', async () => {
    mockIris([
      casoIris({ case_id: 1, open_date: dataRelativa(60) }), // fora de 7d
    ]);

    const result = await buscarIncidentesIris(
      tenant, { dias: '7' }, null,
      { filtrarPorOwner: false },
    );
    expect(result.total).toBe(0);
    expect(result.critico + result.alto + result.medio + result.baixo).toBe(0);
  });
});
