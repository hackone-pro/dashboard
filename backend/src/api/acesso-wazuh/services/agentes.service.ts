// src/api/acesso-wazuh/services/agentes.service.ts
import axios from "axios";
import https from "https";
import { http } from "./utils/http";
import { authHeader } from "./utils/auth";

/* ============================================
   TOP AGENTES (syscheck)
============================================ */
export async function buscarTopAgentes(
  tenant,
  opts?: {
    from?: string;
    to?: string;
    dias?: string;
  }
) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) {
    throw new Error("Tenant sem client_name definido");
  }

  const { from, to, dias = "1" } = opts ?? {};

  // ----------------------------------
  // FILTRO DE TEMPO (PRIORIDADE)
  // ----------------------------------
  const timeFilter =
    from && to
      ? {
        bool: {
          should: [
            { range: { "data.timestamp": { gte: from, lte: to } } },
            { range: { "@timestamp": { gte: from, lte: to } } }
          ],
          minimum_should_match: 1
        }
      }
      : dias === "todos"
        ? { match_all: {} }
        : {
          bool: {
            should: [
              { range: { "data.timestamp": { gte: `now-${dias}d`, lte: "now" } } },
              { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } }
            ],
            minimum_should_match: 1
          }
        };


  // ----------------------------------
  // QUERY ÚNICA (syscheck)
  // ----------------------------------
  const body = {
    size: 0,
    query: {
      bool: {
        must: [
          timeFilter,
          { match_phrase: { customer: clientName } },
        ],
        filter: [
          { match_phrase: { "rule.groups": "syscheck" } },
        ],
        must_not: [
          { match_phrase: { "agent.name": "wazuhhackone" } },
        ],
      },
    },
    aggs: {
      top_agentes_alertas: {
        terms: {
          field: "agent.name",
          order: { _count: "desc" },
          size: 9,
        },
        aggs: {
          por_severidade: { terms: { field: "rule.level" } },
          por_evento: { terms: { field: "syscheck.event" } },
        },
      },
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    {
      headers: authHeader(tenant),
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    }
  );

  const agentes = response.data?.aggregations?.top_agentes_alertas?.buckets || [];

  return agentes.map((agente) => {
    const total =
      agente.por_severidade?.buckets?.reduce(
        (sum, item) => sum + item.doc_count,
        0
      ) || 0;

    const scoreBruto =
      agente.por_severidade?.buckets?.reduce((acc, item) => {
        const level = Number(item.key);
        const peso =
          level <= 6 ? 0.2 :
            level <= 11 ? 0.6 :
              level <= 14 ? 0.87 :
                1.0;

        return acc + item.doc_count * peso;
      }, 0) || 0;

    const score = total > 0 ? scoreBruto / total : 0;

    let nivel;
    if (score >= 1.0) nivel = "Crítico";
    else if (score >= 0.87) nivel = "Alto";
    else if (score >= 0.6) nivel = "Médio";
    else nivel = "Baixo";

    const eventos = agente.por_evento?.buckets || [];
    const modified = eventos.find((e) => e.key === "modified")?.doc_count || 0;
    const added = eventos.find((e) => e.key === "added")?.doc_count || 0;
    const deleted = eventos.find((e) => e.key === "deleted")?.doc_count || 0;

    return {
      agente: agente.key,
      total_alertas: total,
      severidades: agente.por_severidade.buckets,
      nivel_risco: nivel,
      score: Math.round(score * 100),

      modified,
      added,
      deleted,
    };
  });
}

