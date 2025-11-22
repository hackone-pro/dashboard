import axios from "axios";
import https from "https";
import { authHeader, customerFilter } from "./acesso-wazuh"; 
import { TopUserItem } from "../services/acesso-wazuh";


export async function buscarTopUsers(
    tenant: any,
    opts?: { dias?: string }
  ): Promise<TopUserItem[]> {
    const clientName = tenant.wazuh_client_name;
    if (!clientName) throw new Error("Tenant sem client_name definido");
  
    const dias = opts?.dias ?? "todos";
  
    const timeFilter =
      dias !== "todos"
        ? { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } }
        : null;
  
    const body: any = {
      size: 0,
      query: {
        bool: {
          must: [
            customerFilter(clientName),
            ...(timeFilter ? [timeFilter] : []),
          ],
        },
      },
      aggs: {
        top_users: {
          terms: { field: "syscheck.uname_after", size: 5 },
          aggs: {
            top_agents: {
              terms: { field: "agent.id", size: 5 },
              aggs: {
                agent_name: {
                  terms: { field: "agent.name", size: 1 },
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
      for (const a of u.top_agents.buckets) {
        const agentName = a.agent_name.buckets?.[0]?.key ?? "Desconhecido";
        results.push({
          user: u.key ?? "Desconhecido",
          agent_id: a.key ?? "-",
          agent_name: agentName,
          count: Number(a.doc_count ?? 0),
        });
      }
    }
  
    return results;
  }
  