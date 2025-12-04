/* ======================================================
   VULNERABILIDADES — SERVICE COMPLETO PADRONIZADO
====================================================== */

import { http } from "./utils/http";
import { authHeader } from "./utils/auth";

import {
  TopVulnItem,
  TopOSItem,
  TopAgentItem,
  TopPackageItem,
  TopScoreItem,
  VulnAnoItem,
} from "../../acesso-wazuh/services/types"; // ou onde ficam os tipos
//------------------------------------------------------------

// ======================================================
//  UNIVERSAL CUSTOMER FILTER — USADO SOMENTE NESTE ARQUIVO
// ======================================================
function customerFilterUniversal(clientName: string) {
  return {
    bool: {
      should: [
        { term: { "customer": clientName } },
        { term: { "customer.keyword": clientName } },

        { term: { "data.customer": clientName } },
        { term: { "data.customer.keyword": clientName } },

        { term: { "fields.customer": clientName } },
        { term: { "fields.customer.keyword": clientName } },
      ],
      minimum_should_match: 1,
    },
  };
}


/* ======================================================
   1) RESUMO DE SEVERIDADES DE VULNERABILIDADES
====================================================== */
export async function buscarVulnSeveridades(tenant: any) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const body = {
    size: 0,
    query: {
      bool: {
        filter: [
          { match_all: {} },
          customerFilterUniversal(clientName)
        ],
      },
    },
    aggs: {
      severity: {
        filters: {
          filters: {
            Pending: {
              bool: {
                filter: [
                  { term: { "vulnerability.under_evaluation": true } }
                ]
              }
            },
            Critical: {
              bool: {
                filter: [
                  { match_phrase: { "vulnerability.severity": "Critical" } }
                ]
              }
            },
            High: {
              bool: {
                filter: [
                  { match_phrase: { "vulnerability.severity": "High" } }
                ]
              }
            },
            Medium: {
              bool: {
                filter: [
                  { match_phrase: { "vulnerability.severity": "Medium" } }
                ]
              }
            },
            Low: {
              bool: {
                filter: [
                  { match_phrase: { "vulnerability.severity": "Low" } }
                ]
              }
            }
          }
        }
      },
      total: { filter: { exists: { field: "vulnerability" } } }
    }
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-states-vulnerabilities-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  const aggs = response.data?.aggregations ?? {};

  return {
    Pending: aggs?.severity?.buckets?.Pending?.doc_count ?? 0,
    Critical: aggs?.severity?.buckets?.Critical?.doc_count ?? 0,
    High: aggs?.severity?.buckets?.High?.doc_count ?? 0,
    Medium: aggs?.severity?.buckets?.Medium?.doc_count ?? 0,
    Low: aggs?.severity?.buckets?.Low?.doc_count ?? 0,
    Total: aggs?.total?.doc_count ?? 0,
  };
}


