import { http } from "./utils/http";
import { authHeader } from "./utils/auth";

interface Periodo {
  from: string;
  to: string;
}

export async function buscarSeveridadeIndexer(
  tenant,
  dias?: string,
  periodo?: Periodo
) {
  const clientName = tenant.wazuh_client_name;

  // FILTRO DE TEMPO (REGRA FINAL)
  const timeFilter =
    periodo?.from && periodo?.to
      ? {
          range: {
            "@timestamp": {
              gte: periodo.from,
              lte: periodo.to,
            },
          },
        }
      : dias === "todos"
      ? { match_all: {} }
      : {
          range: {
            "@timestamp": {
              gte: `now-${dias ?? "1"}d`,
              lte: "now",
            },
          },
        };

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

  const buildBody = (usarCustomer: boolean) => ({
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
      total_eventos: {
        value_count: {
          field: "_id",
        },
      },
    },
  });

  const baseURL = `${tenant.wazuh_url}/wazuh-*/_search`;

  let response;
  let buckets = [];
  let total = 0;

  // 🔹 1ª tentativa — COM customer
  response = await http.post(baseURL, buildBody(true), {
    headers: authHeader(tenant),
  });

  buckets = response.data?.aggregations?.severidade?.buckets || [];
  total = response.data?.aggregations?.total_eventos?.value || 0;

  // 🔹 fallback — SEM customer
  if (total === 0) {
    response = await http.post(baseURL, buildBody(false), {
      headers: authHeader(tenant),
    });

    buckets = response.data?.aggregations?.severidade?.buckets || [];
    total = response.data?.aggregations?.total_eventos?.value || 0;
  }

  const get = (k: string) =>
    buckets.find((x: any) => x.key === k)?.doc_count || 0;

  return {
    baixo: get("Low"),
    medio: get("Medium"),
    alto: get("High"),
    critico: get("Critical"),
    total,
  };
}
