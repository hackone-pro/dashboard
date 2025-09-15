import axios from "axios";
import https from "https";

export interface TopVulnItem {
  key: string;                 // CVE / pacote / agente
  total: number;               // doc_count
  severity: Record<string, number>; // Critical/High/Medium/Low ...
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
  package: string;                  // Nome do pacote vulnerável
  total: number;                    // Total de vulnerabilidades desse pacote
  severity: Record<string, number>; // Ex: { Critical: 2, High: 10, Medium: 5, Low: 1 }
}

export interface TopScoreItem {
  score: string;
  total: number;
}

export interface VulnAnoItem {
  ano: string;                        // Ex: "2025"
  total: number;                      // Total de vulnerabilidades no ano
  severity: Record<string, number>;   // Ex: { Critical: 4, High: 42, Medium: 15, Low: 0 }
}


export async function buscarSeveridadeIndexer(tenant) {
  const basicAuth = Buffer.from(
    `${tenant.wazuh_username}:${tenant.wazuh_password}`
  ).toString("base64");

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-alerts-*/_search`,
    {
      size: 0,
      query: {
        range: {
          "@timestamp": {
            gte: "now-24h",
            lte: "now"
          }
        }
      },
      aggs: {
        severidade: {
          range: {
            field: "rule.level",
            ranges: [
              { to: 7, key: "Low" },
              { from: 7, to: 12, key: "Medium" },
              { from: 12, to: 15, key: "High" },
              { from: 15, key: "Critical" }
            ]
          }
        }
      }
    },
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json"
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    }
  );

  return response.data.aggregations?.severidade?.buckets || [];
}

export async function buscarTopGeradoresFirewall(tenant, dias) {
  const basicAuth = Buffer.from(
    `${tenant.wazuh_username}:${tenant.wazuh_password}`
  ).toString("base64");

  const query =
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
    query,
    aggs: {
      top_geradores: {
        terms: {
          field: "data.devname",     // no seu index funciona sem .keyword
          size: 8,                   // ajuste aqui o Top N (ex.: 5, 8, 10)
          order: { _count: "desc" },
          // shard_size: 100           // opcional: melhora precisão em clusters grandes
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
      },
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-alerts-*/_search`,
    body,
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    }
  );

  const buckets = response.data?.aggregations?.top_geradores?.buckets || [];

  // mapeia para um shape amigável ao front
  const resultado = buckets.map((b) => {
    const sev = b.severidade?.buckets || [];
    const get = (k: string) => sev.find((x: any) => x.key === k)?.doc_count || 0;

    return {
      gerador: b.key,            // ex.: "RJA-FortiGate-40F"
      total: b.doc_count,        // total de alertas do firewall
      severidade: {
        baixo: get("Low"),
        medio: get("Medium"),
        alto: get("High"),
        critico: get("Critical"),
      },
    };
  });

  return resultado;
}

export async function buscarTopAgentes(tenant, dias) {
  const basicAuth = Buffer.from(
    `${tenant.wazuh_username}:${tenant.wazuh_password}`
  ).toString("base64");

  const query = dias === "todos"
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
    query,
    aggs: {
      top_agentes_alertas: {
        terms: {
          field: "agent.name",
          size: 9,
        },
        aggs: {
          por_severidade: {
            terms: {
              field: "rule.level",
            },
          },
        },
      },
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-alerts-*/_search`,
    body,
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    }
  );

  const buckets = response.data.aggregations?.top_agentes_alertas?.buckets || [];

  const resultado = buckets.map((agente) => {
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

  return resultado;
}

export async function buscarTopAgentesCis(tenant, dias) {
  const basicAuth = Buffer.from(
    `${tenant.wazuh_username}:${tenant.wazuh_password}`
  ).toString("base64");

  // Se "todos", não aplica filtro de data; caso contrário, usa range por dias
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

  // Query base: SCA (onde vivem os checks CIS). Se quiser forçar "CIS" no texto,
  // depois podemos adicionar um SHOULD por rule.description/sca.policy.name.
  const body = {
    size: 0,
    query: {
      bool: {
        must: [
          timeFilter,
          { term: { "rule.groups": "sca" } }, // <- núcleo dos eventos de compliance
        ],
      },
    },
    aggs: {
      agentes: {
        terms: {
          field: "agent.name", // no seu índice atual funciona sem .keyword
          size: 14,            // Top 10 (ajuste aqui se quiser 8)
          order: { media_score: "asc" }, // menor média = melhor conformidade
        },
        aggs: {
          media_score: {
            avg: { field: "rule.level" },
          },
        },
      },
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-alerts-*/_search`,
    body,
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    }
  );

  const buckets =
    response.data.aggregations?.agentes?.buckets || [];

  // Mapeia para um shape simples de consumo no front
  const resultado = buckets.map((b) => {
    const media = Number(b?.media_score?.value ?? 0);
    // opcional: normalizar para 0–100 usando 15 como teto típico de rule.level
    const score_percent = Math.max(
      0,
      Math.min(100, Math.round((media / 15) * 100))
    );

    return {
      agente: b.key,
      total_eventos: b.doc_count,
      media_score: media,          // média de rule.level (quanto menor, melhor)
      score_cis_percent: score_percent, // normalização opcional 0–100
    };
  });

  return resultado;
}

