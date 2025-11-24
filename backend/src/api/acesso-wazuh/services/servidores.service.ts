import { http } from "./utils/http";
import { authHeader } from "./utils/auth";

export async function buscarListaServidores(tenant) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const body = {
    size: 0,
    query: {
      bool: {
        must: [
          { match_phrase: { customer: clientName } }
        ]
      }
    },
    aggs: {
      agentes: {
        terms: {
          field: "agent.name",
          size: 200,
          order: { _key: "asc" }
        },
        aggs: {
          ultimo_evento: {
            top_hits: {
              size: 1,
              sort: [{ "@timestamp": { order: "desc" } }],
              _source: ["agent.ip", "@timestamp"]
            }
          }
        }
      }
    }
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  const buckets = response.data?.aggregations?.agentes?.buckets ?? [];

  return buckets.map((b) => {
    const hit = b.ultimo_evento?.hits?.hits?.[0]?._source ?? {};

    return {
      id: b.key,
      nome: b.key,
      ip: hit.agent?.ip ?? null,
      timestamp: hit["@timestamp"] ?? null
    };
  });
}
