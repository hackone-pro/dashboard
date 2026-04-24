import {
  buscarTopGeradoresFirewall,
  buscarTopAgentes,
} from "../services/acesso-wazuh";

import { buscarIncidentesIris } from "../../acesso-iris/services/acesso-iris";
import { buscarTopAgentesCis } from "../services/acesso-wazuh";

import {
  calcularRawPoints,
  calcularRawCIS,
  atualizarBaseline,
  calcularRiscoCard,
  calcularRiscoTotal,
  PARAMS,
  type SeveridadeCounts,
} from "./risklevel.calculations";

import {
  getBaselineFromAlerts,
  saveBaselineToAlerts,
} from "./risklevel-alerts-client";

// =====================================================
// 🔹 TIPAGEM
// =====================================================

interface Periodo {
  from: string;
  to: string;
}

interface RiskFilters {
  diasFirewall?: string;
  diasAgentes?: string;
  diasIris?: string;
  periodo?: Periodo | null;
  user?: any;
  salvarBaselineRemoto?: boolean;
}

// Baseline de uma janela específica (ex: "1", "7", "15", "30")
interface BaselineJanela {
  top_hosts:   number;
  cis:         number;
  firewall:    number;
  incidents:   number;
  initialized: boolean;
}

// Estado completo persistido por tenant — um slot por janela canônica
interface BaselineState {
  "1":  BaselineJanela;
  "7":  BaselineJanela;
  "15": BaselineJanela;
  "30": BaselineJanela;
}

// =====================================================
// 🔹 JANELAS CANÔNICAS
//    Somente essas janelas têm baseline próprio persistido.
//    Ranges customizados (periodo) usam o baseline de "1"
//    como fallback e nunca persistem.
// =====================================================

const JANELAS_CANONICAS = ["1", "7", "15", "30"] as const;
type JanelaCanonica = typeof JANELAS_CANONICAS[number];

const BASELINE_VAZIO: BaselineJanela = {
  top_hosts:   0,
  cis:         0,
  firewall:    0,
  incidents:   0,
  initialized: false,
};

const BASELINE_STATE_VAZIO: BaselineState = {
  "1":  { ...BASELINE_VAZIO },
  "7":  { ...BASELINE_VAZIO },
  "15": { ...BASELINE_VAZIO },
  "30": { ...BASELINE_VAZIO },
};


// =====================================================
// 🔹 CHAVE DE PERSISTÊNCIA DO BASELINE (por tenant)
//    v2 = nova estrutura com baseline por janela
// =====================================================

function getBaselineKey(tenantId: number | string): string {
  return `risklevel_baseline_v2_tenant_${tenantId}`;
}

// =====================================================
// 🔹 LEITURA DO BASELINE PERSISTIDO
// =====================================================

async function lerBaseline(tenantId: number | string): Promise<BaselineState> {
  try {
    const store = strapi.store({
      environment: strapi.config.environment,
      type: "plugin",
      name: "risklevel",
    });

    const estado = await store.get({ key: getBaselineKey(tenantId) }) as BaselineState | null;

    if (!estado) return { ...BASELINE_STATE_VAZIO };

    // Garante que todos os slots existem mesmo em estados antigos
    return {
      "1":  { ...BASELINE_VAZIO, ...estado["1"]  },
      "7":  { ...BASELINE_VAZIO, ...estado["7"]  },
      "15": { ...BASELINE_VAZIO, ...estado["15"] },
      "30": { ...BASELINE_VAZIO, ...estado["30"] },
    };
  } catch (error) {
    strapi.log.warn(`[RiskLevel] Falha ao ler baseline do tenant ${tenantId}: ${error}`);
    return { ...BASELINE_STATE_VAZIO };
  }
}

// =====================================================
// 🔹 PERSISTÊNCIA DO BASELINE
//    Salva apenas o slot da janela calculada,
//    preservando os demais slots intactos.
// =====================================================

