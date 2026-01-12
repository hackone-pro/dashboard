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
   OVERTIME (MODIFIED / ADDED / DELETED)
====================================================== */

export async function buscarEventosOvertime(
  tenant: any,
  opts?: {
    from?: string;
    to?: string;
    dias?: string;
  }
): Promise<OvertimeResponse> {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) {
    throw new Error("Tenant sem wazuh_client_name definido");
  }

  const { from, to } = opts ?? {};

  // ============================================================
  // TIME FILTER ABSOLUTO (from / to)
  // ============================================================
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
      : null;

  // ============================================================
  // 🔥 QUERY ÚNICA PADRÃO
  // ============================================================
  const body = {
    size: 0,
    query: {
      bool: {
        filter: [
          customerFilter(clientName),
          { match_phrase: { "rule.groups": "syscheck" } },
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
          time_zone: "-03:00",
          extended_bounds: {
            min: from,
            max: to,
          },
        },
        aggs: {
          acoes: {
            terms: { field: "syscheck.event" }
          }
        }
      }
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  const buckets = response.data?.aggregations?.por_dia?.buckets ?? [];

  // ============================================================
  // 🔥 LABELS (dd/MM)
  // ============================================================
  const labels = buckets.map((b: any) => {
    const d = new Date(b.key_as_string);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  });

  // ============================================================
  // 🔥 DATASETS
  // ============================================================
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
        bucket.acoes?.buckets?.find(
          (a: any) => a.key === tipo.key
        )?.doc_count ?? 0;

      ds.data.push(value);
    }
  }

  return { labels, datasets };
}


/* ======================================================
   2) SUMMARY (30 MIN POR INTERVALO)
====================================================== */
export async function buscarEventosSummary(
  tenant,
  opts?: { from?: string; to?: string; dias?: string }
) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const { from, to, dias = "todos" } = opts ?? {};

  const timeFilter =
    from && to
      ? {
        range: {
          "@timestamp": { gte: from, lte: to },
        },
      }
      : dias === "todos"
        ? { match_all: {} }
        : {
          range: {
            "@timestamp": { gte: `now-${dias}d`, lte: "now" },
          },
        };

  const body = {
    size: 0,
    query: {
      bool: {
        must: [
          timeFilter,
          { match_phrase: { customer: clientName } },
        ],
        filter: [
          { match_phrase: { "rule.groups": "syscheck" } },
        ],
        must_not: [
          { term: { "agent.name": "wazuhhackone" } },
        ],
      },
    },
    aggs: {
      por_intervalo: {
        date_histogram: {
          field: "@timestamp",
          fixed_interval: "30m",
          time_zone: "America/Sao_Paulo",
          min_doc_count: 0,
        },
      },
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  const buckets = response.data?.aggregations?.por_intervalo?.buckets ?? [];

  return {
    labels: buckets.map((b) =>
      new Date(b.key_as_string).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    ),
    values: buckets.map((b) => b.doc_count ?? 0),
  };
}

/* ======================================================
   3) RULE DISTRIBUTION (TOP 5 REGRAS)
====================================================== */
export async function buscarRuleDistribution(
  tenant: any,
  opts?: {
    from?: string;
    to?: string;
    dias?: string;
  }
) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) {
    throw new Error("Tenant sem client_name definido");
  }

  const { from, to, dias = "todos" } = opts ?? {};

  // 🔥 PRIORIDADE TOTAL PARA FROM / TO
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
        must: [
          timeFilter,
          { match_phrase: { customer: clientName } },
          { match_phrase: { "rule.groups": "syscheck" } },
        ],
        must_not: [
          { match_phrase: { "agent.name": "wazuhhackone" } },
        ],
      },
    },
    aggs: {
      rules: {
        terms: {
          field: "rule.description",
          size: 10,
          order: { _count: "desc" },
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