// --- TOP PAÍSES DE ORIGEM (Fortigate/Wazuh) ---
export async function buscarTopPaisesAtaque(tenant, dias: string) {
  const basicAuth = Buffer.from(
    `${tenant.wazuh_username}:${tenant.wazuh_password}`
  ).toString("base64");

  const query =
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
        filter: [query, { term: { "rule.groups": "fortigate" } }], // opcional; remova se quiser geral
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
        terms: {
          field: "data.srccountry", // <- sem .keyword, como testado no Postman
          size: 10,
          order: { _count: "desc" },
        },
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
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-alerts-*/_search`,
    body,
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    }
  );

  const buckets = response.data.aggregations?.top_countries?.buckets || [];

  // Normaliza saída
  return buckets.map((b) => ({
    pais: b.key,
    total: b.doc_count,
    severidades: (b.severidade?.buckets ?? []).map((s) => ({
      key: s.key,
      doc_count: s.doc_count,
    })),
  }));
}

export async function buscarVulnSeveridades(tenant) {
  const basicAuth = Buffer.from(
    `${tenant.wazuh_username}:${tenant.wazuh_password}`
  ).toString("base64");

  // usa o client_name do tenant para montar o índice
  const clientName = tenant.wazuh_client_name;
  if (!clientName) {
    throw new Error("Tenant sem client_name definido");
  }

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-alerts-${clientName}-*/_search?filter_path=aggregations.*`,
    {
      size: 0,
      track_total_hits: false,
      query: {
        bool: {
          filter: [{ exists: { field: "data.vulnerability" } }],
        },
      },
      aggs: {
        severity: {
          filters: {
            filters: {
              Critical: { match_phrase: { "data.vulnerability.severity": "Critical" } },
              High: { match_phrase: { "data.vulnerability.severity": "High" } },
              Medium: { match_phrase: { "data.vulnerability.severity": "Medium" } },
              Low: { match_phrase: { "data.vulnerability.severity": "Low" } },
            },
          },
        },
        no_severity_or_other: {
          filter: {
            bool: {
              should: [
                { bool: { must_not: [{ exists: { field: "data.vulnerability.severity" } }] } },
                {
                  bool: {
                    must: [{ exists: { field: "data.vulnerability.severity" } }],
                    must_not: [
                      { match_phrase: { "data.vulnerability.severity": "Critical" } },
                      { match_phrase: { "data.vulnerability.severity": "High" } },
                      { match_phrase: { "data.vulnerability.severity": "Medium" } },
                      { match_phrase: { "data.vulnerability.severity": "Low" } },
                    ],
                  },
                },
              ],
              minimum_should_match: 1,
            },
          },
        },
        status_counts: {
          filters: {
            filters: {
              Active: { match_phrase: { "data.vulnerability.status": "Active" } },
              Solved: { match_phrase: { "data.vulnerability.status": "Solved" } },
              Pending: {
                bool: {
                  should: [
                    { match_phrase: { "data.vulnerability.status": "Pending" } },
                    { match_phrase: { "data.vulnerability.status": "Pending - Evaluation" } },
                    { match_phrase: { "data.vulnerability.state": "Pending" } },
                    { match_phrase: { "data.vulnerability.state": "Pending - Evaluation" } },
                  ],
                  minimum_should_match: 1,
                },
              },
            },
          },
        },
        total: { filter: { exists: { field: "data.vulnerability" } } },
      },
    },
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    }
  );

  return response.data?.aggregations || {};
}