/* ======================================================
   2) TOP VULNERABILIDADES (CVE, PACKAGE, AGENT)
====================================================== */
export async function buscarTopVulnerabilidades(
  tenant: any,
  opts?: { by?: "cve" | "package" | "agent"; size?: number; dias?: string }
): Promise<TopVulnItem[]> {

  const clientName = tenant.wazuh_client_name;
  const by = opts?.by ?? "cve";
  const size = Number(opts?.size ?? 5);
  const dias = opts?.dias ?? "todos";

  const field =
    by === "package" ? "package.name" :
      by === "agent" ? "agent.name" :
        "vulnerability.id";

  const timeFilter =
    dias !== "todos"
      ? { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } }
      : { match_all: {} };

  const body = {
    size: 0,
    docvalue_fields: [
      { field: "package.installed", format: "date_time" },
      { field: "vulnerability.detected_at", format: "date_time" },
      { field: "vulnerability.published_at", format: "date_time" },
    ],
    query: {
      bool: {
        filter: [
          timeFilter,
          customerFilterUniversal(clientName)
        ],
      },
    },
    aggs: {
      top_vulns: {
        terms: { field, size, order: { _count: "desc" } },
        aggs: {
          por_severidade: {
            terms: { field: "vulnerability.severity" },
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

  return (response.data?.aggregations?.top_vulns?.buckets ?? []).map((b: any) => {
    const sev: Record<string, number> = {};

    for (const s of b?.por_severidade?.buckets ?? []) {
      sev[s.key] = Number(s.doc_count || 0);
    }

    return {
      key: String(b.key ?? ""),
      total: Number(b.doc_count ?? 0),
      severity: sev,
    };
  });
}



/* ======================================================
   3) TOP VULNERABILIDADES POR SISTEMA OPERACIONAL
====================================================== */
export async function buscarTopOSVulnerabilidades(
  tenant: any,
  opts?: { size?: number; dias?: string }
): Promise<TopOSItem[]> {

  const clientName = tenant.wazuh_client_name;
  const size = Number(opts?.size ?? 5);
  const dias = opts?.dias ?? "todos";

  const timeFilter =
    dias !== "todos"
      ? { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } }
      : { match_all: {} };

  const body = {
    size: 0,
    docvalue_fields: [
      { field: "package.installed", format: "date_time" },
      { field: "vulnerability.detected_at", format: "date_time" },
      { field: "vulnerability.published_at", format: "date_time" },
    ],
    query: {
      bool: { filter: [timeFilter, { match_phrase: { customer: clientName } }] },
    },
    aggs: {
      top_os: {
        terms: { field: "host.os.full", size, order: { _count: "desc" } },
        aggs: { por_severidade: { terms: { field: "vulnerability.severity" } } },
      },
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  return (response.data?.aggregations?.top_os?.buckets ?? []).map((b: any) => {
    const sev: Record<string, number> = {};
    for (const s of b?.por_severidade?.buckets ?? []) {
      sev[s.key] = s.doc_count || 0;
    }

    return {
      os: String(b.key ?? "Desconhecido"),
      total: b.doc_count ?? 0,
      severity: sev,
    };
  });
}



/* ======================================================
   4) TOP AGENTES COM MAIS VULNERABILIDADES
====================================================== */
export async function buscarTopAgentesVulnerabilidades(
  tenant: any,
  opts?: { size?: number; dias?: string }
): Promise<TopAgentItem[]> {

  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const size = Number(opts?.size ?? 5);
  const dias = opts?.dias ?? "todos";

  const timeFilter =
    dias !== "todos"
      ? { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } }
      : { match_all: {} };

  // 🔥 Detecta tenant Equatorial
  const isEquatorial =
    clientName.toLowerCase().includes("equatorial") ||
    tenant.customer?.toLowerCase().includes("equatorial");

  // 🔥 Filtros finais:
  //    Equatorial → SEM customer
  //    Outros clientes → COM customerFilterUniversal
  const customerFilterFinal = isEquatorial
    ? null
    : customerFilterUniversal(clientName);

  const body: any = {
    size: 0,
    docvalue_fields: [
      { field: "package.installed", format: "date_time" },
      { field: "vulnerability.detected_at", format: "date_time" },
      { field: "vulnerability.published_at", format: "date_time" },
    ],
    query: {
      bool: {
        filter: [
          timeFilter,
          ...(customerFilterFinal ? [customerFilterFinal] : []),
        ],
      },
    },
    aggs: {
      top_agents: {
        terms: {
          field: "agent.name",
          size,
          order: { _count: "desc" },
          missing: "N/A",
        },
        aggs: {
          por_severidade: { terms: { field: "vulnerability.severity" } },
        },
      },
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  return (response.data?.aggregations?.top_agents?.buckets ?? []).map((b: any) => {
    const sev: Record<string, number> = {};
    for (const s of b?.por_severidade?.buckets ?? []) {
      sev[s.key] = Number(s.doc_count || 0);
    }

    return {
      agent: String(b.key ?? "Desconhecido"),
      total: Number(b.doc_count ?? 0),
      severity: sev,
    };
  });
}


/* ======================================================
   5) TOP PACKAGES COM MAIS VULNERABILIDADES
====================================================== */
export async function buscarTopPackagesVulnerabilidades(
  tenant: any,
  opts?: { size?: number; dias?: string }
): Promise<TopPackageItem[]> {

  const clientName = tenant.wazuh_client_name;
  const size = Number(opts?.size ?? 5);
  const dias = opts?.dias ?? "todos";

  const isEquatorial =
    clientName.toLowerCase().includes("equatorial") ||
    tenant.customer?.toLowerCase().includes("equatorial");

  const timeFilter =
    dias !== "todos"
      ? { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } }
      : { match_all: {} };

  const customerFilter = isEquatorial
    ? null
    : customerFilterUniversal(clientName);

  const body: any = {
    size: 0,
    docvalue_fields: [
      { field: "package.installed", format: "date_time" },
      { field: "vulnerability.detected_at", format: "date_time" },
      { field: "vulnerability.published_at", format: "date_time" },
    ],
    query: {
      bool: {
        filter: [
          timeFilter,
          // { match_phrase: { "wazuh.cluster.name": { query: "wazuhhackone" } } },
          ...(customerFilter ? [customerFilter] : [])
        ],
      },
    },
    aggs: {
      top_packages: {
        terms: {
          field: "package.name",
          size,
          order: { _count: "desc" },
          missing: "N/A",
        },
        aggs: {
          por_severidade: { terms: { field: "vulnerability.severity" } },
        },
      },
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  return (response.data?.aggregations?.top_packages?.buckets ?? []).map((b: any) => {
    const severity: Record<string, number> = {};

    for (const s of b?.por_severidade?.buckets ?? []) {
      severity[s.key] = Number(s.doc_count || 0);
    }

    return {
      package: String(b.key ?? "Desconhecido"),
      total: Number(b.doc_count ?? 0),
      severity,
    };
  });
}



/* ======================================================
   6) TOP SCORES (CVSS BASE SCORE)
====================================================== */
export async function buscarTopScoresVulnerabilidades(
  tenant: any,
  opts?: { size?: number; dias?: string }
): Promise<TopScoreItem[]> {

  const clientName = tenant.wazuh_client_name;
  const size = Number(opts?.size ?? 10);
  const dias = opts?.dias ?? "todos";

  const timeFilter =
    dias !== "todos"
      ? { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } }
      : { match_all: {} };

  const body = {
    size: 0,
    docvalue_fields: [
      { field: "package.installed", format: "date_time" },
      { field: "vulnerability.detected_at", format: "date_time" },
      { field: "vulnerability.published_at", format: "date_time" },
    ],
    query: {
      bool: {
        filter: [
          timeFilter,
          customerFilterUniversal(clientName)
        ],
      },
    },
    aggs: {
      top_scores: {
        terms: {
          field: "vulnerability.score.base",
          size,
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

  return (response.data?.aggregations?.top_scores?.buckets ?? []).map((b: any) => ({
    score: String(b.key ?? "Desconhecido"),
    total: Number(b.doc_count ?? 0),
  }));
}



/* ======================================================
   7) VULNERABILIDADES POR ANO (HISTÓRICO)
====================================================== */
export async function buscarVulnerabilidadesPorAno(
  tenant: any,
  opts?: { dias?: string }
): Promise<VulnAnoItem[]> {

  const clientName = tenant.wazuh_client_name;
  const dias = opts?.dias ?? "todos";

  const timeFilter =
    dias !== "todos"
      ? { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } }
      : { match_all: {} };

  const body = {
    size: 0,
    docvalue_fields: [
      { field: "package.installed", format: "date_time" },
      { field: "vulnerability.detected_at", format: "date_time" },
      { field: "vulnerability.published_at", format: "date_time" },
    ],
    query: {
      bool: {
        filter: [
          timeFilter,
          customerFilterUniversal(clientName)
        ],
      },
    },
    aggs: {
      por_ano: {
        date_histogram: {
          field: "vulnerability.published_at",
          calendar_interval: "1y",
          time_zone: "America/Sao_Paulo",
          format: "yyyy",
          min_doc_count: 1,
        },
        aggs: {
          por_severidade: {
            terms: { field: "vulnerability.severity", size: 5 },
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

  return (response.data?.aggregations?.por_ano?.buckets ?? []).map((b: any) => {
    const sev: Record<string, number> = {};
    for (const s of b?.por_severidade?.buckets ?? []) {
      sev[s.key] = Number(s.doc_count || 0);
    }

    return {
      ano: b.key_as_string ?? "Desconhecido",
      total: b.doc_count ?? 0,
      severity: sev,
    };
  });
}
