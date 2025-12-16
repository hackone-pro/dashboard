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

  const isEquatorial =
    clientName.toLowerCase().includes("equatorial") ||
    tenant.customer?.toLowerCase().includes("equatorial");

  const timeFilter =
    dias !== "todos"
      ? { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } }
      : null;

  // ============================================================
  // 🔥 1) QUERY PARA EQUATORIAL (SEM CUSTOMER, SEM UNAME_AFTER)
  // ============================================================
  const queryEquatorial = {
    size: 0,
    query: {
      bool: {
        filter: [
          { term: { "agent.id": "000" }},                 // syscheck/manager
          { match_phrase: { "rule.groups": "syscheck" }}, // obrigatório
          ...(timeFilter ? [timeFilter] : [])
        ]
      }
    },
    aggs: {
      por_dia: {
        date_histogram: {
          field: "@timestamp",
          fixed_interval: "1d",
          min_doc_count: 0
        },
        aggs: {
          acoes: {
            terms: { field: "syscheck.event" }
          }
        }
      }
    }
  };

  // ============================================================
  // 🔥 2) QUERY PARA OUTROS CLIENTES (COM CUSTOMER FILTER)
  // ============================================================
  const queryDefault = {
    size: 0,
    query: {
      bool: {
        must: [
          customerFilter(clientName),
          ...(timeFilter ? [timeFilter] : [])
        ]
      }
    },
    aggs: {
      por_dia: {
        date_histogram: {
          field: "@timestamp",
          fixed_interval: "1d",
          min_doc_count: 0
        },
        aggs: {
          acoes: {
            terms: { field: "syscheck.event" }
          }
        }
      }
    }
  };

  // ============================================================
  // 🔥 Escolher automaticamente
  // ============================================================
  const body = isEquatorial ? queryEquatorial : queryDefault;

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  const buckets = response.data?.aggregations?.por_dia?.buckets ?? [];

  const labels = buckets.map((b: any) => {
    const d = new Date(b.key_as_string);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit"
    });
  });

  const tipos = [
    { key: "modified", label: "Modificado" },
    { key: "added", label: "Adicionado" },
    { key: "deleted", label: "Deletado" }
  ];

  const datasets = tipos.map(t => ({
    name: t.label,
    data: []
  }));

  for (const bucket of buckets) {
    for (const tipo of tipos) {
      const ds = datasets.find(d => d.name === tipo.label)!;

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

  const isEquatorial =
    clientName.toLowerCase().includes("equatorial") ||
    tenant.customer?.toLowerCase().includes("equatorial");

  const timeFilter =
    dias !== "todos"
      ? { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } }
      : null;

  // ============================================================
  // 🔥 EQUATORIAL
  // ============================================================
  const queryEquatorial = {
    size: 0,
    query: {
      bool: {
        filter: [
          { term: { "agent.id": "000" } },                       // ✔ SOMENTE EQUATORIAL
          { term: { "rule.groups": "syscheck" } },
          { term: { "manager.name": "manager" } },               // ✔ Equatorial usa manager
          ...(timeFilter ? [timeFilter] : [])
        ]
      }
    },
    aggs: {
      por_dia: {
        date_histogram: {
          field: "@timestamp",                                   // ✔ Campo do Equatorial
          fixed_interval: "30m",
          time_zone: "America/Sao_Paulo",
          min_doc_count: 1
        }
      }
    }
  };

  // ============================================================
  // 🔥 NÃO EQUATORIAL
  // ============================================================
  const queryDefault = {
    size: 0,
    query: {
      bool: {
        filter: [
          { term: { "rule.groups": "syscheck" } },
          { term: { "customer": clientName } },                  // ✔ Customer correto
          ...(timeFilter ? [timeFilter] : [])
        ]
      }
    },
    aggs: {
      por_dia: {
        date_histogram: {
          field: "timestamp",                                    // ✔ Campo dos outros clientes
          fixed_interval: "30m",
          time_zone: "America/Sao_Paulo",
          min_doc_count: 1
        }
      }
    }
  };

  const body = isEquatorial ? queryEquatorial : queryDefault;

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
      minute: "2-digit"
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

  // Detectar Equatorial pela estratégia já usada
  const isEquatorial =
    clientName.toLowerCase().includes("equatorial") ||
    tenant.customer?.toLowerCase().includes("equatorial");

  // Filtro por datas
  const timeFilter =
    dias !== "todos"
      ? {
          range: {
            "@timestamp": { gte: `now-${dias}d`, lte: "now" }
          }
        }
      : null;

  // Campo correto para agregação
  // ✔ PARA TODOS OS CLIENTES => rule.description
  const ruleField = "rule.description";

  // -------------------------------
  // 🔥 Query EQUATORIAL
  // -------------------------------
  const queryEquatorial = {
    size: 0,
    query: {
      bool: {
        must: [
          { term: { "rule.groups": "syscheck" } },
          { term: { "agent.id": "000" } },   // ✔ SOMENTE EQUATORIAL
          ...(timeFilter ? [timeFilter] : [])
        ]
      }
    },
    aggs: {
      rules: {
        terms: {
          field: ruleField, // SEM keyword
          size: 10,
          order: { "_count": "desc" }
        }
      }
    }
  };

  // -------------------------------
  // 🔥 Query NÃO EQUATORIAL
  // -------------------------------
  const queryDefault = {
    size: 0,
    query: {
      bool: {
        must: [
          { term: { "rule.groups": "syscheck" } },
          // ❌ NADA de agent.id aqui
          ...(timeFilter ? [timeFilter] : [])
        ]
      }
    },
    aggs: {
      rules: {
        terms: {
          field: ruleField, // SEM keyword (único que funcionou)
          size: 10,
          order: { "_count": "desc" }
        }
      }
    }
  };

  // Selecionar automaticamente
  const body = isEquatorial ? queryEquatorial : queryDefault;

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  return (response.data?.aggregations?.rules?.buckets ?? []).map((b: any) => ({
    rule: String(b.key ?? "Desconhecido"),
    count: Number(b.doc_count ?? 0)
  }));
}
