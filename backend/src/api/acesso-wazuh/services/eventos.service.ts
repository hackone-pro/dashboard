/* ======================================================
   EVENTOS — SERVICE COMPLETO PADRONIZADO
====================================================== */

import { http } from "../services/utils/http";
import { authHeader } from "../services/utils/auth";

// customerFilter já existe no mesmo arquivo acesso-wazuh.ts
import { customerFilter } from "./acesso-wazuh";

// Tipos devem vir do mesmo arquivo que já contém eles:
import type {
  OvertimeResponse,
  EventosSummaryResponse,
  RuleDistributionItem,
} from "./acesso-wazuh";


/* ======================================================
   1) OVERTIME (MODIFIED / ADDED / DELETED)
====================================================== */
export async function buscarEventosOvertime(
  tenant: any,
  opts?: { dias?: string }
): Promise<OvertimeResponse> {

  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const dias = opts?.dias ?? "todos";

  const timeFilter =
    dias !== "todos"
      ? { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } }
      : null;

  const body = {
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
      por_dia: {
        date_histogram: {
          field: "@timestamp",
          fixed_interval: "1d",
          min_doc_count: 0,
        },
        aggs: {
          acoes: {
            terms: { field: "syscheck.event" },
          },
        },
      },
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  const buckets = response.data?.aggregations?.por_dia?.buckets ?? [];

  // labels dd/MM
  const labels = buckets.map((b: any) => {
    const d = new Date(b.key_as_string);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  });

  const tipos = [
    { key: "modified", label: "Modificado" },
    { key: "added", label: "Adicionado" },
    { key: "deleted", label: "Deletado" },
  ];

  const datasets = tipos.map((t) => ({
    name: t.label,
    data: [] as number[],
  }));

  for (const bucket of buckets) {
    for (const tipo of tipos) {
      const ds = datasets.find((d) => d.name === tipo.label)!;
      const value =
        bucket.acoes?.buckets?.find((a: any) => a.key === tipo.key)?.doc_count ??
        0;

      ds.data.push(value);
    }
  }

  return { labels, datasets };
}



/* ======================================================
   2) SUMMARY (30 MIN POR INTERVALO)
====================================================== */
export async function buscarEventosSummary(
  tenant: any,
  opts?: { dias?: string }
): Promise<EventosSummaryResponse> {

  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const dias = opts?.dias ?? "todos";

  const timeFilter =
    dias !== "todos"
      ? {
          range: {
            "@timestamp": { gte: `now-${dias}d`, lte: "now" },
          },
        }
      : null;

  const body = {
    size: 0,
    query: {
      bool: {
        must: [
          { match_phrase: { "manager.name": "wazuhhackone" } },
          { match_phrase: { "rule.groups": "syscheck" } },
          { match_phrase: { customer: clientName } },
          ...(timeFilter ? [timeFilter] : []),
        ],
      },
    },
    aggs: {
      por_dia: {
        date_histogram: {
          field: "timestamp",
          fixed_interval: "30m",
          time_zone: "America/Sao_Paulo",
          min_doc_count: 1,
        },
      },
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  const buckets = response.data?.aggregations?.por_dia?.buckets ?? [];

  const labels = buckets.map((b: any) => {
    const d = new Date(b.key_as_string);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  const values = buckets.map((b: any) => Number(b.doc_count ?? 0));

  return { labels, values };
}



/* ======================================================
   3) RULE DISTRIBUTION (TOP 5 REGRAS)
====================================================== */
export async function buscarRuleDistribution(
  tenant: any,
  opts?: { dias?: string }
): Promise<RuleDistributionItem[]> {

  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const dias = opts?.dias ?? "todos";

  const timeFilter =
    dias !== "todos"
      ? {
          range: {
            "@timestamp": { gte: `now-${dias}d`, lte: "now" },
          },
        }
      : null;

  const body = {
    size: 0,
    query: {
      bool: {
        must: [
          { match_phrase: { "manager.name": "wazuhhackone" } },
          { match_phrase: { "rule.groups": "syscheck" } },
          { match_phrase: { customer: clientName } },
          ...(timeFilter ? [timeFilter] : []),
        ],
      },
    },
    aggs: {
      rules: {
        terms: {
          field: "rule.description",
          order: { _count: "desc" },
          size: 5,
        },
      },
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  return (response.data?.aggregations?.rules?.buckets ?? []).map((b: any) => ({
    rule: String(b.key ?? "Desconhecido"),
    count: Number(b.doc_count ?? 0),
  }));
}

