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

export async function buscarSeveridadeIndexer(tenant) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const body = {
    size: 0,
    query: {
      bool: {
        must: [
          customerFilter(clientName),
          {
            range: {
              "@timestamp": { gte: "now-24h", lte: "now" },
            },
          },
        ],
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
    { headers: authHeader(tenant), httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
  );

  return response.data.aggregations?.severidade?.buckets || [];
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

export async function buscarTopAgentes(tenant, dias) {
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
      top_agentes_alertas: {
        terms: { field: "agent.name", size: 9 },
        aggs: { por_severidade: { terms: { field: "rule.level" } } },
      },
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant), httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
  );

  return (response.data.aggregations?.top_agentes_alertas?.buckets || []).map((agente) => {
    const total = agente.por_severidade.buckets.reduce((sum, item) => sum + item.doc_count, 0);
    const score =
      agente.por_severidade.buckets.reduce((acc, item) => {
        const peso =
          item.key >= 0 && item.key <= 6 ? 0.2 : item.key <= 11 ? 0.6 : item.key <= 14 ? 0.87 : 1.0;
        return acc + item.doc_count * peso;
      }, 0) / (total || 1);

    let nivel;
    if (score >= 1.0) nivel = "Crítico";
    else if (score >= 0.87) nivel = "Alto";
    else if (score >= 0.6) nivel = "Médio";
    else nivel = "Baixo";

    return { agente: agente.key, total_alertas: total, severidades: agente.por_severidade.buckets, nivel_risco: nivel, score: Math.round(score * 100) };
  });
}

export async function buscarTopAgentesCis(tenant, dias) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const timeFilter =
    dias === "todos"
      ? { match_all: {} }
      : { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } };

  const body = {
    size: 0,
    query: { bool: { must: [customerFilter(clientName), timeFilter, { term: { "rule.groups": "sca" } }] } },
    aggs: {
      agentes: {
        terms: { field: "agent.name", size: 14, order: { media_score: "asc" } },
        aggs: { media_score: { avg: { field: "rule.level" } } },
      },
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant), httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
  );

  return (response.data.aggregations?.agentes?.buckets || []).map((b) => {
    const media = Number(b?.media_score?.value ?? 0);
    const score_percent = Math.max(0, Math.min(100, Math.round((media / 15) * 100)));
    return { agente: b.key, total_eventos: b.doc_count, media_score: media, score_cis_percent: score_percent };
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
        must: [customerFilter(clientName), timeFilter, { term: { "rule.groups": "fortigate" } }],
        must_not: [{ terms: { "data.srccountry": ["Reserved", "Unknown", "N/A", "-", ""] } }],
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
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant), httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
  );

  return (response.data.aggregations?.top_countries?.buckets || []).map((b) => ({
    pais: b.key,
    total: b.doc_count,
    severidades: (b.severidade?.buckets ?? []).map((s) => ({ key: s.key, doc_count: s.doc_count })),
  }));
}

