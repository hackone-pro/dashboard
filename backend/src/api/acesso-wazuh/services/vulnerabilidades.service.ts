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
export async function buscarVulnSeveridades(
  tenant: any,
  opts?: { dias?: string; agent?: string }
) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const dias = opts?.dias ?? "todos";
  const agent = opts?.agent;

  /* ============================
     CLUSTER
  ============================ */
  let clusterName = tenant.wazuh_cluster_name;

  if (clusterName && !clusterName.startsWith("manager-")) {
    clusterName = `manager-${clusterName}`;
  }

  /* ============================
     FILTRO DE TEMPO
  ============================ */
  const timeFilter =
    dias !== "todos"
      ? {
        range: {
          "@timestamp": {
            gte: `now-${dias}`,
            lte: "now",
          },
        },
      }
      : null;

  /* ============================
     FILTROS BASE
  ============================ */
  const filtros: any[] = [];

  if (timeFilter) filtros.push(timeFilter);

  if (clusterName) {
    filtros.push({
      match_phrase: {
        "wazuh.cluster.name": {
          query: clusterName,
        },
      },
    });
  }

  if (agent) {
    filtros.push({
      match_phrase: {
        "agent.name": {
          query: agent,
        },
      },
    });
  }

  const body = {
    size: 0,

    stored_fields: ["*"],

    script_fields: {},

    docvalue_fields: [
      { field: "package.installed", format: "date_time" },
      { field: "vulnerability.detected_at", format: "date_time" },
      { field: "vulnerability.published_at", format: "date_time" },
    ],

    _source: { excludes: [] },

    query: {
      bool: {
        must: [],
        filter: filtros,
        should: [],
        must_not: [],
      },
    },

    aggs: {
      severity: {
        filters: {
          filters: {
            Pending: {
              bool: {
                must: [],
                filter: [
                  {
                    term: {
                      "vulnerability.under_evaluation": true,
                    },
                  },
                ],
                should: [],
                must_not: [],
              },
            },

            Critical: {
              bool: {
                must: [],
                filter: [
                  {
                    bool: {
                      should: [
                        {
                          match_phrase: {
                            "vulnerability.severity": "Critical",
                          },
                        },
                      ],
                      minimum_should_match: 1,
                    },
                  },
                ],
                should: [],
                must_not: [],
              },
            },

            High: {
              bool: {
                must: [],
                filter: [
                  {
                    bool: {
                      should: [
                        {
                          match_phrase: {
                            "vulnerability.severity": "High",
                          },
                        },
                      ],
                      minimum_should_match: 1,
                    },
                  },
                ],
                should: [],
                must_not: [],
              },
            },

            Medium: {
              bool: {
                must: [],
                filter: [
                  {
                    bool: {
                      should: [
                        {
                          match_phrase: {
                            "vulnerability.severity": "Medium",
                          },
                        },
                      ],
                      minimum_should_match: 1,
                    },
                  },
                ],
                should: [],
                must_not: [],
              },
            },

            Low: {
              bool: {
                must: [],
                filter: [
                  {
                    bool: {
                      should: [
                        {
                          match_phrase: {
                            "vulnerability.severity": "Low",
                          },
                        },
                      ],
                      minimum_should_match: 1,
                    },
                  },
                ],
                should: [],
                must_not: [],
              },
            },
          },
        },
      },

      total: {
        filter: {
          exists: {
            field: "vulnerability",
          },
        },
      },
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-states-vulnerabilities-*/_search?filter_path=aggregations.*`,
    body,
    { headers: authHeader(tenant) }
  );

  const buckets = response.data?.aggregations?.severity?.buckets ?? {};
  const total = response.data?.aggregations?.total?.doc_count ?? 0;

  return {
    Pending: buckets.Pending?.doc_count ?? 0,
    Critical: buckets.Critical?.doc_count ?? 0,
    High: buckets.High?.doc_count ?? 0,
    Medium: buckets.Medium?.doc_count ?? 0,
    Low: buckets.Low?.doc_count ?? 0,
    Total: total,
  };
}


/* ======================================================
   2) TOP VULNERABILIDADES (CVE, PACKAGE, AGENT)
====================================================== */
export async function buscarTopVulnerabilidades(
  tenant: any,
  opts?: {
    by?: "cve" | "package" | "agent";
    size?: number;
    dias?: string;
    agent?: string;
  }
): Promise<TopVulnItem[]> {

  const by = opts?.by ?? "cve";
  const size = Number(opts?.size ?? 5);
  const dias = opts?.dias ?? "todos";

  /* ============================
     CLUSTER
  ============================ */
  let clusterName = tenant.wazuh_cluster_name;

  if (clusterName && !clusterName.startsWith("manager-")) {
    clusterName = `manager-${clusterName}`;
  }

  /* ============================
     FIELD DA AGREGAÇÃO
  ============================ */
  const field =
    by === "package"
      ? "package.name"
      : by === "agent"
        ? "agent.name"
        : "vulnerability.id";

  /* ============================
     FILTRO DE TEMPO
  ============================ */
  const timeFilter =
    dias !== "todos"
      ? {
        range: {
          "@timestamp": {
            gte: `now-${dias}d`,
            lte: "now",
          },
        },
      }
      : null;

  /* ============================
     FILTROS
  ============================ */
  const filtros: any[] = [];

  if (timeFilter) filtros.push(timeFilter);

  if (clusterName) {
    filtros.push({
      match_phrase: {
        "wazuh.cluster.name": {
          query: clusterName,
        },
      },
    });
  }

  if (opts?.agent) {
    filtros.push({
      match_phrase: {
        "agent.name": {
          query: opts.agent,
        },
      },
    });
  }

  const body = {
    size: 0,

    docvalue_fields: [
      { field: "package.installed", format: "date_time" },
      { field: "vulnerability.detected_at", format: "date_time" },
      { field: "vulnerability.published_at", format: "date_time" },
    ],

    query: {
      bool: {
        must: [],
        filter: filtros,
        should: [],
        must_not: [],
      },
    },

    aggs: {
      top_vulns: {
        terms: {
          field,
          size,
          order: { _count: "desc" },
        },
        aggs: {
          por_severidade: {
            terms: {
              field: "vulnerability.severity",
            },
          },
        },
      },
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-states-vulnerabilities-*/_search`,
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
  opts?: { size?: number; dias?: string; agent?: string }
): Promise<TopOSItem[]> {

  const size = Number(opts?.size ?? 5);
  const dias = opts?.dias ?? "todos";

  /* ============================
     CLUSTER
  ============================ */
  let clusterName = tenant.wazuh_cluster_name;

  if (clusterName && !clusterName.startsWith("manager-")) {
    clusterName = `manager-${clusterName}`;
  }

  /* ============================
     FILTRO DE TEMPO
  ============================ */
  const timeFilter =
    dias !== "todos"
      ? {
        range: {
          "@timestamp": {
            gte: `now-${dias}d`,
            lte: "now",
          },
        },
      }
      : null;

  /* ============================
     FILTROS
  ============================ */
  const filtros: any[] = [];

  if (timeFilter) filtros.push(timeFilter);

  if (clusterName) {
    filtros.push({
      match_phrase: {
        "wazuh.cluster.name": {
          query: clusterName,
        },
      },
    });
  }

  if (opts?.agent) {
    filtros.push({
      match_phrase: {
        "agent.name": {
          query: opts.agent,
        },
      },
    });
  }

  const body = {
    size: 0,

    query: {
      bool: {
        must: [],
        filter: filtros,
        should: [],
        must_not: [],
      },
    },

    aggs: {
      top_os: {
        terms: {
          field: "host.os.full",
          size,
          order: { _count: "desc" },
        },
        aggs: {
          por_severidade: {
            terms: {
              field: "vulnerability.severity",
            },
          },
        },
      },
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-states-vulnerabilities-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  return (response.data?.aggregations?.top_os?.buckets ?? []).map((b: any) => {
    const sev: Record<string, number> = {};

    for (const s of b?.por_severidade?.buckets ?? []) {
      sev[s.key] = Number(s.doc_count || 0);
    }

    return {
      os: String(b.key ?? "Desconhecido"),
      total: Number(b.doc_count ?? 0),
      severity: sev,
    };
  });
}

/* ======================================================
   4) TOP AGENTES COM MAIS VULNERABILIDADES
====================================================== */
export async function buscarTopAgentesVulnerabilidades(
  tenant: any,
  opts?: { size?: number; dias?: string; agent?: string }
): Promise<TopAgentItem[]> {

  const size = Number(opts?.size ?? 5);
  const dias = opts?.dias ?? "todos";

  /* ============================
     CLUSTER
  ============================ */
  let clusterName = tenant.wazuh_cluster_name;

  if (clusterName && !clusterName.startsWith("manager-")) {
    clusterName = `manager-${clusterName}`;
  }

  /* ============================
     FILTRO DE TEMPO
  ============================ */
  const timeFilter =
    dias !== "todos"
      ? {
        range: {
          "@timestamp": {
            gte: `now-${dias}d`,
            lte: "now",
          },
        },
      }
      : null;

  /* ============================
     FILTROS
  ============================ */
  const filtros: any[] = [];

  if (timeFilter) filtros.push(timeFilter);

  if (clusterName) {
    filtros.push({
      match_phrase: {
        "wazuh.cluster.name": {
          query: clusterName,
        },
      },
    });
  }

  if (opts?.agent) {
    filtros.push({
      match_phrase: {
        "agent.name": {
          query: opts.agent,
        },
      },
    });
  }

  const body = {
    size: 0,

    docvalue_fields: [
      { field: "package.installed", format: "date_time" },
      { field: "vulnerability.detected_at", format: "date_time" },
      { field: "vulnerability.published_at", format: "date_time" },
    ],

    query: {
      bool: {
        must: [],
        filter: filtros,
        should: [],
        must_not: [],
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
          por_severidade: {
            terms: {
              field: "vulnerability.severity",
            },
          },
        },
      },
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-states-vulnerabilities-*/_search`,
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
  opts?: {
    size?: number;
    dias?: string;
    agent?: string;
  }
): Promise<
  {
    package: string;
    total: number;
    severity: Record<string, number>;
  }[]
> {

  const size = Number(opts?.size ?? 5);
  const dias = opts?.dias ?? "todos";

  /* ============================
     CLUSTER
  ============================ */
  let clusterName = tenant.wazuh_cluster_name;

  if (clusterName && !clusterName.startsWith("manager-")) {
    clusterName = `manager-${clusterName}`;
  }

  /* ============================
     FILTRO DE TEMPO
  ============================ */
  const timeFilter =
    dias !== "todos"
      ? {
          range: {
            "@timestamp": {
              gte: `now-${dias}d`,
              lte: "now",
            },
          },
        }
      : null;

  /* ============================
     FILTROS
  ============================ */
  const filtros: any[] = [];

  if (timeFilter) filtros.push(timeFilter);

  if (clusterName) {
    filtros.push({
      match_phrase: {
        "wazuh.cluster.name": {
          query: clusterName,
        },
      },
    });
  }

  if (opts?.agent) {
    filtros.push({
      match_phrase: {
        "agent.name": {
          query: opts.agent,
        },
      },
    });
  }

  const body = {
    size: 0,

    query: {
      bool: {
        must: [],
        filter: filtros,
        should: [],
        must_not: [],
      },
    },

    aggs: {
      top_packages: {
        terms: {
          field: "package.name",
          size,
          order: { _count: "desc" },
          missing: "Desconhecido",
        },
        aggs: {
          por_severidade: {
            terms: {
              field: "vulnerability.severity",
            },
          },
        },
      },
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-states-vulnerabilities-*/_search`,
    body,
    { headers: authHeader(tenant) }
  );

  return (response.data?.aggregations?.top_packages?.buckets ?? []).map(
    (b: any) => {
      const sev: Record<string, number> = {};

      for (const s of b?.por_severidade?.buckets ?? []) {
        sev[s.key] = Number(s.doc_count || 0);
      }

      return {
        package: String(b.key ?? "Desconhecido"),
        total: Number(b.doc_count ?? 0),
        severity: sev,
      };
    }
  );
}

/* ======================================================
   6) TOP SCORES (CVSS BASE SCORE)
====================================================== */
export async function buscarTopScoresVulnerabilidades(
  tenant: any,
  opts?: { size?: number; dias?: string; agent?: string }
): Promise<TopScoreItem[]> {

  const size = Number(opts?.size ?? 10);
  const dias = opts?.dias ?? "todos";

  /* ============================
     CLUSTER
  ============================ */
  let clusterName = tenant.wazuh_cluster_name;

  if (clusterName && !clusterName.startsWith("manager-")) {
    clusterName = `manager-${clusterName}`;
  }

  /* ============================
     FILTRO DE TEMPO
  ============================ */
  const timeFilter =
    dias !== "todos"
      ? {
          range: {
            "@timestamp": {
              gte: `now-${dias}d`,
              lte: "now",
            },
          },
        }
      : null;

  /* ============================
     FILTROS
  ============================ */
  const filtros: any[] = [];

  if (timeFilter) filtros.push(timeFilter);

  if (clusterName) {
    filtros.push({
      match_phrase: {
        "wazuh.cluster.name": {
          query: clusterName,
        },
      },
    });
  }

  if (opts?.agent) {
    filtros.push({
      match_phrase: {
        "agent.name": {
          query: opts.agent,
        },
      },
    });
  }

  const body = {
    size: 0,

    docvalue_fields: [
      { field: "package.installed", format: "date_time" },
      { field: "vulnerability.detected_at", format: "date_time" },
      { field: "vulnerability.published_at", format: "date_time" },
    ],

    query: {
      bool: {
        must: [],
        filter: filtros,
        should: [],
        must_not: [],
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
    `${tenant.wazuh_url}/wazuh-states-vulnerabilities-*/_search`,
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
  opts?: { dias?: string; agent?: string }
): Promise<VulnAnoItem[]> {

  const dias = opts?.dias ?? "todos";

  /* ============================
     CLUSTER
  ============================ */
  let clusterName = tenant.wazuh_cluster_name;

  if (clusterName && !clusterName.startsWith("manager-")) {
    clusterName = `manager-${clusterName}`;
  }

  /* ============================
     FILTRO DE TEMPO
  ============================ */
  const timeFilter =
    dias !== "todos"
      ? {
          range: {
            "@timestamp": {
              gte: `now-${dias}d`,
              lte: "now",
            },
          },
        }
      : null;

  /* ============================
     FILTROS
  ============================ */
  const filtros: any[] = [];

  if (timeFilter) filtros.push(timeFilter);

  if (clusterName) {
    filtros.push({
      match_phrase: {
        "wazuh.cluster.name": {
          query: clusterName,
        },
      },
    });
  }

  if (opts?.agent) {
    filtros.push({
      match_phrase: {
        "agent.name": {
          query: opts.agent,
        },
      },
    });
  }

  const body = {
    size: 0,

    docvalue_fields: [
      { field: "package.installed", format: "date_time" },
      { field: "vulnerability.detected_at", format: "date_time" },
      { field: "vulnerability.published_at", format: "date_time" },
    ],

    query: {
      bool: {
        must: [],
        filter: filtros,
        should: [],
        must_not: [],
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
            terms: {
              field: "vulnerability.severity",
              size: 5,
            },
          },
        },
      },
    },
  };

  const response = await http.post(
    `${tenant.wazuh_url}/wazuh-states-vulnerabilities-*/_search`,
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
      total: Number(b.doc_count ?? 0),
      severity: sev,
    };
  });
}