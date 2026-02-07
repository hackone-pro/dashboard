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
        { term: { "customer.keyword": clientName } },
        { term: { customer: clientName } },
        { term: { "data.customer.keyword": clientName } },
        { term: { "data.customer": clientName } },
        { term: { "fields.customer.keyword": clientName } },
        { term: { "fields.customer": clientName } },
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
    query: {
      bool: {
        must: [customerFilter],
      },
    },
    aggs: {
      firewalls: {
        terms: {
          field,
          size: 200,
          order: { _count: "desc" },
        },
        aggs: {
          ultimo_log: {
            top_hits: {
              size: 1,
              sort: [{ _doc: "desc" }],
              _source: true,
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

      if (buckets.length > 0) break;
    } catch {
      continue;
    }
  }

  return buckets.map((b: any) => {
    const hit = b.ultimo_log?.hits?.hits?.[0]?._source || {};

    return {
      id: b.key,
      nome: b.key,
      location: hit.location ?? null,
      timestamp: hit.timestamp ?? null,
    };
  });
}



/* ============================================
   TOP GERADORES DE FIREWALL
============================================ */
export async function buscarTopGeradoresFirewall(
  tenant,
  dias,
  periodo?: { from?: string; to?: string }
) {
  const clientName = tenant.wazuh_client_name;

  /* ======================
     TIME FILTER (PRIORIDADE CALENDÁRIO)
  ====================== */

  let timeFilter;

  if (periodo?.from && periodo?.to) {
    timeFilter = {
      range: {
        "@timestamp": {
          gte: periodo.from,
          lte: periodo.to,
        },
      },
    };
  } else if (dias === "todos") {
    timeFilter = { match_all: {} };
  } else if (dias === "10min") {
    timeFilter = {
      range: {
        "@timestamp": { gte: "now-10m", lte: "now" },
      },
    };
  } else {
    timeFilter = {
      range: {
        "@timestamp": { gte: `now-${dias}d`, lte: "now" },
      },
    };
  }

  /* ======================
     CUSTOMER FILTER
  ====================== */

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

  /* ======================
     CAMPOS POSSÍVEIS DE DEVNAME
  ====================== */

  const DEVNAME_FIELDS = [
    "data.devname.keyword",
    "data.devname",
    "devname.keyword",
    "devname",
    "fields.devname.keyword",
    "fields.devname",
  ];

  /* ======================
     QUERY BUILDER
  ====================== */

  const buildBody = (field: string, usarCustomer: boolean) => ({
    size: 0,
    query: {
      bool: {
        must: [
          timeFilter,
          ...(usarCustomer ? [customerFilterUniversal] : []),
        ],
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
              _source: {
                includes: ["@timestamp", "location"],
              },
              size: 1,
            },
          },
          com_severidade: {
            filter: {
              exists: { field: "rule.level" },
            },
            aggs: {
              severidade: {
                range: {
                  field: "rule.level",
                  ranges: [
                    { from: 0, to: 6, key: "Low" },
                    { from: 7, to: 11, key: "Medium" },
                    { from: 12, to: 14, key: "High" },
                    { from: 15, key: "Critical" },
                  ],
                },
              },
            },
          },
        },
      },
    },
  });

  /* ======================
     EXECUÇÃO COM FALLBACK
  ====================== */

  const baseURL = `${tenant.wazuh_url}/wazuh-*/_search`;
  let buckets: any[] = [];
  let usandoCustomer = true;

  for (const field of DEVNAME_FIELDS) {
    try {
      // 🔹 1ª tentativa — COM customer
      let response = await http.post(
        baseURL,
        buildBody(field, true),
        { headers: authHeader(tenant) }
      );

      buckets =
        response.data?.aggregations?.top_geradores?.buckets || [];

      // 🔹 fallback — SEM customer
      if (buckets.length === 0) {
        response = await http.post(
          baseURL,
          buildBody(field, false),
          { headers: authHeader(tenant) }
        );

        buckets =
          response.data?.aggregations?.top_geradores?.buckets || [];

        if (buckets.length > 0) {
          usandoCustomer = false;
          console.warn(
            "Wazuh sem campo customer. Fallback aplicado.",
            "Campo devname:",
            field
          );
        }
      }

      if (buckets.length > 0) {
        console.log(
          `Campo devname detectado: ${field} | customer: ${usandoCustomer}`
        );
        break;
      }
    } catch (err) {
      continue;
    }
  }

  /* ======================
     NORMALIZAÇÃO FINAL
  ====================== */

  return buckets.map((b) => {
    const sev = b.com_severidade?.severidade?.buckets || [];

    const get = (k: string) =>
      sev.find((x) => x.key === k)?.doc_count || 0;

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
      meta: {
        usouCustomer: usandoCustomer,
      },
    };
  });
}

