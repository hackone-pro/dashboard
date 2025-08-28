import axios from "axios";
import https from "https";

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
