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

// helper para checar IP privado
function isPrivateIp(ip: string) {
  return /^10\./.test(ip) ||
    /^192\.168\./.test(ip) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip);
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

  const customerFilter = {
    bool: {
      should: [
        { term: { "data.customer": clientName } },
        { term: { "data.customer.keyword": clientName } },
        { term: { "customer": clientName } },
        { term: { "customer.keyword": clientName } },
        { term: { "fields.customer": clientName } },
        { term: { "fields.customer.keyword": clientName } }
      ],
      minimum_should_match: 1,
    },
  };

  // função auxiliar para criar body com campo de agregação variável
  const buildBody = (devnameField) => ({
    size: 0,
    query: { bool: { must: [customerFilter, timeFilter] } },
    aggs: {
      top_geradores: {
        terms: { field: devnameField, size: 8, order: { _count: "desc" } },
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
        },
      },
    },
  });

  const baseURL = `${tenant.wazuh_url}/wazuh-*/_search`;

  // 🟢 1. Tenta com data.devname
  let body = buildBody("data.devname");
  let response = await axios.post(baseURL, body, {
    headers: authHeader(tenant),
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  });

  let buckets = response.data?.aggregations?.top_geradores?.buckets || [];

  // 🔄 2. Se não houver resultados, tenta com data.devname.keyword
  if (buckets.length === 0) {
    body = buildBody("data.devname.keyword");
    response = await axios.post(baseURL, body, {
      headers: authHeader(tenant),
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });
    buckets = response.data?.aggregations?.top_geradores?.buckets || [];
  }

  // 📊 Formatação do retorno
  return buckets.map((b) => {
    const sev = b.severidade?.buckets || [];
    const get = (k: string) => sev.find((x: any) => x.key === k)?.doc_count || 0;

    return {
      gerador: b.key,
      total: b.doc_count,
      severidade: {
        baixo: get("Low"),
        medio: get("Medium"),
        alto: get("High"),
        critico: get("Critical"),
      },
    };
  });
}