export async function buscarTopAlteracoesArquivo(tenant, dias) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const diasFormatado = dias === "todos" ? null : String(dias).replace("d", "");

  const timeFilter =
    dias === "todos"
      ? { match_all: {} }
      : {
        range: {
          "@timestamp": {
            gte: `now-${diasFormatado}d`,
            lte: "now",
          },
        },
      };

  const body = {
    size: 0,
    query: {
      bool: {
        must: [
          timeFilter,
          {
            bool: {
              should: [
                { match_phrase: { customer: clientName } },
                { match_phrase: { "data.customer": clientName } },
                { match_phrase: { "fields.customer": clientName } },
              ],
              minimum_should_match: 1,
            },
          },
        ],
        filter: [
          { match_phrase: { "rule.groups": "syscheck" } },
        ],
        must_not: [
          { term: { "agent.name": "wazuhhackone" } },
        ],
      },
    },
    aggs: {
      top_hosts: {
        terms: {
          field: "agent.name",
          order: { _count: "desc" },
          size: 9,
        },
        aggs: {
          por_evento: { terms: { field: "syscheck.event" } },
        },
      },
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  const hosts = response.data?.aggregations?.top_hosts?.buckets || [];

  return hosts.map((h) => {
    const modified = h.por_evento.buckets.find(e => e.key === "modified")?.doc_count || 0;
    const added = h.por_evento.buckets.find(e => e.key === "added")?.doc_count || 0;
    const deleted = h.por_evento.buckets.find(e => e.key === "deleted")?.doc_count || 0;

    return {
      host: h.key,
      modified,
      added,
      deleted,
      total: modified + added + deleted,
    };
  });
}


/* ============================================
   TOP AGENTES CIS
============================================ */
export async function buscarTopAgentesCis(
  tenant,
  time: { dias: string } | { from: string; to: string }
) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) {
    throw new Error("Tenant sem client_name definido");
  }

  // ----------------------------------
  // FILTRO DE TEMPO (UNIFICADO)
  // ----------------------------------
  let timeFilter = null;

  if ("from" in time && "to" in time) {
    // intervalo absoluto (calendário)
    timeFilter = {
      range: {
        "@timestamp": {
          gte: time.from,
          lte: time.to,
        },
      },
    };
  } else if (time.dias !== "todos") {
    // intervalo relativo (dias)
    timeFilter = {
      range: {
        "@timestamp": {
          gte: `now-${time.dias}d`,
          lte: "now",
        },
      },
    };
  }

  // ----------------------------------
  // CUSTOMER FILTER (SEMPRE APLICADO)
  // ----------------------------------
  const customerFilter = {
    match_phrase: { customer: clientName },
  };

  // ----------------------------------
  // BODY FINAL
  // ----------------------------------
  const body = {
    size: 0,
    query: {
      bool: {
        filter: [
          customerFilter,
          { term: { "rule.groups": "sca" } },
          { term: { "data.sca.type": "summary" } },
          ...(timeFilter ? [timeFilter] : []),
        ],
      },
    },
    aggs: {
      agentes: {
        terms: {
          field: "agent.name",
          size: 20,
        },
        aggs: {
          ultimos_summary: {
            top_hits: {
              _source: ["agent.name", "data.sca"],
              size: 1,
              sort: [{ "@timestamp": { order: "desc" } }],
            },
          },
        },
      },
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  const buckets = response.data?.aggregations?.agentes?.buckets ?? [];

  return buckets.map((b) => {
    const hit = b.ultimos_summary.hits.hits[0]?._source;
    const sca = hit?.data?.sca ?? {};

    const scoreWazuh = Number(sca.score ?? 0);

    return {
      agente: b.key,
      total_eventos: b.doc_count,
      score: scoreWazuh,
      total_checks: Number(sca.total_checks ?? 0),
      passed: Number(sca.passed ?? 0),
      failed: Number(sca.failed ?? 0),
      policy: sca.policy ?? "Desconhecida",
      score_cis_percent: scoreWazuh,
    };
  });
}


/* ======================================================
   TOP AGENTES — SYSHECK (INTEGRIDADE DE ARQUIVOS)
====================================================== */
export async function buscarTopAgentesSyscheck(
  tenant,
  opts?: {
    from?: string;
    to?: string;
    dias?: string;
  }
) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) {
    throw new Error("Tenant sem wazuh_client_name definido");
  }

  const { from, to, dias = "todos" } = opts ?? {};

  // --------------------------------------------------
  // 🔥 FILTRO DE TEMPO (prioridade: from/to)
  // --------------------------------------------------
  const timeFilter =
    from && to
      ? {
        range: {
          "@timestamp": {
            gte: from,
            lte: to,
          },
        },
      }
      : dias === "todos"
        ? { match_all: {} }
        : {
          range: {
            "@timestamp": {
              gte: `now-${dias}d`,
              lte: "now",
            },
          },
        };

  // --------------------------------------------------
  // 🔥 QUERY SYSHECK (PADRÃO FUNCIONAL)
  // --------------------------------------------------
  const body = {
    size: 0,
    query: {
      bool: {
        must: [
          timeFilter,
          { match_phrase: { customer: clientName } },
        ],
        filter: [
          { match_phrase: { "rule.groups": "syscheck" } },
        ],
        must_not: [
          { match_phrase: { "agent.name": "wazuhhackone" } },
        ],
      },
    },
    aggs: {
      top_agentes_alertas: {
        terms: {
          field: "agent.name",
          order: { _count: "desc" },
          size: 9,
        },
        aggs: {
          por_severidade: {
            terms: { field: "rule.level" },
          },
          por_evento: {
            terms: { field: "syscheck.event" },
          },
        },
      },
    },
  };

  // --------------------------------------------------
  // 🔥 EXECUÇÃO
  // --------------------------------------------------
  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  const agentes =
    response.data?.aggregations?.top_agentes_alertas?.buckets ?? [];

  // --------------------------------------------------
  // 🔥 NORMALIZAÇÃO (IGUAL AO FRONT)
  // --------------------------------------------------
  return agentes.map((agente) => {
    const total =
      agente.por_severidade?.buckets?.reduce(
        (sum, item) => sum + item.doc_count,
        0
      ) ?? 0;

    const score =
      (agente.por_severidade?.buckets?.reduce((acc, item) => {
        const peso =
          item.key <= 6
            ? 0.2
            : item.key <= 11
              ? 0.6
              : item.key <= 14
                ? 0.87
                : 1.0;
        return acc + item.doc_count * peso;
      }, 0) || 0) / (total || 1);

    const eventos = agente.por_evento?.buckets ?? [];

    return {
      agente: agente.key,
      total_alertas: total,
      severidades: agente.por_severidade?.buckets ?? [],
      score: Math.round(score * 100),
      modified:
        eventos.find((e) => e.key === "modified")?.doc_count ?? 0,
      added:
        eventos.find((e) => e.key === "added")?.doc_count ?? 0,
      deleted:
        eventos.find((e) => e.key === "deleted")?.doc_count ?? 0,
    };
  });
}