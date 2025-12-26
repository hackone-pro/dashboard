// src/api/acesso-wazuh/services/mitre-techniques.service.ts
import { http } from "./utils/http";
import { authHeader } from "./utils/auth";

/* ============================================
   TOP AMEAÇAS POR TÉCNICA (MITRE)
============================================ */
export async function buscarTopMitreTechniques(tenant, dias) {
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
                { match_phrase: { "data.devname": clientName } },
              ],
              minimum_should_match: 1,
            },
          },
          { exists: { field: "rule.mitre.technique" } },
        ],
        must_not: [],
      },
    },
    aggs: {
      por_tecnica: {
        terms: {
          field: "rule.mitre.technique",
          order: { _count: "desc" },
          size: 10,
        },
      },
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  const buckets =
    response.data?.aggregations?.por_tecnica?.buckets || [];

  const total = buckets.reduce(
    (sum, item) => sum + item.doc_count,
    0
  );

  return buckets.map((b) => ({
    tecnica: b.key,
    total: b.doc_count,
    percentual:
      total > 0
        ? Math.round((b.doc_count / total) * 100)
        : 0,
  }));
}

/* ============================================
   TOP AMEAÇAS POR TÁTICA (MITRE)
============================================ */
export async function buscarTopMitreTactics(tenant, dias) {
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
                { match_phrase: { "data.devname": clientName } },
              ],
              minimum_should_match: 1,
            },
          },
          { exists: { field: "rule.mitre.tactic" } },
        ],
      },
    },
    aggs: {
      por_tatica: {
        terms: {
          field: "rule.mitre.tactic",
          order: { _count: "desc" },
          size: 10,
        },
      },
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  const buckets = response.data?.aggregations?.por_tatica?.buckets || [];
  const total = buckets.reduce((s, b) => s + b.doc_count, 0);

  return buckets.map((b) => ({
    tatica: b.key,
    total: b.doc_count,
    percentual: total ? Math.round((b.doc_count / total) * 100) : 0,
  }));
}
