// src/api/acesso-wazuh/services/agentes.service.ts
import { http } from "./utils/http";
import { authHeader } from "./utils/auth";

/* ============================================
   TOP AGENTES (syscheck)
============================================ */
export async function buscarTopAgentes(tenant, dias) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  // Detecta se é Equatorial (Fortigate-only)
  const isEquatorial =
    clientName.toLowerCase().includes("equatorial") ||
    (tenant.customer && tenant.customer.toLowerCase().includes("equatorial"));

  const timeFilter =
    dias === "todos"
      ? { match_all: {} }
      : {
          range: {
            "@timestamp": {
              gte: `now-${dias}d`,
              lte: "now",
            },
          },
        };

  // -------------------------------
  // 🔥 QUERY PARA EQUATORIAL
  // -------------------------------
  const bodyEquatorial = {
    size: 0,
    query: {
      bool: {
        must: [
          timeFilter,
          { match_phrase: { customer: clientName } },
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
        },
      },
    },
  };

  // -------------------------------
  // 🔥 QUERY ORIGINAL (syscheck)
  // -------------------------------
  const bodySyscheck = {
    size: 0,
    stored_fields: ["*"],
    script_fields: {},
    docvalue_fields: [
      { field: "timestamp", format: "date_time" },
      { field: "syscheck.mtime_after", format: "date_time" },
      { field: "syscheck.mtime_before", format: "date_time" },
      { field: "data.vulnerability.published", format: "date_time" },
      { field: "data.vulnerability.updated", format: "date_time" },
      { field: "data.timestamp", format: "date_time" },
      { field: "data.aws.createdAt", format: "date_time" },
      { field: "data.aws.end", format: "date_time" },
      { field: "data.aws.start", format: "date_time" },
      { field: "data.aws.updatedAt", format: "date_time" },
    ],
    _source: {
      excludes: ["@timestamp"],
    },
    query: {
      bool: {
        must: [
          timeFilter,
          { match_phrase: { customer: clientName } },
        ],
        filter: [
          { match_phrase: { "rule.groups": { query: "syscheck" } } },
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

  // Escolhe automaticamente a query
  const finalQuery = isEquatorial ? bodyEquatorial : bodySyscheck;

  // Execução
  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    finalQuery,
    { headers: authHeader(tenant) }
  );

  const agentes =
    response.data?.aggregations?.top_agentes_alertas?.buckets || [];

  return agentes.map((agente) => {
    const total = agente.por_severidade?.buckets?.reduce(
      (sum, item) => sum + item.doc_count,
      0
    ) || 0;

    const score =
      (agente.por_severidade?.buckets?.reduce((acc, item) => {
        const peso =
          item.key >= 0 && item.key <= 6
            ? 0.2
            : item.key <= 11
            ? 0.6
            : item.key <= 14
            ? 0.87
            : 1.0;
        return acc + item.doc_count * peso;
      }, 0) || 0) / (total || 1);

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
      severidades: agente.por_severidade?.buckets || [],
      nivel_risco: nivel,
      score: Math.round(score * 100),
      modified,
      added,
      deleted,
    };
  });
}

/* ============================================
   TOP AGENTES CIS
============================================ */
export async function buscarTopAgentesCis(tenant, dias) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const timeFilter =
    dias === "todos"
      ? null
      : {
          range: {
            "@timestamp": {
              gte: `now-${dias}d`,
              lte: "now",
            },
          },
        };

  const body = {
    size: 0,
    query: {
      bool: {
        must: [],
        filter: [
          { match_all: {} },
          { match_phrase: { customer: clientName } },
          { term: { "rule.groups": "sca" } },
          { term: { "data.sca.type": "summary" } },
          ...(timeFilter ? [timeFilter] : []),
        ],
      },
    },
    aggs: {
      agentes: {
        terms: { field: "agent.name", size: 20 },
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

  const buckets = response.data.aggregations?.agentes?.buckets ?? [];

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
