import axios from "axios";
import https from "https";

export interface TopVulnItem {
  key: string;
  total: number;
  severity: Record<string, number>;
}

export interface TopOSItem {
  os: string;
  total: number;
  severity: Record<string, number>;
}

export interface TopAgentItem {
  agent: string;
  total: number;
  severity: Record<string, number>;
}

export interface TopPackageItem {
  package: string;
  total: number;
  severity: Record<string, number>;
}

export interface TopScoreItem {
  score: string;
  total: number;
}

export interface VulnAnoItem {
  ano: string;
  total: number;
  severity: Record<string, number>;
}

export interface OvertimeResponse {
  labels: string[];
  datasets: { name: string; data: number[] }[];
}

export interface EventosSummaryResponse {
  labels: string[];
  values: number[];
}

export interface RuleDistributionItem {
  rule: string;
  count: number;
}

export interface TopUserItem {
  user: string;
  agent_id: string;
  agent_name: string;
  count: number;
}

function authHeader(tenant) {
  const basicAuth = Buffer.from(
    `${tenant.wazuh_username}:${tenant.wazuh_password}`
  ).toString("base64");

  return {
    Authorization: `Basic ${basicAuth}`,
    "Content-Type": "application/json",
  };
}

function customerFilter(clientName: string) {
  return { match: { "customer": clientName } };
}

/* ==================== FUNÇÕES ==================== */

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

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    {
      headers: authHeader(tenant),
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    }
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


export async function buscarTopGeradoresFirewall(tenant, dias) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const timeFilter =
    dias === "todos"
      ? { match_all: {} }
      : { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } };

  const body = {
    size: 0,
    query: { bool: { must: [customerFilter(clientName), timeFilter] } },
    aggs: {
      top_geradores: {
        terms: { field: "data.devname", size: 8, order: { _count: "desc" } },
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
      },
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant), httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
  );

  return (response.data?.aggregations?.top_geradores?.buckets || []).map((b) => {
    const sev = b.severidade?.buckets || [];
    const get = (k: string) => sev.find((x: any) => x.key === k)?.doc_count || 0;
    return {
      gerador: b.key,
      total: b.doc_count,
      severidade: { baixo: get("Low"), medio: get("Medium"), alto: get("High"), critico: get("Critical") },
    };
  });
}