async function salvarBaselineJanela(
  tenantId: number | string,
  janela: JanelaCanonica,
  novoSlot: BaselineJanela
): Promise<void> {
  try {
    const store = strapi.store({
      environment: strapi.config.environment,
      type: "plugin",
      name: "risklevel",
    });

    const estadoAtual = await lerBaseline(tenantId);
    const novoEstado: BaselineState = {
      ...estadoAtual,
      [janela]: novoSlot,
    };

    await store.set({ key: getBaselineKey(tenantId), value: novoEstado });
  } catch (error) {
    strapi.log.warn(`[RiskLevel] Falha ao salvar baseline do tenant ${tenantId}: ${error}`);
  }
}

// =====================================================
// 🔹 RESOLUÇÃO DA JANELA FALLBACK PARA RANGES CUSTOMIZADOS
//    Mapeia a duração do range para a janela canônica
//    mais próxima, para usar o baseline mais relevante.
//
//    Range  ≤ 4d  → baseline "1"  (24h)
//    Range  ≤ 10d → baseline "7"  (7d)
//    Range  ≤ 20d → baseline "15" (15d)
//    Range  > 20d → baseline "30" (30d)
// =====================================================

function resolverJanelaFallback(periodo: Periodo): JanelaCanonica {
  const diffMs   = new Date(periodo.to).getTime() - new Date(periodo.from).getTime();
  const diffDias = diffMs / (1000 * 60 * 60 * 24);

  if (diffDias <= 4)  return "1";
  if (diffDias <= 10) return "7";
  if (diffDias <= 20) return "15";
  return "30";
}

// =====================================================
// 🔹 FUNÇÃO PRINCIPAL (REUTILIZÁVEL)
// =====================================================