export async function buscarTopAgentes(tenant, dias) {
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
    stored_fields: ["*"],
    script_fields: {},
    docvalue_fields: [
      { field: "timestamp", format: "date_time" },
      { field: "syscheck.mtime_after", format: "date_time" },
      { field: "syscheck.mtime_before", format: "date_time" },
      { field: "data.vulnerability.published", format: "date_time" },
      { field: "data.vulnerability.updated", format: "date_time" },
      { field: "data.timestamp", format: "date_time" },
      { field: "data.aws.createdAt", format: "date_time" },
      { field: "data.aws.end", format: "date_time" },
      { field: "data.aws.start", format: "date_time" },
      { field: "data.aws.updatedAt", format: "date_time" }
    ],
    _source: {
      excludes: ["@timestamp"],
    },
    query: {
      bool: {
        must: [
          timeFilter,
          { match_phrase: { customer: clientName } },
        ],
        filter: [
          { match_phrase: { "rule.groups": { query: "syscheck" } } },
        ],
        must_not: [
          { match_phrase: { "agent.name": "wazuhhackone" } },
        ],
      },
    },
    aggs: {
      top_agentes_alertas: {
        terms: {
          field: "agent.name",
          order: { _count: "desc" },
          size: 9,
        },
        aggs: {
          por_severidade: { terms: { field: "rule.level" } },
          por_evento: { terms: { field: "syscheck.event" } },
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

  const agentes = response.data?.aggregations?.top_agentes_alertas?.buckets || [];

  return agentes.map((agente) => {
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

    const eventos = agente.por_evento?.buckets || [];
    const modified = eventos.find((e) => e.key === "modified")?.doc_count || 0;
    const added = eventos.find((e) => e.key === "added")?.doc_count || 0;
    const deleted = eventos.find((e) => e.key === "deleted")?.doc_count || 0;

    return {
      agente: agente.key,
      total_alertas: total,
      severidades: agente.por_severidade.buckets,
      nivel_risco: nivel,
      score: Math.round(score * 100),
      modified,
      added,
      deleted,
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

// --- TOP PAÍSES DE ORIGEM (Fortigate/Wazuh) ---
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
        filter: [{ range: { "rule.level": { gte: 1, lte: 15 } } }],
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
                { from: 0, to: 6, key: "Baixo" },
                { from: 7, to: 11, key: "Médio" },
                { from: 12, to: 14, key: "Alto" },
                { from: 15, key: "Crítico" },
              ],
            },
          },
        },
      },
      top_destinos: {
        terms: { field: "data.dstip", size: 10, order: { _count: "desc" } },
        aggs: {
          agentes: { terms: { field: "agent.name", size: 1 } },
          origens: {
            terms: { field: "data.srcip", size: 10 },
            aggs: {
              pais_origem: { terms: { field: "GeoLocation.country_name", size: 1 } },
              cidade_origem: { terms: { field: "GeoLocation.city_name", size: 1 } },
              location: { top_hits: { size: 1, _source: ["GeoLocation.location"] } },
              srcport: { terms: { field: "data.srcport", size: 1 } },
              servico: { terms: { field: "data.service", size: 1 } },
              interface: { terms: { field: "data.srcintf", size: 1 } },
            }
          },
          dstintf: { terms: { field: "data.dstintf", size: 1 } },
          dstport: { terms: { field: "data.dstport", size: 1 } },
          devname: { terms: { field: "data.devname", size: 1 } },
          pais_destino: { terms: { field: "GeoLocation.country_name", size: 1 } },
          cidade_destino: { terms: { field: "GeoLocation.city_name", size: 1 } },
          location: { top_hits: { size: 1, _source: ["GeoLocation.location"] } },
          severidade: {
            range: {
              field: "rule.level",
              ranges: [
                { from: 0, to: 6, key: "Baixo" },
                { from: 7, to: 11, key: "Médio" },
                { from: 12, to: 14, key: "Alto" },
                { from: 15, key: "Crítico" },
              ],
            },
          },
        },
      },
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-archives-*/_search`,
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
    ...(response.data.aggregations?.top_destinos?.buckets || []).map((b) => {
      const loc = b.location?.hits?.hits?.[0]?._source?.GeoLocation?.location;
      const ip = b.key;

      return {
        tipo: "destino",
        destino: ip,
        total: b.doc_count,
        agente: b.agentes?.buckets?.[0]?.key || null,
        pais: isPrivateIp(ip) ? "Interno" : b.pais_destino?.buckets?.[0]?.key || null,
        cidade: isPrivateIp(ip) ? null : b.cidade_destino?.buckets?.[0]?.key || null,
        lat: loc?.lat ?? null,
        lng: loc?.lon ?? null,
        dstintf: b.dstintf?.buckets?.[0]?.key || null,
        dstport: b.dstport?.buckets?.[0]?.key || null,
        devname: b.devname?.buckets?.[0]?.key || null,
        severidades: (b.severidade?.buckets ?? []).map((s) => ({
          key: s.key,
          doc_count: s.doc_count,
        })),
        origens: (b.origens?.buckets ?? []).map((o) => {
          const loc = o.location?.hits?.hits?.[0]?._source?.GeoLocation?.location;
          const ipOrigem = o.key;

          return {
            ip: ipOrigem,
            total: o.doc_count,
            pais: isPrivateIp(ipOrigem) ? "Interno" : o.pais_origem?.buckets?.[0]?.key || null,
            cidade: isPrivateIp(ipOrigem) ? null : o.cidade_origem?.buckets?.[0]?.key || null,
            lat: loc?.lat ?? null,
            lng: loc?.lon ?? null,
            srcport: o.srcport?.buckets?.[0]?.key || null,
            servico: o.servico?.buckets?.[0]?.key || null,
            interface: o.interface?.buckets?.[0]?.key || null,
          };
        }),
      };
    }),
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
      { field: "data.vulnerability.detected_at", format: "date_time" },
      { field: "data.vulnerability.published_at", format: "date_time" },
      { field: "package.installed", format: "date_time" }
    ],
    _source: { excludes: [] },
    query: {
      bool: {
        must: [
          { match_phrase: { location: "vulnerability-detector" } },
          { match_phrase: { customer: clientName } }
          // ❌ removido o "status: Solved"
        ],
        filter: []
      }
    },
    aggs: {
      severity: {
        filters: {
          filters: {
            Pending: {
              bool: {
                filter: [
                  { term: { "data.vulnerability.under_evaluation": true } }
                ]
              }
            },
            Critical: {
              bool: {
                filter: [
                  { match_phrase: { "data.vulnerability.severity": "Critical" } }
                ]
              }
            },
            High: {
              bool: {
                filter: [
                  { match_phrase: { "data.vulnerability.severity": "High" } }
                ]
              }
            },
            Medium: {
              bool: {
                filter: [
                  { match_phrase: { "data.vulnerability.severity": "Medium" } }
                ]
              }
            },
            Low: {
              bool: {
                filter: [
                  { match_phrase: { "data.vulnerability.severity": "Low" } }
                ]
              }
            }
          }
        }
      },
      total: { filter: { exists: { field: "data.vulnerability" } } }
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

  const buckets =
    response.data?.aggregations?.severity?.buckets ??
    response.data?.severity?.buckets ??
    {};

  const total =
    response.data?.aggregations?.total?.doc_count ??
    response.data?.total?.doc_count ??
    0;

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
  const dias = opts?.dias ?? "todos"; // padrão 30 dias

  // 🔹 Corrigido para campos reais no Wazuh
  const field =
    by === "package"
      ? "data.vulnerability.package.name"
      : by === "agent"
        ? "agent.name"
        : "data.vulnerability.cve";

  const timeFilter =
    dias !== "todos"
      ? {
        range: {
          "@timestamp": {
            gte: `now-${dias}d`,
            lte: "now"
          }
        }
      }
      : { match_all: {} };

  const body: any = {
    size: 0,
    stored_fields: ["*"],
    script_fields: {},
    docvalue_fields: [
      { field: "data.vulnerability.detected_at", format: "date_time" },
      { field: "data.vulnerability.published_at", format: "date_time" },
      { field: "package.installed", format: "date_time" }
    ],
    _source: { excludes: [] },
    query: {
      bool: {
        must: [
          { match_phrase: { location: "vulnerability-detector" } },
          { match_phrase: { customer: clientName } },
          // status opcional, se quiser incluir só solucionadas:
          // { match_phrase: { "data.vulnerability.status": "Solved" } }
        ],
        filter: [timeFilter]
      }
    },
    aggs: {
      top_vulns: {
        terms: { field, size, order: { _count: "desc" } },
        aggs: {
          por_severidade: {
            terms: { field: "data.vulnerability.severity" }
          }
        }
      }
    }
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search?filter_path=aggregations.top_vulns.buckets`,
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
  const dias = opts?.dias ?? "todos"; // padrão 30 dias

  const timeFilter =
    dias !== "todos"
      ? {
        range: {
          "@timestamp": {
            gte: `now-${dias}d`,
            lte: "now"
          }
        }
      }
      : { match_all: {} };

  // 1️⃣ Etapa 1 — Buscar vulnerabilidades e coletar agent.id
  const bodyVuln = {
    size: 0,
    query: {
      bool: {
        must: [
          { match_phrase: { location: "vulnerability-detector" } },
          { match_phrase: { customer: clientName } },
          // { match_phrase: { "data.vulnerability.status": "Solved" } }
        ],
        filter: [timeFilter]
      }
    },
    aggs: {
      top_agents: {
        terms: { field: "agent.id", size: 1000, order: { _count: "desc" } },
        aggs: {
          por_severidade: {
            terms: { field: "data.vulnerability.severity" }
          }
        }
      }
    }
  };

  const resVuln = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search?filter_path=aggregations.top_agents.buckets`,
    bodyVuln,
    {
      headers: authHeader(tenant),
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    }
  );

  const agentsBuckets = resVuln.data?.aggregations?.top_agents?.buckets ?? [];
  const agentIds = agentsBuckets.map((b: any) => b.key).filter(Boolean);

  if (!agentIds.length) return [];

  // 2️⃣ Etapa 2 — Buscar OS de cada agente
  const bodyOS = {
    size: 1000,
    _source: ["agent.id", "host.os.full"],
    query: {
      bool: {
        must: [
          { terms: { "agent.id": agentIds } },
          { exists: { field: "host.os.full" } }
        ]
      }
    }
  };

  const resOS = await axios.post(
    `${tenant.wazuh_url}/wazuh-monitoring-*/_search`,
    bodyOS,
    {
      headers: authHeader(tenant),
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    }
  );

  const hitsOS = resOS.data?.hits?.hits ?? [];
  const osMap: Record<string, string> = {};
  for (const h of hitsOS) {
    const agentId = h._source?.agent?.id;
    const osName = h._source?.host?.os?.full;
    if (agentId && osName) osMap[agentId] = osName;
  }

  // 3️⃣ Etapa 3 — Montar resultado agrupando por nome do OS
  const osAgg: Record<
    string,
    { total: number; severity: Record<string, number> }
  > = {};

  for (const b of agentsBuckets) {
    const agentId = b.key;
    const osName = osMap[agentId] ?? "Desconhecido";
    const sev: Record<string, number> = {};
    for (const s of b?.por_severidade?.buckets ?? []) {
      sev[s.key] = Number(s.doc_count || 0);
    }

    if (!osAgg[osName]) {
      osAgg[osName] = { total: 0, severity: {} };
    }

    osAgg[osName].total += Number(b.doc_count || 0);
    for (const [k, v] of Object.entries(sev)) {
      osAgg[osName].severity[k] = (osAgg[osName].severity[k] || 0) + v;
    }
  }

  // 4️⃣ Retornar os top sistemas operacionais
  const sorted = Object.entries(osAgg)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, size);

  return sorted.map(([os, data]) => ({
    os,
    total: data.total,
    severity: data.severity
  }));
}


export async function buscarTopAgentesVulnerabilidades(
  tenant: any,
  opts?: { size?: number; dias?: string }
): Promise<TopAgentItem[]> {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const size = Number(opts?.size ?? 5);
  const dias = opts?.dias ?? "todos"; // padrão 30 dias

  const timeFilter =
    dias !== "todos"
      ? {
        range: {
          "@timestamp": {
            gte: `now-${dias}d`,
            lte: "now"
          }
        }
      }
      : { match_all: {} };

  const body: any = {
    size: 0,
    stored_fields: ["*"],
    script_fields: {},
    docvalue_fields: [
      { field: "data.vulnerability.detected_at", format: "date_time" },
      { field: "data.vulnerability.published_at", format: "date_time" },
      { field: "package.installed", format: "date_time" }
    ],
    _source: { excludes: [] },
    query: {
      bool: {
        must: [
          { match_phrase: { location: "vulnerability-detector" } },
          { match_phrase: { customer: clientName } },
          // { match_phrase: { "data.vulnerability.status": "Solved" } }
        ],
        filter: [timeFilter]
      }
    },
    aggs: {
      top_agents: {
        terms: {
          field: "agent.name",
          size,
          order: { _count: "desc" },
          missing: "N/A"
        },
        aggs: {
          por_severidade: {
            terms: { field: "data.vulnerability.severity" }
          }
        }
      }
    }
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search?filter_path=aggregations.top_agents.buckets`,
    body,
    {
      headers: authHeader(tenant),
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    }
  );

  const buckets = response.data?.aggregations?.top_agents?.buckets ?? [];

  return buckets.map((b: any) => {
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
  const dias = opts?.dias ?? "todos"; // padrão 30 dias

  const timeFilter =
    dias !== "todos"
      ? {
        range: {
          "@timestamp": {
            gte: `now-${dias}d`,
            lte: "now"
          }
        }
      }
      : { match_all: {} };

  const body: any = {
    size: 0,
    stored_fields: ["*"],
    script_fields: {},
    docvalue_fields: [
      { field: "data.vulnerability.detected_at", format: "date_time" },
      { field: "data.vulnerability.published_at", format: "date_time" },
      { field: "package.installed", format: "date_time" }
    ],
    _source: { excludes: [] },
    query: {
      bool: {
        must: [
          { match_phrase: { location: "vulnerability-detector" } },
          { match_phrase: { customer: clientName } },
          // { match_phrase: { "data.vulnerability.status": "Solved" } }
        ],
        filter: [timeFilter]
      }
    },
    aggs: {
      top_packages: {
        terms: {
          field: "data.vulnerability.package.name",
          size,
          order: { _count: "desc" },
          missing: "N/A"
        },
        aggs: {
          por_severidade: {
            terms: { field: "data.vulnerability.severity" }
          }
        }
      }
    }
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search?filter_path=aggregations.top_packages.buckets`,
    body,
    {
      headers: authHeader(tenant),
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    }
  );

  const buckets = response.data?.aggregations?.top_packages?.buckets ?? [];

  return buckets.map((b: any) => {
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

  const size = Number(opts?.size ?? 10); // padrão 10
  const dias = opts?.dias ?? "todos"; // padrão 30 dias

  const timeFilter =
    dias !== "todos"
      ? {
        range: {
          "@timestamp": {
            gte: `now-${dias}d`,
            lte: "now"
          }
        }
      }
      : { match_all: {} };

  const body: any = {
    size: 0,
    stored_fields: ["*"],
    script_fields: {},
    docvalue_fields: [
      { field: "data.vulnerability.detected_at", format: "date_time" },
      { field: "data.vulnerability.published_at", format: "date_time" },
      { field: "package.installed", format: "date_time" }
    ],
    _source: { excludes: [] },
    query: {
      bool: {
        must: [
          { match_phrase: { location: "vulnerability-detector" } },
          { match_phrase: { customer: clientName } },
          // { match_phrase: { "data.vulnerability.status": "Solved" } }
        ],
        filter: [timeFilter]
      }
    },
    aggs: {
      top_scores: {
        terms: {
          field: "data.vulnerability.score.base",
          size,
          order: { _count: "desc" },
          missing: "N/A"
        }
      }
    }
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search?filter_path=aggregations.top_scores.buckets`,
    body,
    {
      headers: authHeader(tenant),
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    }
  );

  const buckets = response.data?.aggregations?.top_scores?.buckets ?? [];

  return buckets.map((b: any) => ({
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

  const dias = opts?.dias ?? "todos"; // padrão 30 dias

  const timeFilter =
    dias !== "todos"
      ? {
        range: {
          "@timestamp": {
            gte: `now-${dias}d`,
            lte: "now"
          }
        }
      }
      : { match_all: {} };

  const body: any = {
    size: 0,
    stored_fields: ["*"],
    script_fields: {},
    docvalue_fields: [
      { field: "@timestamp", format: "date_time" },
      { field: "data.vulnerability.detected_at", format: "date_time" }
    ],
    _source: { excludes: [] },
    query: {
      bool: {
        must: [
          { match_phrase: { location: "vulnerability-detector" } },
          { match_phrase: { customer: clientName } },
          // { match_phrase: { "data.vulnerability.status": "Solved" } }
        ],
        filter: [timeFilter]
      }
    },
    aggs: {
      por_ano: {
        date_histogram: {
          field: "@timestamp", // 👈 corrigido para usar o campo real existente
          calendar_interval: "1y",
          time_zone: "America/Sao_Paulo",
          format: "yyyy",
          min_doc_count: 1
        },
        aggs: {
          por_severidade: {
            terms: {
              field: "data.vulnerability.severity",
              order: { _count: "desc" },
              size: 5
            }
          }
        }
      }
    }
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search?filter_path=aggregations.por_ano.buckets`,
    body,
    {
      headers: authHeader(tenant),
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
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
          fixed_interval: "30m", // 👈 1 ponto por dia
          time_zone: "America/Sao_Paulo",
          min_doc_count: 1,
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

  // 🔹 Pega os buckets da agregação
  const buckets = response.data?.aggregations?.por_dia?.buckets ?? [];

  // 🔹 Limita a quantidade de pontos no gráfico
  const MAX_PONTOS = 30;
  const bucketsLimitados = buckets.slice(-MAX_PONTOS);

  // 🔹 Formata labels com dia + hora + minuto (como antes)
  const labels: string[] = bucketsLimitados.map((b: any) => {
    const d = new Date(b.key_as_string);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  // 🔹 Totais de alertas por intervalo
  const values: number[] = bucketsLimitados.map((b: any) => b.doc_count ?? 0);

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