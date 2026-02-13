/**
 * Serviço de integração com Zabbix via JSON-RPC utilizando API Token (Bearer)
 *
 * Responsabilidade:
 * - Identificar hosts com class=firewall (via template tag)
 * - Determinar status real do monitoramento
 * - Trazer uso de RAM + processos + sessões
 */

import axios from "axios";

/**
 * Função utilitária para chamadas JSON-RPC ao Zabbix
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
 * Busca firewalls monitorados no Zabbix
 */
export async function buscarFirewalls(tenant: any) {
  try {
    const cfg = tenant.zabbix_config;

    if (!cfg?.enabled) {
      return [];
    }

    // 🔹 baseline visual de RAM (4GB)
    const RAM_BASELINE_BYTES = 4 * 1024 * 1024 * 1024;

    // Normalização da URL
    const host = cfg.zabbix_url
      ?.replace("http://", "")
      .replace("https://", "")
      .trim();

    const url = `http://${host}/zabbix/api_jsonrpc.php`;
    const token = cfg.zabbix_token;

    /**
     * Buscar templates com class=firewall
     */
    const templates = await zabbixRequest(url, token, "template.get", {
      output: ["templateid"],
      tags: [
        {
          tag: "class",
          value: "firewall",
          operator: 1,
        },
      ],
    });

    const templateids = templates.map((t: any) => t.templateid);

    if (!templateids.length) return [];

    /**
     * Buscar hosts vinculados aos templates firewall
     */
    const hosts = await zabbixRequest(url, token, "host.get", {
      output: ["hostid", "name", "status"],
      selectInterfaces: "extend",
      templateids,
      status: 0, // apenas ativos
    });

    if (!Array.isArray(hosts) || !hosts.length) return [];

    /**
     * Mapa base
     */
    const fwMap = new Map<
      string,
      {
        id: string;
        name: string;
        ip: string | null;
        online: boolean;
        availability: string;
        ramAvailable: number | null;
        processes: number | null;
        sessions: number | null;
      }
    >();

    for (const h of hosts) {
      const snmp = h.interfaces?.find((i: any) => i.type === "2");
      const available = snmp?.available;

      fwMap.set(h.hostid, {
        id: h.hostid,
        name: h.name,
        ip: snmp?.ip || null,
        online: available === "1",
        availability:
          available === "1"
            ? "online"
            : available === "2"
              ? "offline"
              : "unknown",
        ramAvailable: null,
        processes: null,
        sessions: null,
      });
    }

    const hostids = Array.from(fwMap.keys());

    /**
     * RAM disponível (Fortigate SNMP)
     */
    const ramItems = await zabbixRequest(url, token, "item.get", {
      hostids,
      filter: {
        key_: ["vm.memory.available[fgSysMemFree.0]"],
      },
      output: ["lastvalue"],
      selectHosts: ["hostid"],
    });

    for (const r of ramItems) {
      const hostInfo = r.hosts?.[0];
      if (!hostInfo) continue;

      const acc = fwMap.get(hostInfo.hostid);
      if (!acc) continue;

      const value = Number(r.lastvalue);
      acc.ramAvailable = Number.isNaN(value) ? null : value;
    }

    /**
     * PROCESSOS (proc.num)
     */
    const procItems = await zabbixRequest(url, token, "item.get", {
      hostids,
      search: {
        key_: "proc.num",
      },
      output: ["lastvalue"],
      selectHosts: ["hostid"],
    });

    for (const p of procItems) {
      const hostInfo = p.hosts?.[0];
      if (!hostInfo) continue;

      const acc = fwMap.get(hostInfo.hostid);
      if (!acc) continue;

      const value = Number(p.lastvalue);
      acc.processes = Number.isNaN(value) ? null : value;
    }

    /**
     * Sessões ativas
     */
    const sessionItems = await zabbixRequest(url, token, "item.get", {
      hostids,
      filter: {
        key_: ["net.ipv4.sessions[fgSysSesCount.0]"],
      },
      output: ["lastvalue"],
      selectHosts: ["hostid"],
    });

    for (const s of sessionItems) {
      const hostInfo = s.hosts?.[0];
      if (!hostInfo) continue;

      const acc = fwMap.get(hostInfo.hostid);
      if (!acc) continue;

      const value = Number(s.lastvalue);
      acc.sessions = Number.isNaN(value) ? null : value;
    }

    /**
     * Retorno final (compatível com os cards)
     */
    return Array.from(fwMap.values()).map((fw) => {
      const total = RAM_BASELINE_BYTES;

      const available =
        fw.ramAvailable !== null
          ? Math.min(fw.ramAvailable, total)
          : total;

      const used = Math.max(0, total - available);
      const percent = Number(((used / total) * 100).toFixed(2));

      return {
        id: fw.id,
        name: fw.name,
        ip: fw.ip,
        online: fw.online,
        availability: fw.availability,

        // RAM
        ram_total_bytes: total,
        ram_available_bytes: available,
        ram_used_bytes: used,
        ram_used_percent: percent,

        // PROCESSOS
        processes: fw.processes,
        sessions: fw.sessions,
      };
    });
  } catch (err) {
    throw err;
  }
}