export async function buscarTopVulnerabilidades(
  tenant: any,
  opts?: { by?: "cve" | "package" | "agent"; size?: number; dias?: string }
): Promise<TopVulnItem[]> {
  const basicAuth = Buffer.from(
    `${tenant.wazuh_username}:${tenant.wazuh_password}`
  ).toString("base64");

  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const by = opts?.by ?? "cve";
  const size = Number(opts?.size ?? 5);
  const dias = opts?.dias ?? "todos";

  const field =
    by === "package" ? "data.vulnerability.package.name" :
      by === "agent" ? "agent.name" :
        "data.vulnerability.cve"; // default: cve

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
        filter: [
          { exists: { field: "data.vulnerability" } },
          ...(timeFilter ? [timeFilter] : []),
        ],
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
            terms: { field: "data.vulnerability.severity" },
          },
        },
      },
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-alerts-${clientName}-*/_search`,
    body,
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    }
  );

  const buckets = response.data?.aggregations?.top_vulns?.buckets ?? [];
  return buckets.map((b: any) => {
    const sevBuckets = b?.por_severidade?.buckets ?? [];
    const sev: Record<string, number> = {};
    for (const s of sevBuckets) sev[s.key] = Number(s.doc_count || 0);

    return {
      key: String(b.key ?? ""),
      total: Number(b.doc_count ?? 0),
      severity: sev,
    };
  });
}

export async function buscarTopOSVulnerabilidades(
  tenant: any,
  opts?: { size?: number; dias?: string }
): Promise<TopOSItem[]> {
  const basicAuth = Buffer.from(
    `${tenant.wazuh_username}:${tenant.wazuh_password}`
  ).toString("base64");

  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const size = Number(opts?.size ?? 5);
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
        filter: [
          { exists: { field: "data.vulnerability" } },
          { match_phrase: { "data.vulnerability.package.source": "OS" } },
          ...(timeFilter ? [timeFilter] : []),
        ],
      },
    },
    aggs: {
      top_os: {
        terms: {
          field: "data.vulnerability.package.name", // sem .keyword, conforme solicitado
          size,
          order: { _count: "desc" },
        },
        aggs: {
          por_severidade: {
            terms: { field: "data.vulnerability.severity" }, // sem .keyword
          },
        },
      },
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-alerts-${clientName}-*/_search`,
    body,
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    }
  );

  const buckets = response.data?.aggregations?.top_os?.buckets ?? [];
  return buckets.map((b: any) => {
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

export async function buscarTopAgentesVulnerabilidades(
  tenant: any,
  opts?: { size?: number; dias?: string }
): Promise<TopAgentItem[]> {
  const basicAuth = Buffer.from(
    `${tenant.wazuh_username}:${tenant.wazuh_password}`
  ).toString("base64");

  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const size = Number(opts?.size ?? 5);
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
        filter: [
          { exists: { field: "data.vulnerability" } },
          ...(timeFilter ? [timeFilter] : []),
        ],
      },
    },
    aggs: {
      top_agents: {
        terms: {
          field: "agent.name", // agrupando por agente
          size,
          order: { _count: "desc" },
        },
        aggs: {
          severity: {
            filters: {
              filters: {
                Critical: { match_phrase: { "data.vulnerability.severity": "Critical" } },
                High: { match_phrase: { "data.vulnerability.severity": "High" } },
                Medium: { match_phrase: { "data.vulnerability.severity": "Medium" } },
                Low: { match_phrase: { "data.vulnerability.severity": "Low" } },
              },
            },
          },
        },
      },
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-alerts-${clientName}-*/_search`,
    body,
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    }
  );

  const buckets = response.data?.aggregations?.top_agents?.buckets ?? [];
  return buckets.map((b: any) => {
    const sev: Record<string, number> = {};
    for (const [key, val] of Object.entries(b?.severity?.buckets ?? {})) {
      sev[key] = Number((val as any)?.doc_count || 0);
    }
    return {
      agent: String(b.key ?? "Desconhecido"),
      total: Number(b.doc_count ?? 0),
      severity: sev,
    };
  });
}

export async function buscarTopPackagesVulnerabilidades(
  tenant: any,
  opts?: { size?: number; dias?: string }
): Promise<TopPackageItem[]> {
  const basicAuth = Buffer.from(
    `${tenant.wazuh_username}:${tenant.wazuh_password}`
  ).toString("base64");

  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const size = Number(opts?.size ?? 5);
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
        filter: [
          { exists: { field: "data.vulnerability" } },
          ...(timeFilter ? [timeFilter] : []),
        ],
        must_not: [
          { match_phrase: { "data.vulnerability.package.source": "OS" } },
        ],
      },
    },
    aggs: {
      top_packages: {
        terms: {
          field: "data.vulnerability.package.name",
          size,
          order: { _count: "desc" },
        },
        aggs: {
          severity: {
            filters: {
              filters: {
                Critical: { match_phrase: { "data.vulnerability.severity": "Critical" } },
                High: { match_phrase: { "data.vulnerability.severity": "High" } },
                Medium: { match_phrase: { "data.vulnerability.severity": "Medium" } },
                Low: { match_phrase: { "data.vulnerability.severity": "Low" } },
              },
            },
          },
        },
      },
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-alerts-${clientName}-*/_search`,
    body,
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    }
  );

  const buckets = response.data?.aggregations?.top_packages?.buckets ?? [];
  return buckets.map((b: any) => {
    const sev: Record<string, number> = {};
    for (const [key, val] of Object.entries(b?.severity?.buckets ?? {})) {
      sev[key] = Number((val as any)?.doc_count || 0);
    }
    return {
      package: String(b.key ?? "Desconhecido"),
      total: Number(b.doc_count ?? 0),
      severity: sev,
    };
  });
}

