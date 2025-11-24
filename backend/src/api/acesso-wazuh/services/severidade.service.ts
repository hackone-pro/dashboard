// src/api/acesso-wazuh/services/severidade.service.ts
import { http } from "./utils/http";
import { authHeader, customerFilter } from "./utils/auth";

export async function buscarSeveridadeIndexer(tenant, dias: string) {
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
        must: [customerFilter(clientName), timeFilter],
      },
    },
    aggs: {
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
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  const buckets = response.data?.aggregations?.severidade?.buckets || [];
  const get = (k: string) =>
    buckets.find((x: any) => x.key === k)?.doc_count || 0;

  return {
    baixo: get("Low"),
    medio: get("Medium"),
    alto: get("High"),
    critico: get("Critical"),
    total: buckets.reduce((acc, b) => acc + (b.doc_count || 0), 0),
  };
}