export async function buscarVulnSeveridades(tenant) {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const body = {
    size: 0,
    query: { bool: { must: [customerFilter(clientName), { exists: { field: "data.vulnerability" } }] } },
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
      total: { filter: { exists: { field: "data.vulnerability" } } },
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search?filter_path=aggregations.*`,
    body,
    { headers: authHeader(tenant), httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
  );

  return response.data?.aggregations || {};
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
    by === "package" ? "data.vulnerability.package.name" :
      by === "agent" ? "agent.name" :
        "data.vulnerability.cve";

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
          { exists: { field: "data.vulnerability" } },
          ...(timeFilter ? [timeFilter] : []),
        ],
      },
    },
    aggs: {
      top_vulns: {
        terms: { field, size, order: { _count: "desc" } },
        aggs: { por_severidade: { terms: { field: "data.vulnerability.severity" } } },
      },
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant), httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
  );

  const buckets = response.data?.aggregations?.top_vulns?.buckets ?? [];
  return buckets.map((b: any) => {
    const sev: Record<string, number> = {};
    for (const s of b?.por_severidade?.buckets ?? []) sev[s.key] = Number(s.doc_count || 0);
    return { key: String(b.key ?? ""), total: Number(b.doc_count ?? 0), severity: sev };
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
      : null;

  const body: any = {
    size: 0,
    query: {
      bool: {
        must: [
          customerFilter(clientName),
          { exists: { field: "data.vulnerability" } },
          { match_phrase: { "data.vulnerability.package.source": "OS" } },
          ...(timeFilter ? [timeFilter] : []),
        ],
      },
    },
    aggs: {
      top_os: {
        terms: { field: "data.vulnerability.package.name", size, order: { _count: "desc" } },
        aggs: { por_severidade: { terms: { field: "data.vulnerability.severity" } } },
      },
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant), httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
  );

  return (response.data?.aggregations?.top_os?.buckets ?? []).map((b: any) => {
    const sev: Record<string, number> = {};
    for (const s of b?.por_severidade?.buckets ?? []) sev[s.key] = Number(s.doc_count || 0);
    return { os: String(b.key ?? "Desconhecido"), total: Number(b.doc_count ?? 0), severity: sev };
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
      : null;

  const body: any = {
    size: 0,
    query: { bool: { must: [customerFilter(clientName), { exists: { field: "data.vulnerability" } }, ...(timeFilter ? [timeFilter] : [])] } },
    aggs: {
      top_agents: {
        terms: { field: "agent.name", size, order: { _count: "desc" } },
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
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant), httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
  );

  return (response.data?.aggregations?.top_agents?.buckets ?? []).map((b: any) => {
    const sev: Record<string, number> = {};
    for (const [key, val] of Object.entries(b?.severity?.buckets ?? {})) {
      sev[key] = Number((val as any)?.doc_count || 0);
    }
    return { agent: String(b.key ?? "Desconhecido"), total: Number(b.doc_count ?? 0), severity: sev };
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
      : null;

  const body: any = {
    size: 0,
    query: {
      bool: {
        must: [customerFilter(clientName), { exists: { field: "data.vulnerability" } }, ...(timeFilter ? [timeFilter] : [])],
        must_not: [{ match_phrase: { "data.vulnerability.package.source": "OS" } }],
      },
    },
    aggs: {
      top_packages: {
        terms: { field: "data.vulnerability.package.name", size, order: { _count: "desc" } },
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
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant), httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
  );

  return (response.data?.aggregations?.top_packages?.buckets ?? []).map((b: any) => {
    const sev: Record<string, number> = {};
    for (const [key, val] of Object.entries(b?.severity?.buckets ?? {})) {
      sev[key] = Number((val as any)?.doc_count || 0);
    }
    return { package: String(b.key ?? "Desconhecido"), total: Number(b.doc_count ?? 0), severity: sev };
  });
}

export async function buscarTopScoresVulnerabilidades(
  tenant: any,
  opts?: { size?: number; dias?: string }
): Promise<TopScoreItem[]> {
  const clientName = tenant.wazuh_client_name;
  if (!clientName) throw new Error("Tenant sem client_name definido");

  const size = Number(opts?.size ?? 5);
  const dias = opts?.dias ?? "todos";

  const timeFilter =
    dias !== "todos"
      ? { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } }
      : null;

  const body: any = {
    size: 0,
    query: { bool: { must: [customerFilter(clientName), { exists: { field: "data.vulnerability.score.base" } }, ...(timeFilter ? [timeFilter] : [])] } },
    aggs: { top_scores: { terms: { field: "data.vulnerability.score.base", size, order: { _count: "desc" } } } },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant), httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
  );

  return (response.data?.aggregations?.top_scores?.buckets ?? []).map((b: any) => ({
    score: String(b.key ?? "Desconhecido"),
    total: Number(b.doc_count ?? 0),
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
      : null;

  const body: any = {
    size: 0,
    query: { bool: { must: [customerFilter(clientName), { exists: { field: "data.vulnerability.published" } }, ...(timeFilter ? [timeFilter] : [])] } },
    aggs: {
      por_ano: {
        date_histogram: { field: "data.vulnerability.published", calendar_interval: "year", format: "yyyy", min_doc_count: 1 },
        aggs: { por_severidade: { terms: { field: "data.vulnerability.severity" } } },
      },
    },
  };

  const response = await axios.post(
    `${tenant.wazuh_url}/wazuh-*/_search`,
    body,
    { headers: authHeader(tenant), httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
  );

  return (response.data?.aggregations?.por_ano?.buckets ?? []).map((b: any) => {
    const sev: Record<string, number> = {};
    for (const s of b?.por_severidade?.buckets ?? []) sev[s.key] = Number(s.doc_count || 0);
    return { ano: String(b.key_as_string ?? "Desconhecido"), total: Number(b.doc_count ?? 0), severity: sev };
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
      ? { range: { "@timestamp": { gte: `now-${dias}d`, lte: "now" } } }
      : null;

  const body: any = {
    size: 0,
    query: {
      bool: {
        must: [customerFilter(clientName), ...(timeFilter ? [timeFilter] : [])],
      },
    },
    aggs: {
      por_dia: {
        date_histogram: {
          field: "@timestamp",
          fixed_interval: "1d",
          min_doc_count: 0,
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

  // 🔹 Valores totais de alertas por dia
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
      rules: {
        terms: {
          field: "rule.description", // 👈 sem .keyword
          size: 10,
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

  return (response.data?.aggregations?.rules?.buckets ?? []).map((b: any) => ({
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