export async function buscarTopAgentes(tenant, dias: string) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const timeFilter =
    dias === "todos"
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
          { match_phrase: { "manager.name": "wazuhhackone" } }, // fixo do Postman
          { match_phrase: { "rule.groups": "syscheck" } },      // fixo do Postman
          { match_phrase: { customer: clientName } },           // vem do tenant
        ],
      },
    },
    aggs: {
      top_agentes_alertas: {
        terms: {
          field: "agent.name",
          order: { _count: "desc" },
          size: 9, // igual ao Postman
        },
        aggs: {
          por_severidade: { terms: { field: "rule.level" } },
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

  return (
    response.data.aggregations?.top_agentes_alertas?.buckets || []
  ).map((agente) => {
    const total = agente.por_severidade.buckets.reduce(
      (sum, item) => sum + item.doc_count,
      0
    );

    const score =
      agente.por_severidade.buckets.reduce((acc, item) => {
        const peso =
          item.key >= 0 && item.key <= 6
            ? 0.2
            : item.key <= 11
            ? 0.6
            : item.key <= 14
            ? 0.87
            : 1.0;
        return acc + item.doc_count * peso;
      }, 0) / (total || 1);

    let nivel;
    if (score >= 1.0) nivel = "Crítico";
    else if (score >= 0.87) nivel = "Alto";
    else if (score >= 0.6) nivel = "Médio";
    else nivel = "Baixo";

    return {
      agente: agente.key,
      total_alertas: total,
      severidades: agente.por_severidade.buckets,
      nivel_risco: nivel,
      score: Math.round(score * 100),
    };
  });
}


export async function buscarTopAgentesCis(tenant, dias) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const timeFilter =
    dias === "todos"
      ? null
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
        must: [],
        filter: [
          { match_all: {} },
          { match_phrase: { customer: clientName } },
          { term: { "rule.groups": "sca" } },
          { term: { "data.sca.type": "summary" } }, // só pega resumo
          ...(timeFilter ? [timeFilter] : []),
        ],
      },
    },
    aggs: {
      agentes: {
        terms: { field: "agent.name", size: 20 },
        aggs: {
          ultimos_summary: {
            top_hits: {
              _source: ["agent.name", "data.sca"],
              size: 1,
              sort: [{ "@timestamp": { order: "desc" } }],
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

  const buckets = response.data.aggregations?.agentes?.buckets ?? [];

  return buckets.map((b) => {
    const hit = b.ultimos_summary.hits.hits[0]?._source;
    const sca = hit?.data?.sca ?? {};

    const scoreWazuh = Number(sca.score ?? 0);

    return {
      agente: b.key,                  // 👈 mantém o padrão antigo
      total_eventos: b.doc_count,
      score: scoreWazuh,              // valor bruto do Wazuh
      total_checks: Number(sca.total_checks ?? 0),
      passed: Number(sca.passed ?? 0),
      failed: Number(sca.failed ?? 0),
      policy: sca.policy ?? "Desconhecida",
      score_cis_percent: scoreWazuh,  // 👈 devolve o score do Wazuh como %
    };
  });
}




export async function buscarTopPaisesAtaque(tenant, dias: string) {
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
        must: [
          customerFilter(clientName),
          timeFilter,
          { term: { "rule.groups": "fortigate" } },
        ],
        must_not: [
          {
            terms: {
              "data.srccountry": ["Reserved", "Unknown", "N/A", "-", ""],
            },
          },
        ],
      },
    },
    aggs: {
      top_countries: {
        terms: { field: "data.srccountry", size: 10, order: { _count: "desc" } },
        aggs: {
          severidade: {
            range: {
              field: "rule.level",
              ranges: [
                { to: 7, key: "Baixo" },
                { from: 7, to: 12, key: "Médio" },
                { from: 12, to: 15, key: "Alto" },
                { from: 15, key: "Crítico" },
              ],
            },
          },
        },
      },
      top_destinos: {
        terms: { field: "data.dstip", size: 10, order: { _count: "desc" } },
        aggs: {
          agentes: { terms: { field: "agent.name", size: 1 } }, // 👈 novo
          origens: { terms: { field: "data.srcip", size: 10 } },
          severidade: {
            range: {
              field: "rule.level",
              ranges: [
                { to: 7, key: "Baixo" },
                { from: 7, to: 12, key: "Médio" },
                { from: 12, to: 15, key: "Alto" },
                { from: 15, key: "Crítico" },
              ],
            },
          },
        },
      }
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

  return [
    // Origens (países que atacam)
    ...(response.data.aggregations?.top_countries?.buckets || []).map((b) => ({
      tipo: "origem",
      pais: b.key,
      total: b.doc_count,
      severidades: (b.severidade?.buckets ?? []).map((s) => ({
        key: s.key,
        doc_count: s.doc_count,
      })),
    })),

    // Destinos (IPs que recebem ataque)
    ...(response.data.aggregations?.top_destinos?.buckets || []).map((b) => ({
      tipo: "destino",
      destino: b.key,
      total: b.doc_count,
      agente: b.agentes?.buckets?.[0]?.key || null,   // 👈 agora vem preenchido
      severidades: (b.severidade?.buckets ?? []).map((s) => ({
        key: s.key,
        doc_count: s.doc_count,
      })),
      origens: (b.origens?.buckets ?? []).map((o) => ({
        ip: o.key,
        total: o.doc_count,
      })),
    }))
  ];
}


export async function buscarVulnSeveridades(tenant: any) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const body: any = {
    size: 0,
    stored_fields: ["*"],
    script_fields: {},
    docvalue_fields: [
      { field: "package.installed", format: "date_time" },
      { field: "vulnerability.detected_at", format: "date_time" },
      { field: "vulnerability.published_at", format: "date_time" }
    ],
    _source: { excludes: [] },
    query: {
      bool: {
        must: [],
        filter: [
          { match_all: {} },
          { match_phrase: { "wazuh.cluster.name": { query: "wazuhhackone" } } },
          { match_phrase: { customer: clientName } }
        ],
        should: [],
        must_not: []
      }
    },
    aggs: {
      severity: {
        filters: {
          filters: {
            Pending: {
              bool: {
                filter: [{ term: { "vulnerability.under_evaluation": true } }]
              }
            },
            Critical: {
              bool: {
                filter: [{ match_phrase: { "vulnerability.severity": "Critical" } }]
              }
            },
            High: {
              bool: {
                filter: [{ match_phrase: { "vulnerability.severity": "High" } }]
              }
            },
            Medium: {
              bool: {
                filter: [{ match_phrase: { "vulnerability.severity": "Medium" } }]
              }
            },
            Low: {
              bool: {
                filter: [{ match_phrase: { "vulnerability.severity": "Low" } }]
              }
            }
          }
        }
      },
      total: { filter: { exists: { field: "vulnerability" } } }
    }
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search?filter_path=aggregations.*`,
    body,
    {
      headers: authHeader(tenant),
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    }
  );

  const buckets = response.data?.aggregations?.severity?.buckets || {};
  const total = response.data?.aggregations?.total?.doc_count || 0;

  // retorna já simplificado
  return {
    Pending: buckets.Pending?.doc_count || 0,
    Critical: buckets.Critical?.doc_count || 0,
    High: buckets.High?.doc_count || 0,
    Medium: buckets.Medium?.doc_count || 0,
    Low: buckets.Low?.doc_count || 0,
    Total: total
  };
}


export async function buscarTopVulnerabilidades(
  tenant: any,
  opts?: { by?: "cve" | "package" | "agent"; size?: number; dias?: string }
): Promise<TopVulnItem[]> {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const by = opts?.by ?? "cve";
  const size = Number(opts?.size ?? 5);
  const dias = opts?.dias ?? "todos";

  const field =
    by === "package" ? "package.name" :
    by === "agent" ? "agent.name" :
    "vulnerability.id"; // igual ao Postman

  const timeFilter =
    dias !== "todos"
      ? { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } }
      : { match_all: {} };

  const body: any = {
    size: 0,
    stored_fields: ["*"],
    script_fields: {},
    docvalue_fields: [
      { field: "package.installed", format: "date_time" },
      { field: "vulnerability.detected_at", format: "date_time" },
      { field: "vulnerability.published_at", format: "date_time" }
    ],
    _source: { excludes: [] },
    query: {
      bool: {
        must: [],
        filter: [
          timeFilter,
          { match_phrase: { customer: clientName } }
        ],
        should: [],
        must_not: []
      }
    },
    aggs: {
      top_vulns: {
        terms: { field, size, order: { _count: "desc" } },
        aggs: {
          por_severidade: {
            terms: { field: "vulnerability.severity" }
          }
        }
      }
    }
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    {
      headers: authHeader(tenant),
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    }
  );

  const buckets = response.data?.aggregations?.top_vulns?.buckets ?? [];
  return buckets.map((b: any) => {
    const sev: Record<string, number> = {};
    for (const s of b?.por_severidade?.buckets ?? []) {
      sev[s.key] = Number(s.doc_count || 0);
    }
    return {
      key: String(b.key ?? ""),
      total: Number(b.doc_count ?? 0),
      severity: sev
    };
  });
}


export async function buscarTopOSVulnerabilidades(
  tenant: any,
  opts?: { size?: number; dias?: string }
): Promise<TopOSItem[]> {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const size = Number(opts?.size ?? 5);
  const dias = opts?.dias ?? "todos";

  const timeFilter =
    dias !== "todos"
      ? { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } }
      : { match_all: {} };

  const body: any = {
    size: 0,
    stored_fields: ["*"],
    script_fields: {},
    docvalue_fields: [
      { field: "package.installed", format: "date_time" },
      { field: "vulnerability.detected_at", format: "date_time" },
      { field: "vulnerability.published_at", format: "date_time" }
    ],
    _source: { excludes: [] },
    query: {
      bool: {
        must: [],
        filter: [
          timeFilter,
          { match_phrase: { customer: clientName } }
        ],
        should: [],
        must_not: []
      }
    },
    aggs: {
      top_os: {
        terms: { field: "host.os.full", size, order: { _count: "desc" } },
        aggs: {
          por_severidade: {
            terms: { field: "vulnerability.severity" }
          }
        }
      }
    }
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    {
      headers: authHeader(tenant),
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    }
  );

  return (response.data?.aggregations?.top_os?.buckets ?? []).map((b: any) => {
    const sev: Record<string, number> = {};
    for (const s of b?.por_severidade?.buckets ?? []) {
      sev[s.key] = Number(s.doc_count || 0);
    }
    return {
      os: String(b.key ?? "Desconhecido"),
      total: Number(b.doc_count ?? 0),
      severity: sev
    };
  });
}


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

  const body: any = {
    size: 0,
    stored_fields: ["*"],
    script_fields: {},
    docvalue_fields: [
      { field: "package.installed", format: "date_time" },
      { field: "vulnerability.detected_at", format: "date_time" },
      { field: "vulnerability.published_at", format: "date_time" }
    ],
    _source: { excludes: [] },
    query: {
      bool: {
        must: [],
        filter: [
          timeFilter,
          { match_phrase: { "wazuh.cluster.name": { query: "wazuhhackone" } } },
          { match_phrase: { customer: clientName } }
        ],
        should: [],
        must_not: []
      }
    },
    aggs: {
      top_agents: {
        terms: {
          field: "agent.name", // igual ao Postman
          size,
          order: { _count: "desc" },
          missing: "N/A"
        },
        aggs: {
          por_severidade: {
            terms: { field: "vulnerability.severity" }
          }
        }
      }
    }
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    {
      headers: authHeader(tenant),
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    }
  );

  return (response.data?.aggregations?.top_agents?.buckets ?? []).map((b: any) => {
    const sev: Record<string, number> = {};
    for (const s of b?.por_severidade?.buckets ?? []) {
      sev[s.key] = Number(s.doc_count || 0);
    }
    return {
      agent: String(b.key ?? "Desconhecido"),
      total: Number(b.doc_count ?? 0),
      severity: sev
    };
  });
}



export async function buscarTopPackagesVulnerabilidades(
  tenant: any,
  opts?: { size?: number; dias?: string }
): Promise<TopPackageItem[]> {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const size = Number(opts?.size ?? 5);
  const dias = opts?.dias ?? "todos";

  const timeFilter =
    dias !== "todos"
      ? { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } }
      : { match_all: {} };

  const body: any = {
    size: 0,
    stored_fields: ["*"],
    script_fields: {},
    docvalue_fields: [
      { field: "package.installed", format: "date_time" },
      { field: "vulnerability.detected_at", format: "date_time" },
      { field: "vulnerability.published_at", format: "date_time" }
    ],
    _source: { excludes: [] },
    query: {
      bool: {
        must: [],
        filter: [
          timeFilter,
          { match_phrase: { "wazuh.cluster.name": { query: "wazuhhackone" } } },
          { match_phrase: { customer: clientName } }
        ],
        should: [],
        must_not: []
      }
    },
    aggs: {
      top_packages: {
        terms: {
          field: "package.name", // igual Postman
          size,
          order: { _count: "desc" },
          missing: "N/A"
        },
        aggs: {
          por_severidade: {
            terms: { field: "vulnerability.severity" }
          }
        }
      }
    }
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    {
      headers: authHeader(tenant),
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    }
  );

  return (response.data?.aggregations?.top_packages?.buckets ?? []).map((b: any) => {
    const sev: Record<string, number> = {};
    for (const s of b?.por_severidade?.buckets ?? []) {
      sev[s.key] = Number(s.doc_count || 0);
    }
    return {
      package: String(b.key ?? "Desconhecido"),
      total: Number(b.doc_count ?? 0),
      severity: sev
    };
  });
}



export async function buscarTopScoresVulnerabilidades(
  tenant: any,
  opts?: { size?: number; dias?: string }
): Promise<TopScoreItem[]> {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const size = Number(opts?.size ?? 10); // default do Postman é 10
  const dias = opts?.dias ?? "todos";

  const timeFilter =
    dias !== "todos"
      ? { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } }
      : { match_all: {} };

  const body: any = {
    size: 0,
    stored_fields: ["*"],
    script_fields: {},
    docvalue_fields: [
      { field: "package.installed", format: "date_time" },
      { field: "vulnerability.detected_at", format: "date_time" },
      { field: "vulnerability.published_at", format: "date_time" }
    ],
    _source: { excludes: [] },
    query: {
      bool: {
        must: [],
        filter: [
          timeFilter,
          { match_phrase: { "wazuh.cluster.name": { query: "wazuhhackone" } } },
          { match_phrase: { customer: clientName } }
        ],
        should: [],
        must_not: []
      }
    },
    aggs: {
      top_scores: {
        terms: {
          field: "vulnerability.score.base",
          size,
          order: { _count: "desc" }
        }
      }
    }
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    {
      headers: authHeader(tenant),
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    }
  );

  return (response.data?.aggregations?.top_scores?.buckets ?? []).map((b: any) => ({
    score: String(b.key ?? "Desconhecido"),
    total: Number(b.doc_count ?? 0)
  }));
}


export async function buscarVulnerabilidadesPorAno(
  tenant: any,
  opts?: { dias?: string }
): Promise<VulnAnoItem[]> {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const dias = opts?.dias ?? "todos";

  const timeFilter =
    dias !== "todos"
      ? { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } }
      : { match_all: {} };

  const body: any = {
    size: 0,
    stored_fields: ["*"],
    script_fields: {},
    docvalue_fields: [
      { field: "package.installed", format: "date_time" },
      { field: "vulnerability.detected_at", format: "date_time" },
      { field: "vulnerability.published_at", format: "date_time" }
    ],
    _source: { excludes: [] },
    query: {
      bool: {
        must: [],
        filter: [
          timeFilter,
          { match_phrase: { "wazuh.cluster.name": { query: "wazuhhackone" } } },
          { match_phrase: { customer: clientName } }
        ],
        should: [],
        must_not: []
      }
    },
    aggs: {
      por_ano: {
        date_histogram: {
          field: "vulnerability.published_at",
          calendar_interval: "1y",
          time_zone: "America/Sao_Paulo",
          format: "yyyy",
          min_doc_count: 1
        },
        aggs: {
          por_severidade: {
            terms: {
              field: "vulnerability.severity",
              order: { _count: "desc" },
              size: 5
            }
          }
        }
      }
    }
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    {
      headers: authHeader(tenant),
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    }
  );

  return (response.data?.aggregations?.por_ano?.buckets ?? []).map((b: any) => {
    const sev: Record<string, number> = {};
    for (const s of b?.por_severidade?.buckets ?? []) {
      sev[s.key] = Number(s.doc_count || 0);
    }
    return {
      ano: String(b.key_as_string ?? "Desconhecido"),
      total: Number(b.doc_count ?? 0),
      severity: sev
    };
  });
}


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
      por_dia: {
        date_histogram: {
          field: "@timestamp",
          fixed_interval: "1d",
          min_doc_count: 0,
        },
        aggs: {
          acoes: {
            terms: {
              field: "syscheck.event",
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

  const buckets = response.data?.aggregations?.por_dia?.buckets ?? [];

  // 🔹 Labels formatados como dd/MM
  const labels: string[] = buckets.map((b: any) => {
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

  const datasets = tipos.map((tipo) => ({
    name: tipo.label, // 👈 já traduzido aqui
    data: [] as number[],
  }));

  for (const bucket of buckets) {
    for (const tipo of tipos) {
      const ds = datasets.find((d) => d.name === tipo.label)!;
      const valor =
        bucket.acoes?.buckets?.find((a: any) => a.key === tipo.key)?.doc_count ?? 0;
      ds.data.push(valor);
    }
  }

  return { labels, datasets };
}

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
            "@timestamp": {
              gte: `now-${dias}d`,
              lte: "now",
            },
          },
        }
      : null;

  const body: any = {
    size: 0,
    query: {
      bool: {
        must: [
          { match_phrase: { "manager.name": "wazuhhackone" } }, // fixo igual ao Postman
          { match_phrase: { "rule.groups": "syscheck" } },      // fixo igual ao Postman
          { match_phrase: { customer: clientName } },           // variável
          ...(timeFilter ? [timeFilter] : []),
        ],
      },
    },
    aggs: {
      por_dia: {
        date_histogram: {
          field: "timestamp", // no Postman usaram `timestamp` em vez de `@timestamp`
          fixed_interval: "30m", // Postman pediu 30 minutos
          time_zone: "America/Sao_Paulo",
          min_doc_count: 1, // só buckets com docs
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

  const buckets = response.data?.aggregations?.por_dia?.buckets ?? [];

  // 🔹 Labels formatados como dd/MM HH:mm
  const labels: string[] = buckets.map((b: any) => {
    const d = new Date(b.key_as_string);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  // 🔹 Valores totais de alertas por intervalo
  const values: number[] = buckets.map((b: any) => b.doc_count ?? 0);

  return { labels, values };
}



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
            "@timestamp": {
              gte: `now-${dias}d`,
              lte: "now",
            },
          },
        }
      : null;

  const body: any = {
    size: 0,
    query: {
      bool: {
        must: [
          { match_phrase: { "manager.name": "wazuhhackone" } }, // fixo igual Postman
          { match_phrase: { "rule.groups": "syscheck" } },      // fixo igual Postman
          { match_phrase: { customer: clientName } },           // variável do tenant
          ...(timeFilter ? [timeFilter] : []),
        ],
      },
    },
    aggs: {
      rules: {
        terms: {
          field: "rule.description", // igual ao Postman (sem .keyword)
          order: { _count: "desc" }, // ordenar por mais frequentes
          size: 5,                   // top 5 (Postman usou 5)
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

  return (
    response.data?.aggregations?.rules?.buckets ?? []
  ).map((b: any) => ({
    rule: String(b.key ?? "Desconhecido"),
    count: Number(b.doc_count ?? 0),
  }));
}


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

  // Flatten para lista simples [{user, agent_id, agent_name, count}]
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
