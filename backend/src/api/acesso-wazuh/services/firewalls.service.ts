// src/api/acesso-wazuh/services/firewalls.service.ts
import { http } from "./utils/http";
import { authHeader } from "./utils/auth";

/* ============================================
   LISTA DE FIREWALLS
============================================ */
export async function buscarListaFirewalls(tenant) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const customerFilter = {
    bool: {
      should: [
        { term: { "data.customer": clientName } },
        { term: { "data.customer.keyword": clientName } },
        { term: { customer: clientName } },
        { term: { "customer.keyword": clientName } },
        { term: { "fields.customer": clientName } },
        { term: { "fields.customer.keyword": clientName } },
      ],
      minimum_should_match: 1,
    },
  };

  const DEVNAME_FIELDS = [
    "data.devname.keyword",
    "data.devname",
    "devname.keyword",
    "devname",
    "fields.devname.keyword",
    "fields.devname",
  ];

  const buildBody = (field: string) => ({
    size: 0,
    query: { bool: { must: [customerFilter] } },
    aggs: {
      firewalls: {
        terms: {
          field,
          size: 200,
          order: { _key: "asc" },
        },
        aggs: {
          get_ip: {
            top_hits: {
              _source: { includes: ["location"] },
              size: 1,
            },
          },
        },
      },
    },
  });

  const baseURL = `${tenant.wazuh_url}/wazuh-*/_search`;
  let buckets = [];

  for (const field of DEVNAME_FIELDS) {
    try {
      const response = await http.post(
        baseURL,
        buildBody(field),
        { headers: authHeader(tenant) }
      );

      buckets = response.data?.aggregations?.firewalls?.buckets || [];

      if (buckets.length > 0) {
        console.log("🔥 Campo devname detectado:", field);
        break;
      }
    } catch (err) {
      continue;
    }
  }

  return buckets.map((b: any) => {
    const hit = b.get_ip?.hits?.hits?.[0]?._source || {};
    return {
      id: b.key,
      nome: b.key,
      location: hit.location || null,
    };
  });
}

/* ============================================
   TOP GERADORES DE FIREWALL
============================================ */
export async function buscarTopGeradoresFirewall(tenant, dias) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const timeFilter =
    dias === "todos"
      ? { match_all: {} }
      : dias === "10min"
        ? { range: { "@timestamp": { gte: "now-10m", lte: "now" } } }
        : { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } };

  const customerFilterUniversal = {
    bool: {
      should: [
        { term: { "data.customer": clientName } },
        { term: { "data.customer.keyword": clientName } },
        { term: { customer: clientName } },
        { term: { "customer.keyword": clientName } },
        { term: { "fields.customer": clientName } },
        { term: { "fields.customer.keyword": clientName } },
      ],
      minimum_should_match: 1,
    },
  };

  const DEVNAME_FIELDS = [
    "data.devname.keyword",
    "data.devname",
    "devname.keyword",
    "devname",
    "fields.devname.keyword",
    "fields.devname",
  ];

  const buildBody = (field) => ({
    size: 0,
    query: {
      bool: {
        must: [customerFilterUniversal, timeFilter],
      },
    },
    aggs: {
      top_geradores: {
        terms: {
          field,
          size: 8,
          order: { _count: "desc" },
        },
        aggs: {
          get_ip: {
            top_hits: {
              _source: { includes: ["@timestamp"] },
              size: 1,
            },
          },
          severidade: {
            range: {
              field: "rule.level",
              ranges: [
                { to: 7, key: "Low" },
                { from: 7, to: 12, key: "Medium" },
                { from: 12, to: 15, key: "High" },
                { from: 15, key: "Critical" },
              ],
            },
          },
        },
      },
    },
  });

  const baseURL = `${tenant.wazuh_url}/wazuh-*/_search`;
  let buckets: any[] = [];

  for (const field of DEVNAME_FIELDS) {
    try {
      const response = await http.post(
        baseURL,
        buildBody(field),
        { headers: authHeader(tenant) }
      );

      buckets = response.data?.aggregations?.top_geradores?.buckets || [];

      if (buckets.length > 0) {
        console.log("🔥 Campo de devname detectado:", field);
        break;
      }
    } catch (err) {
      continue;
    }
  }

  return buckets.map((b) => {
    const sev = b.severidade?.buckets || [];
    const get = (k) => sev.find((x) => x.key === k)?.doc_count || 0;

    const hit = b.get_ip?.hits?.hits?.[0]?._source || {};

    return {
      gerador: b.key,
      ip: hit.location || null,
      timestamp: hit["@timestamp"] || null,
      total: b.doc_count,
      severidade: {
        baixo: get("Low"),
        medio: get("Medium"),
        alto: get("High"),
        critico: get("Critical"),
      },
    };
  });
}
