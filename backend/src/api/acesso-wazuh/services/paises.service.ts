import { http } from "./utils/http";
import { authHeader } from "./utils/auth";
import { isPrivateIp } from "./utils/ip";

/* ===============================================
   HELPER — TIME FILTER (dias OU range)
=============================================== */
function buildTimeFilter({
  dias,
  range,
}: {
  dias?: string;
  range?: string;
}) {
  if (range) {
    return {
      range: {
        "@timestamp": {
          gte: `now-${range}`,
          lte: "now",
        },
      },
    };
  }

  if (!dias || dias === "todos") {
    return { match_all: {} };
  }

  return {
    range: {
      "@timestamp": {
        gte: `now-${dias}d`,
        lte: "now",
      },
    },
  };
}

/* ===============================================
   TOP PAÍSES DE ATAQUES (ORIGEM + DESTINO)
=============================================== */
export async function buscarTopPaisesAtaque(
  tenant,
  { dias, range }: { dias?: string; range?: string }
) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const timeFilter = buildTimeFilter({ dias, range });

  const body = {
    size: 0,
    query: {
      bool: {
        must: [
          {
            bool: {
              should: [
                { term: { "data.customer": clientName } },
                { term: { customer: clientName } },
                { term: { "fields.customer": clientName } },
              ],
              minimum_should_match: 1,
            },
          },
          timeFilter,
          { term: { "rule.groups": "fortigate" } },
        ],
        must_not: [
          {
            terms: {
              "data.srccountry": ["Reserved", "Unknown", "N/A", "-", ""],
            },
          },
        ],
        filter: [{ range: { "rule.level": { gte: 1, lte: 15 } } }],
      },
    },

    aggs: {
      top_countries: {
        terms: { field: "data.srccountry", size: 10 },
        aggs: {
          severidade: {
            range: {
              field: "rule.level",
              ranges: [
                { from: 0, to: 6, key: "Baixo" },
                { from: 7, to: 11, key: "Médio" },
                { from: 12, to: 14, key: "Alto" },
                { from: 15, key: "Crítico" },
              ],
            },
          },
        },
      },

      top_destinos: {
        terms: { field: "data.dstip", size: 10 },
        aggs: {
          rule_info: {
            top_hits: {
              size: 1,
              _source: ["rule.description", "rule.mitre.technique"],
            },
          },

          agentes: { terms: { field: "agent.name", size: 1 } },

          origens: {
            terms: { field: "data.srcip", size: 10 },
            aggs: {
              pais_origem: {
                terms: { field: "GeoLocation.country_name", size: 1 },
              },
              srcport: { terms: { field: "data.srcport", size: 1 } },
              servico: { terms: { field: "data.service", size: 1 } },
              interface: { terms: { field: "data.srcintf", size: 1 } },
              location: {
                top_hits: {
                  size: 1,
                  _source: ["GeoLocation.location"],
                },
              },
            },
          },

          dstintf: { terms: { field: "data.dstintf", size: 1 } },
          dstport: { terms: { field: "data.dstport", size: 1 } },
          devname: { terms: { field: "data.devname", size: 1 } },
          pais_destino: { terms: { field: "data.dstcountry", size: 1 } },

          location: {
            top_hits: {
              size: 1,
              _source: [
                "GeoLocation.city_name",
                "GeoLocation.region_name",
                "GeoLocation.location",
              ],
            },
          },

          severidade: {
            range: {
              field: "rule.level",
              ranges: [
                { from: 0, to: 6, key: "Baixo" },
                { from: 7, to: 11, key: "Médio" },
                { from: 12, to: 14, key: "Alto" },
                { from: 15, key: "Crítico" },
              ],
            },
          },
        },
      },
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-archives-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  const aggs = response.data.aggregations ?? {};
  const origemBuckets = aggs.top_countries?.buckets ?? [];
  const destinoBuckets = aggs.top_destinos?.buckets ?? [];

  return [
    /* =========================
       ORIGENS
    ========================= */
    ...origemBuckets.map((b) => ({
      tipo: "origem",
      pais: b.key,
      total: b.doc_count,
      city: null,
      region: null,
      lat: null,
      lng: null,
      severidades: (b.severidade?.buckets ?? []).map((s) => ({
        key: s.key,
        doc_count: s.doc_count,
      })),
    })),

    /* =========================
       DESTINOS
    ========================= */
    ...destinoBuckets.map((b) => {
      const loc =
        b.location?.hits?.hits?.[0]?._source?.GeoLocation?.location ?? null;

      const ruleHit =
        b.rule_info?.hits?.hits?.[0]?._source?.rule ?? null;

      return {
        tipo: "destino",
        destino: b.key,
        total: b.doc_count,

        agente: b.agentes?.buckets?.[0]?.key || null,

        pais: isPrivateIp(b.key)
          ? "Interno"
          : b.pais_destino?.buckets?.[0]?.key || null,

        city:
          b.location?.hits?.hits?.[0]?._source?.GeoLocation?.city_name ?? null,
        region:
          b.location?.hits?.hits?.[0]?._source?.GeoLocation?.region_name ?? null,

        lat: loc?.lat ?? null,
        lng: loc?.lon ?? null,

        dstintf: b.dstintf?.buckets?.[0]?.key || null,
        dstport: b.dstport?.buckets?.[0]?.key || null,
        devname: b.devname?.buckets?.[0]?.key || null,

        rule: ruleHit
          ? {
              description: ruleHit.description ?? null,
              mitre: {
                technique: ruleHit.mitre?.technique ?? null,
              },
            }
          : null,

        severidades: (b.severidade?.buckets ?? []).map((s) => ({
          key: s.key,
          doc_count: s.doc_count,
        })),

        origens: (b.origens?.buckets ?? []).map((o) => {
          const locO =
            o.location?.hits?.hits?.[0]?._source?.GeoLocation?.location ?? null;

          return {
            ip: o.key,
            total: o.doc_count,
            pais: isPrivateIp(o.key)
              ? "Interno"
              : o.pais_origem?.buckets?.[0]?.key || null,
            lat: locO?.lat ?? null,
            lng: locO?.lon ?? null,
            srcport: o.srcport?.buckets?.[0]?.key || null,
            servico: o.servico?.buckets?.[0]?.key || null,
            interface: o.interface?.buckets?.[0]?.key || null,
          };
        }),
      };
    }),
  ];
}