export async function buscarTopScoresVulnerabilidades(
  tenant: any,
  opts?: { size?: number; dias?: string }
): Promise<TopScoreItem[]> {
  const basicAuth = Buffer.from(
    `${tenant.wazuh_username}:${tenant.wazuh_password}`
  ).toString("base64");

  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const size = Number(opts?.size ?? 5); // default: top 10
  const dias = opts?.dias ?? "todos";

  // filtro de tempo
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
        filter: [
          { exists: { field: "data.vulnerability.score.base" } },
          ...(timeFilter ? [timeFilter] : []),
        ],
      },
    },
    aggs: {
      top_scores: {
        terms: {
          field: "data.vulnerability.score.base", // campo do CVSS base score
          size,
          order: { _count: "desc" },
        },
      },
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-alerts-${clientName}-*/_search`,
    body,
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    }
  );

  const buckets = response.data?.aggregations?.top_scores?.buckets ?? [];
  return buckets.map((b: any) => ({
    score: String(b.key ?? "Desconhecido"),
    total: Number(b.doc_count ?? 0),
  }));
}

export async function buscarVulnerabilidadesPorAno(
  tenant: any,
  opts?: { dias?: string }
): Promise<VulnAnoItem[]> {
  const basicAuth = Buffer.from(
    `${tenant.wazuh_username}:${tenant.wazuh_password}`
  ).toString("base64");

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
        filter: [
          { exists: { field: "data.vulnerability.published" } }, // data de publicação da vulnerabilidade
          ...(timeFilter ? [timeFilter] : []),
        ],
      },
    },
    aggs: {
      por_ano: {
        date_histogram: {
          field: "data.vulnerability.published",
          calendar_interval: "year",
          format: "yyyy",
          min_doc_count: 1,
        },
        aggs: {
          por_severidade: {
            terms: { field: "data.vulnerability.severity" },
          },
        },
      },
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-alerts-${clientName}-*/_search`,
    body,
    {
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    }
  );

  const buckets = response.data?.aggregations?.por_ano?.buckets ?? [];
  return buckets.map((b: any) => {
    const sev: Record<string, number> = {};
    for (const s of b?.por_severidade?.buckets ?? []) {
      sev[s.key] = Number(s.doc_count || 0);
    }
    return {
      ano: String(b.key_as_string ?? "Desconhecido"),
      total: Number(b.doc_count ?? 0),
      severity: sev,
    };
  });
}
