import axios from "axios";

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

export async function buscarFirewalls(tenant: any) {
  try {
    const cfg = tenant.zabbix_config;
    if (!cfg?.enabled) return [];

    const host = cfg.zabbix_url
      ?.replace("http://", "")
      .replace("https://", "")
      .trim();

    const url = `http://${host}/zabbix/api_jsonrpc.php`;
    const token = cfg.zabbix_token;

    // 1. Buscar template class=firewall
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

    // 2. Buscar hosts
    const hosts = await zabbixRequest(url, token, "host.get", {
      output: ["hostid", "name"],
      selectInterfaces: ["ip", "available"],
      templateids,
      status: 0,
    });

    if (!Array.isArray(hosts) || !hosts.length) return [];

    const fwMap = new Map<
      string,
      {
        id: string;
        name: string;
        ip: string | null;
        online: boolean;
        availability: string;
        cpu: number | null;
        ramTotal: number | null;
        ramAvailable: number | null;
        processes: number | null;
        sessions: number | null;
        trafficIn: number | null;
        trafficOut: number | null;
      }
    >();

    for (const h of hosts) {
      const iface = h.interfaces?.[0];

      let availability = "unknown";
      if (iface?.available === "1") availability = "online";
      if (iface?.available === "2") availability = "offline";

      fwMap.set(h.hostid, {
        id: h.hostid,
        name: h.name,
        ip: iface?.ip || null,
        online: availability === "online",
        availability,
        cpu: null,
        ramTotal: null,
        ramAvailable: null,
        processes: null,
        sessions: null,
        trafficIn: null,
        trafficOut: null,
      });
    }

    const hostids = Array.from(fwMap.keys());

    // 3. CPU
    const cpuItems = await zabbixRequest(url, token, "item.get", {
      hostids,
      search: { name: "CPU utilization" },
      output: ["lastvalue"],
      selectHosts: ["hostid"],
    });

    for (const c of cpuItems) {
      const hostInfo = c.hosts?.[0];
      if (!hostInfo) continue;

      const acc = fwMap.get(hostInfo.hostid);
      if (!acc) continue;

      const value = Number(c.lastvalue);
      acc.cpu = Number.isNaN(value) ? null : value;
    }

    // 4. RAM REAL FortiGate
    const ramItems = await zabbixRequest(url, token, "item.get", {
      hostids,
      filter: {
        key_: [
          "vm.memory.total[fgSysMemCapacity.0]",
          "vm.memory.available[fgSysMemFree.0]",
        ],
      },
      output: ["hostid", "key_", "lastvalue"],
    });

    for (const item of ramItems) {
      const acc = fwMap.get(item.hostid);
      if (!acc) continue;

      const value = Number(item.lastvalue);
      if (Number.isNaN(value)) continue;

      if (item.key_ === "vm.memory.total[fgSysMemCapacity.0]") {
        acc.ramTotal = value;
      }

      if (item.key_ === "vm.memory.available[fgSysMemFree.0]") {
        acc.ramAvailable = value;
      }
    }

    // 5. Processos
    const procItems = await zabbixRequest(url, token, "item.get", {
      hostids,
      search: { key_: "proc.num" },
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

    // 6. Sessões
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

    // 7. TRÁFEGO WAN (port1)
    const trafficItems = await zabbixRequest(url, token, "item.get", {
      hostids,
      filter: {
        key_: [
          "net.if.in[ifHCInOctets.1]",
          "net.if.out[ifHCOutOctets.1]",
        ],
      },
      output: ["hostid", "key_", "lastvalue"],
    });

    for (const item of trafficItems) {
      const acc = fwMap.get(item.hostid);
      if (!acc) continue;

      const bytes = Number(item.lastvalue);
      if (Number.isNaN(bytes)) continue;

      const mbps = (bytes * 8) / 1_000_000;

      if (item.key_.includes("ifHCInOctets")) {
        acc.trafficIn = Number(mbps.toFixed(2));
      }

      if (item.key_.includes("ifHCOutOctets")) {
        acc.trafficOut = Number(mbps.toFixed(2));
      }
    }

    // 8. Retorno final
    return Array.from(fwMap.values()).map((fw) => {
      const total = fw.ramTotal ?? 0;
      const available = fw.ramAvailable ?? 0;
      const used = total > 0 ? total - available : 0;

      const percent =
        total > 0
          ? Number(((used / total) * 100).toFixed(2))
          : 0;

      return {
        id: fw.id,
        name: fw.name,
        ip: fw.ip,
        online: fw.online,
        availability: fw.availability,

        cpu: fw.cpu,

        ram_total_bytes: total,
        ram_available_bytes: available,
        ram_used_bytes: used,
        ram_used_percent: percent,

        processes: fw.processes,
        sessions: fw.sessions,

        traffic_in_mbps: fw.trafficIn,
        traffic_out_mbps: fw.trafficOut,
        traffic_total_mbps:
          (fw.trafficIn ?? 0) + (fw.trafficOut ?? 0),
      };
    });

  } catch (err) {
    throw err;
  }
}
