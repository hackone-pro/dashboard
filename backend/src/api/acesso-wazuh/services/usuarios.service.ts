import axios from "axios";
import https from "https";
import { authHeader, customerFilter } from "./acesso-wazuh";
import type { TopUserItem } from "./acesso-wazuh";

export async function buscarTopUsers(
  tenant: any,
  opts?: {
    from?: string;
    to?: string;
    dias?: string;
  }
): Promise<TopUserItem[]> {

  const clientName = tenant.wazuh_client_name;

  if (!clientName) {
    throw new Error("Tenant sem wazuh_client_name definido");
  }

  const managerName = `manager-${clientName}`;

  const { from, to, dias = "todos" } = opts ?? {};

  // ----------------------------------
  // FILTRO DE TEMPO
  // ----------------------------------
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

  const body = {
    size: 0,

    query: {
      bool: {
        filter: [
          timeFilter,
          { match_phrase: { "rule.groups": "syscheck" } },
        ],

        should: [
          { match_phrase: { "manager.name": managerName } },
          { match_phrase: { customer: clientName } },
        ],

        minimum_should_match: 1,

        must_not: [
          { term: { "agent.name": "wazuhhackone" } },
        ],
      },
    },

    aggs: {
      top_users: {
        terms: {
          field: "syscheck.uname_after",
          size: 5,
        },
        aggs: {
          top_agents: {
            terms: {
              field: "agent.id",
              size: 5,
            },
            aggs: {
              agent_name: {
                terms: {
                  field: "agent.name",
                  size: 1,
                },
              },
            },
          },
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

  const buckets = response.data?.aggregations?.top_users?.buckets ?? [];

  const results: TopUserItem[] = [];

  for (const u of buckets) {
    for (const a of u.top_agents.buckets ?? []) {
      results.push({
        user: String(u.key ?? "Desconhecido"),
        agent_id: String(a.key ?? "-"),
        agent_name: String(
          a.agent_name?.buckets?.[0]?.key ?? "Desconhecido"
        ),
        count: Number(a.doc_count ?? 0),
      });
    }
  }

  return results;
}