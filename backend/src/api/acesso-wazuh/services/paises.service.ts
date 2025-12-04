import { http } from "./utils/http";
import { authHeader } from "./utils/auth";
import { isPrivateIp } from "./utils/ip";

/* ===============================================
   TOP PAÍSES DE ATAQUES (ORIGEM + DESTINO)
=============================================== */
export async function buscarTopPaisesAtaque(tenant, dias: string) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const timeFilter =
    dias === "todos"
      ? { match_all: {} }
      : { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } };

  const body = {
    size: 0,
    query: {
      bool: {
        must: [
          {
            bool: {
              should: [
                { term: { "data.customer": clientName } },
                { term: { "customer": clientName } },
                { term: { "fields.customer": clientName } },
              ],
              minimum_should_match: 1,
            },
          },
          timeFilter,
          {
            bool: {
              should: [
                { term: { "rule.groups": "fortigate" } },
                { term: { "rule.groups": "fortianalyzer-like" } },
                { term: { "decoder.name": "fortianalyzer-like" } },
              ],
              minimum_should_match: 1,
            },
          },
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
        terms: {
          field: "GeoLocation.country_name",
          size: 10,
          order: { _count: "desc" },
        },
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
          location: {
            top_hits: {
              size: 1,
              _source: [
                "GeoLocation.city_name",
                "GeoLocation.country_name",
                "GeoLocation.region_name",
                "GeoLocation.location",
              ],
            },
          },
        },
      },

      top_destinos: {
        terms: {
          field: "data.dstip",
          size: 10,
          order: { _count: "desc" },
        },
        aggs: {
          agentes: { terms: { field: "agent.name", size: 1 } },

          origens: {
            terms: { field: "data.srcip", size: 10 },
            aggs: {
              pais_origem: { terms: { field: "data.srccountry", size: 1 } },
              srcport: { terms: { field: "data.srcport", size: 1 } },
              servico: { terms: { field: "data.app", size: 1 } },
              interface: { terms: { field: "data.srcintf", size: 1 } },

              location: {
                top_hits: {
                  size: 1,
                  _source: [
                    "GeoLocation.city_name",
                    "GeoLocation.country_name",
                    "GeoLocation.region_name",
                    "GeoLocation.location",
                  ],
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
                "GeoLocation.country_name",
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

  // ===============================
  // REQUISIÇÃO WAZUH INDEXER
  // ===============================
  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  // ===============================
  // PROCESSAMENTO DO RETORNO
  // ===============================
  const aggs = response.data.aggregations ?? {};
  const origemBuckets = aggs.top_countries?.buckets ?? [];
  const destinoBuckets = aggs.top_destinos?.buckets ?? [];

  return [
    /* =====================================
         ORIGENS (Países de ataque)
    ===================================== */
    ...origemBuckets.map((b) => {
      const loc =
        b.location?.hits?.hits?.[0]?._source?.GeoLocation?.location ?? null;

      return {
        tipo: "origem",
        pais: b.key,
        total: b.doc_count,

        city:
          b.location?.hits?.hits?.[0]?._source?.GeoLocation?.city_name ?? null,
        region:
          b.location?.hits?.hits?.[0]?._source?.GeoLocation?.region_name ?? null,
        lat: loc?.lat ?? null,
        lng: loc?.lon ?? null,

        severidades: (b.severidade?.buckets ?? []).map((s) => ({
          key: s.key,
          doc_count: s.doc_count,
        })),
      };
    }),

    /* =====================================
         DESTINOS (IPs atacados)
    ===================================== */
    ...destinoBuckets.map((b) => {
      const loc =
        b.location?.hits?.hits?.[0]?._source?.GeoLocation?.location ?? null;

      const ip = b.key;

      return {
        tipo: "destino",
        destino: ip,
        total: b.doc_count,

        agente: b.agentes?.buckets?.[0]?.key || null,
        pais: isPrivateIp(ip)
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

        severidades: (b.severidade?.buckets ?? []).map((s) => ({
          key: s.key,
          doc_count: s.doc_count,
        })),

        origens: (b.origens?.buckets ?? []).map((o) => {
          const locO =
            o.location?.hits?.hits?.[0]?._source?.GeoLocation?.location ?? null;

          const ipOrigem = o.key;

          return {
            ip: ipOrigem,
            total: o.doc_count,

            pais: isPrivateIp(ipOrigem)
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
