/**
 * Serviço Zabbix — Ativos por CLASS (tag do template)
 * Classes: firewall, roteador, os
 */

import axios from "axios";

/**
 * Chamada padrão ao Zabbix (JSON-RPC + API Token)
 */
async function zabbixRequest(
  url: string,
  token: string,
  method: string,
  params: any
) {
  const body = {
    jsonrpc: "2.0",
    method,
    params,
    id: 1,
  };

  const response = await axios.post(url, body, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.data.error) {
    throw new Error(
      `Erro Zabbix (${method}): ${JSON.stringify(response.data.error)}`
    );
  }

  return response.data.result;
}

/**
 * Retorna ativos agrupados por CLASS (tag do template)
 */
 export async function buscarAtivosZabbix(tenant: any) {
  const cfg = tenant.zabbix_config;

  if (!cfg?.enabled) {
    return { total: 0, grupos: [] };
  }

  const host = cfg.zabbix_url?.replace(/^https?:\/\//, "").trim();
  const url = `http://${host}/zabbix/api_jsonrpc.php`;
  const token = cfg.zabbix_token;

  const classesDesejadas = ["firewall", "roteador", "servidor", "switch"];

  const nomesPlural: Record<string, string> = {
    firewall: "FIREWALLS",
    roteador: "ROTEADORES",
    servidor: "SERVIDORES",
    switch: "SWITCHS"
  };

  const grupos = [];

  for (const className of classesDesejadas) {

    // Buscar templates da class
    const templates = await zabbixRequest(url, token, "template.get", {
      output: ["templateid"],
      tags: [
        {
          tag: "class",
          value: className,
          operator: 1
        }
      ]
    });

    const templateids = templates.map((t: any) => t.templateid);

    let total = 0;

    // Buscar hosts vinculados aos templates
    if (templateids.length > 0) {
      const hosts = await zabbixRequest(url, token, "host.get", {
        output: ["hostid"],
        templateids
      });

      total = Array.isArray(hosts) ? hosts.length : 0;
    }

    grupos.push({
      groupid: className,
      name: nomesPlural[className] ?? className.toUpperCase(),
      total
    });
  }

  const total = grupos.reduce((sum, g) => sum + g.total, 0);

  return {
    total,
    grupos
  };
}