export async function calcularRiskOperacionalTenant(
  tenant: any,
  filtros: RiskFilters = {}
) {
  try {
    const diasFirewall          = filtros?.diasFirewall          || "1";
    const diasAgentes           = filtros?.diasAgentes           || "1";
    const diasIris              = filtros?.diasIris              || "1";
    const periodo               = filtros?.periodo               || null;
    const user                  = filtros?.user                  || null;
    const salvarBaselineRemoto  = filtros?.salvarBaselineRemoto  ?? false;

    // =====================================================
    // 🔹 DETERMINAR JANELA ATIVA
    //
    //    Janela canônica: todos os cards no mesmo período
    //    fixo (1, 7, 15 ou 30 dias) sem range customizado.
    //    → Baseline próprio persistido e atualizado.
    //
    //    Range customizado (periodo) ou janelas mistas:
    //    → Usa baseline da janela "1" como fallback.
    //    → Nunca persiste.
    // =====================================================

    const todosMesmoDia =
      diasFirewall === diasAgentes && diasAgentes === diasIris;

    const janelaCanonica: JanelaCanonica | null =
      !periodo &&
      todosMesmoDia &&
      (JANELAS_CANONICAS as readonly string[]).includes(diasAgentes)
        ? (diasAgentes as JanelaCanonica)
        : null;

    // Ranges customizados usam a janela canônica mais próxima como fallback
    const janelaFallback: JanelaCanonica = periodo
      ? resolverJanelaFallback(periodo)
      : "1";
    const janelaBaseline = janelaCanonica ?? janelaFallback;

    // =====================================================
    // 🔹 PROMISES RESILIENTES
    // =====================================================

    const firewallPromise =
      tenant?.wazuh_url
        ? buscarTopGeradoresFirewall(tenant, diasFirewall, periodo)
        : Promise.resolve([]);

    const agentesPromise =
      tenant?.wazuh_url
        ? buscarTopAgentes(tenant, {
            dias: diasAgentes,
            from: periodo?.from,
            to: periodo?.to,
          })
        : Promise.resolve([]);

    const cisPromise =
      tenant?.wazuh_url
        ? buscarTopAgentesCis(
            tenant,
            periodo
              ? { from: periodo.from, to: periodo.to }
              : { dias: diasAgentes }
          )
        : Promise.resolve([]);

    const irisPromise =
      tenant?.iris_url
        ? buscarIncidentesIris(
            tenant,
            periodo
              ? { from: periodo.from, to: periodo.to }
              : { dias: diasIris },
            user
          )
        : Promise.resolve(null);

    // =====================================================
    // 🔹 EXECUTAR EM PARALELO
    // =====================================================

    const [firewalls, agentes, cisAgentes, iris] = await Promise.all([
      firewallPromise,
      agentesPromise,
      cisPromise,
      irisPromise,
    ]);

    // =====================================================
    // 🔹 AGREGAR SEVERIDADES POR CARD
    //    Card 1 → Top Hosts (agentes Wazuh)
    //    Card 2 → CIS (raw = não-conformidade média)
    //    Card 3 → Firewall
    //    Card 4 → Incidentes (IRIS — snapshot abertos)
    // =====================================================

    const countsTopHosts:  SeveridadeCounts = { baixo: 0, medio: 0, alto: 0, critico: 0 };
    const countsFirewall:  SeveridadeCounts = { baixo: 0, medio: 0, alto: 0, critico: 0 };
    const countsIncidents: SeveridadeCounts = { baixo: 0, medio: 0, alto: 0, critico: 0 };

    // 🔸 Card 1 — Top Hosts (agentes Wazuh)
    agentes?.forEach((agente: any) => {
      agente?.severidades?.forEach((s: any) => {
        if      (s.key <= 6)  countsTopHosts.baixo   += s.doc_count || 0;
        else if (s.key <= 11) countsTopHosts.medio   += s.doc_count || 0;
        else if (s.key <= 14) countsTopHosts.alto    += s.doc_count || 0;
        else                  countsTopHosts.critico += s.doc_count || 0;
      });
    });

    // 🔸 Card 3 — Firewall
    firewalls?.forEach((fw: any) => {
      countsFirewall.baixo   += fw?.severidade?.baixo   || 0;
      countsFirewall.medio   += fw?.severidade?.medio   || 0;
      countsFirewall.alto    += fw?.severidade?.alto    || 0;
      countsFirewall.critico += fw?.severidade?.critico || 0;
    });

    // 🔸 Card 4 — Incidentes IRIS (snapshot atual de abertos)
    if (iris && typeof iris === "object") {
      countsIncidents.baixo   = iris.baixo   || 0;
      countsIncidents.medio   = iris.medio   || 0;
      countsIncidents.alto    = iris.alto    || 0;
      countsIncidents.critico = iris.critico || 0;
    }

    // =====================================================
    // 🔹 TOTAIS AGREGADOS (retrocompatibilidade)
    // =====================================================

    const baixo   = countsTopHosts.baixo   + countsFirewall.baixo   + countsIncidents.baixo;
    const medio   = countsTopHosts.medio   + countsFirewall.medio   + countsIncidents.medio;
    const alto    = countsTopHosts.alto    + countsFirewall.alto    + countsIncidents.alto;
    const critico = countsTopHosts.critico + countsFirewall.critico + countsIncidents.critico;
    const total   = baixo + medio + alto + critico;

    // =====================================================
    // 🔹 RAW POINTS POR CARD
    // =====================================================

    const rawTopHosts  = calcularRawPoints(countsTopHosts,  "TopHosts");
    const rawCIS       = calcularRawCIS(cisAgentes);
    const rawFirewall  = calcularRawPoints(countsFirewall,  "Firewall");
    const rawIncidents = calcularRawPoints(countsIncidents, "Incidentes");

    // =====================================================
    // 🔹 BASELINE: ler estado anterior e atualizar
    //    Usa o slot da janela ativa (ou fallback "1")
    // =====================================================

    // Resolve o draft id (o que o admin e o controller enxergam).
    // O cron recebe o published entry (id alto); o documentId é comum aos dois.
    let tenantKey: number | string = tenant.id;
    if (tenant.documentId) {
      const draft = await strapi.db.query("api::tenant.tenant").findOne({
        where: { documentId: tenant.documentId, publishedAt: null },
        select: ["id"],
      });
      if (draft?.id) tenantKey = draft.id;
    }

    // Baseline lido exclusivamente da API de Alertas.
    // Janelas canônicas: tenta buscar na API; se não encontrar (204) → WARMUP (initialized: false).
    // Janelas customizadas (não canônicas): sem histórico remoto → sempre WARMUP.
    let slotAnterior: BaselineJanela = { ...BASELINE_VAZIO };

    if (janelaCanonica) {
      const windowHours = parseInt(janelaCanonica) * 24;
      const remoto = await getBaselineFromAlerts(tenantKey, windowHours);

      if (remoto) {
        slotAnterior = {
          top_hosts:   remoto.topHosts,
          cis:         remoto.cis,
          firewall:    remoto.firewall,
          incidents:   remoto.incidents,
          initialized: true,
        };
        strapi.log.info(
          `[RiskLevel] tenant=${tenantKey} (${tenant.organizacao}) — baseline remoto ` +
          `(janela=${remoto.windowHours}h, calculado em ${remoto.calculatedAt})`
        );
      } else {
        strapi.log.info(
          `[RiskLevel] tenant=${tenantKey} (${tenant.organizacao}) — sem baseline remoto, aplicando WARMUP`
        );
      }
    }

    const novoTopHosts = atualizarBaseline(
      rawTopHosts,
      slotAnterior.top_hosts,
      slotAnterior.initialized,
      PARAMS.decayAlertas,
      PARAMS.minFloorAlertas,
      "TopHosts"
    );

    const novoCIS = atualizarBaseline(
      rawCIS,
      slotAnterior.cis,
      slotAnterior.initialized,
      PARAMS.decayAlertas,
      PARAMS.minFloorAlertas,
      "CIS"
    );

    const novoFirewall = atualizarBaseline(
      rawFirewall,
      slotAnterior.firewall,
      slotAnterior.initialized,
      PARAMS.decayAlertas,
      PARAMS.minFloorAlertas,
      "Firewall"
    );

    const novoIncidents = atualizarBaseline(
      rawIncidents,
      slotAnterior.incidents,
      slotAnterior.initialized,
      PARAMS.decayIncidentes,
      PARAMS.minFloorIncidentes,
      "Incidentes"
    );

    // =====================================================
    // 🔹 PERSISTIR BASELINE
    //    Só persiste em janelas canônicas (1, 7, 15, 30d).
    //    Ranges customizados (periodo) nunca persistem.
    // =====================================================

    if (janelaCanonica) {
      await salvarBaselineJanela(
        tenantKey,
        janelaCanonica,
        {
          top_hosts:   novoTopHosts,
          cis:         novoCIS,
          firewall:    novoFirewall,
          incidents:   novoIncidents,
          initialized: true,
        }
      );

      // Persiste na API de Alerts para histórico distribuído (apenas via cron)
      if (salvarBaselineRemoto) {
        const windowHours  = parseInt(janelaCanonica) * 24;
        const windowTo     = new Date();
        const windowFrom   = new Date(windowTo.getTime() - windowHours * 60 * 60 * 1000);

        await saveBaselineToAlerts(tenantKey, windowFrom, windowTo, {
          topHosts:  novoTopHosts,
          cis:       novoCIS,
          firewall:  novoFirewall,
          incidents: novoIncidents,
        });

        strapi.log.info(
          `[RiskLevel][CRON] tenant=${tenantKey} (${tenant.organizacao}) — baseline salvo na API de Alerts ` +
          `(janela=${windowHours}h, topHosts=${novoTopHosts.toFixed(0)}, cis=${novoCIS.toFixed(0)}, ` +
          `firewall=${novoFirewall.toFixed(0)}, incidents=${novoIncidents.toFixed(0)})`
        );
      }
    } else {
      strapi.log.debug(
        `[RiskLevel] tenant=${tenantKey} — baseline NÃO persistido ` +
        `(range customizado — usando fallback "${janelaFallback}")`
      );
    }

    // =====================================================
    // 🔹 RISCO NORMALIZADO POR CARD (0 a 1)
    //    r_k = min(1, (raw / baseline) ^ gamma)
    // =====================================================

    const r1 = calcularRiscoCard(rawTopHosts,  novoTopHosts,  "TopHosts");
    const r2 = calcularRiscoCard(rawCIS,        novoCIS,        "CIS");
    const r3 = calcularRiscoCard(rawFirewall,   novoFirewall,   "Firewall");
    const r4 = calcularRiscoCard(rawIncidents,  novoIncidents,  "Incidentes");

    // =====================================================
    // 🔹 RISK TOTAL (0 a 100) com degradação graciosa
    //    Pesos redistribuídos entre cards com dados.
    //    Se todos sem dados: indiceRisco = null.
    // =====================================================

    const { indiceRisco, dataAvailability } = calcularRiscoTotal({
      r1, raw1: rawTopHosts,  peso1: PARAMS.pesoTopHosts,
      r2, raw2: rawCIS,        peso2: PARAMS.pesoCIS,
      r3, raw3: rawFirewall,   peso3: PARAMS.pesoFirewall,
      r4, raw4: rawIncidents,  peso4: PARAMS.pesoIncidentes,
    });

    // =====================================================
    // 🔹 LOG TÉCNICO
    // =====================================================

    strapi.log.info(
      `[RiskLevel] tenant=${tenantKey} janela=${janelaCanonica ?? "customizado→" + janelaFallback} ` +
      `raw=[${rawTopHosts}, ${rawCIS.toFixed(1)}, ${rawFirewall}, ${rawIncidents}] ` +
      `baseline=[${novoTopHosts.toFixed(0)}, ${novoCIS.toFixed(0)}, ` +
      `${novoFirewall.toFixed(0)}, ${novoIncidents.toFixed(0)}] ` +
      `r=[${r1.toFixed(3)}, ${r2.toFixed(3)}, ${r3.toFixed(3)}, ${r4.toFixed(3)}] ` +
      `→ RiskTotal=${indiceRisco}`
    );

    // =====================================================
    // 🔹 RESPONSE (mesma interface do controller original)
    // =====================================================

    return {
      severidades: {
        baixo,
        medio,
        alto,
        critico,
        total,
      },
      indiceRisco,
      dataAvailability,

      _debug: {
        janela: janelaCanonica ?? `customizado (fallback: ${janelaFallback})`,
        cards: {
          topHosts:  { raw: rawTopHosts,  baseline: novoTopHosts,  risco: r1 },
          cis:       { raw: rawCIS,        baseline: novoCIS,        risco: r2 },
          firewall:  { raw: rawFirewall,   baseline: novoFirewall,   risco: r3 },
          incidents: { raw: rawIncidents,  baseline: novoIncidents,  risco: r4 },
        },
        warmup: !slotAnterior.initialized,
      },
    };

  } catch (error: any) {
    strapi.log.warn(
      `⚠️ Risk operacional falhou tenant ${tenant?.id}: ${error?.message}`
    );

    return {
      severidades: {
        baixo: 0,
        medio: 0,
        alto: 0,
        critico: 0,
        total: 0,
      },
      indiceRisco: null,
      dataAvailability: {
        topHosts: "missing" as const,
        cis:      "missing" as const,
        firewall: "missing" as const,
        iris:     "missing" as const,
      },
    };
  }
}