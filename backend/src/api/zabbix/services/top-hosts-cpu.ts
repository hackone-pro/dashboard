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

function getHostIdFromItem(item: any): string | null {
  // alguns retornam hostid direto
  if (item?.hostid) return String(item.hostid);
  // outros retornam via hosts[]
  const h = item?.hosts?.[0]?.hostid;
  return h ? String(h) : null;
}

export async function buscarTopHostsCPU(tenant: any, limit = 5) {
  const cfg = tenant.zabbix_config;
  if (!cfg?.enabled) return [];

  const host = cfg.zabbix_url
    ?.replace("http://", "")
    .replace("https://", "")
    .trim();

  const url = `http://${host}/zabbix/api_jsonrpc.php`;
  const token = cfg.zabbix_token;

  const now = Math.floor(Date.now() / 1000);

  const classesDesejadas = ["firewall", "roteador", "servidor", "switch"];

  /* =====================================================
     1) Templates por class (igual ativos)
  ===================================================== */
  let templateids: string[] = [];

  for (const className of classesDesejadas) {
    const templates = await zabbixRequest(url, token, "template.get", {
      output: ["templateid"],
      tags: [{ tag: "class", value: className, operator: 1 }],
    });

    templateids.push(...templates.map((t: any) => String(t.templateid)));
  }

  if (!templateids.length) return [];

  /* =====================================================
     2) Hosts vinculados aos templates
  ===================================================== */
  const hosts = await zabbixRequest(url, token, "host.get", {
    output: ["hostid", "name"],
    status: 0,
    templateids,
  });

  if (!Array.isArray(hosts) || !hosts.length) return [];

  const hostids = hosts.map((h: any) => String(h.hostid));

  const hostsMap = new Map<
    string,
    {
      hostid: string;
      name: string;

      cpu: number | null;

      // fallback CPU idle
      somaIdle: number;
      countIdle: number;

      processes: number | null;

      ramTotalBytes: number | null;
      ramAvailableBytes: number | null;
    }
  >();

  for (const h of hosts) {
    hostsMap.set(String(h.hostid), {
      hostid: String(h.hostid),
      name: h.name,

      cpu: null,

      somaIdle: 0,
      countIdle: 0,

      processes: null,

      ramTotalBytes: null,
      ramAvailableBytes: null,
    });
  }

  /* =====================================================
     3) CPU (primeiro tenta "CPU utilization" igual firewall)
        se não achar, faz fallback: system.cpu.util[,idle] + history
  ===================================================== */

  // 3.1 CPU utilization (lastvalue)
  const cpuUtilItems = await zabbixRequest(url, token, "item.get", {
    hostids,
    search: { name: "CPU utilization" },
    output: ["lastvalue"],
    selectHosts: ["hostid"],
  });

  for (const it of cpuUtilItems || []) {
    const hid = getHostIdFromItem(it);
    if (!hid) continue;

    const acc = hostsMap.get(hid);
    if (!acc) continue;

    const v = Number(it.lastvalue);
    if (!Number.isNaN(v)) acc.cpu = v;
  }

  // 3.2 Fallback: idle+history só para quem ficou sem cpu
  const semCpu = Array.from(hostsMap.values())
    .filter((h) => h.cpu === null)
    .map((h) => h.hostid);

  if (semCpu.length) {
    const cpuIdleItems = await zabbixRequest(url, token, "item.get", {
      hostids: semCpu,
      search: { key_: "system.cpu.util[,idle]" },
      output: ["itemid"],
      selectHosts: ["hostid", "name"],
    });

    if (Array.isArray(cpuIdleItems) && cpuIdleItems.length) {
      // history do último minuto
      const history = await zabbixRequest(url, token, "history.get", {
        history: 0,
        itemids: cpuIdleItems.map((i: any) => i.itemid),
        time_from: now - 60,
        output: "extend",
      });

      for (const h of history || []) {
        const item = cpuIdleItems.find((i: any) => i.itemid === h.itemid);
        const hostInfo = item?.hosts?.[0];
        if (!hostInfo) continue;

        const hid = String(hostInfo.hostid);
        const acc = hostsMap.get(hid);
        if (!acc) continue;

        const idle = Number(h.value);
        if (Number.isNaN(idle)) continue;

        acc.somaIdle += idle;
        acc.countIdle += 1;
      }

      // seta cpu a partir do idle médio
      for (const acc of hostsMap.values()) {
        if (acc.cpu !== null) continue;
        if (acc.countIdle > 0) {
          acc.cpu = Number((100 - acc.somaIdle / acc.countIdle).toFixed(2));
        } else {
          acc.cpu = 0;
        }
      }
    } else {
      // se nem idle existir, cpu = 0
      for (const acc of hostsMap.values()) {
        if (acc.cpu === null) acc.cpu = 0;
      }
    }
  }

  /* =====================================================
     4) Processes (robusto: pega proc.num e variações)
        -> usa search key_ "proc.num" (prefixo)
  ===================================================== */
  const procItems = await zabbixRequest(url, token, "item.get", {
    hostids,
    search: { key_: "proc.num" }, // 🔥 busca por prefixo
    output: ["key_", "lastvalue"],
    selectHosts: ["hostid"],
  });

  for (const p of procItems || []) {
    const hid = p.hosts?.[0]?.hostid;
    if (!hid) continue;

    const acc = hostsMap.get(String(hid));
    if (!acc) continue;

    const value = Number(p.lastvalue);
    if (!Number.isNaN(value)) {
      // 🔥 pega apenas o primeiro válido
      if (acc.processes === null) {
        acc.processes = value;
      }
    }
  }

  /* =====================================================
     5) RAM (mantém padrão antigo + inclui FortiGate)
  ===================================================== */
  const ramItems = await zabbixRequest(url, token, "item.get", {
    hostids,
    filter: {
      key_: [
        // padrão antigo (servidores)
        "vm.memory.size[total]",
        "vm.memory.size[available]",

        // fortigate
        "vm.memory.total[fgSysMemCapacity.0]",
        "vm.memory.available[fgSysMemFree.0]",
      ],
    },
    output: ["key_", "lastvalue"],
    selectHosts: ["hostid"],
  });

  for (const r of ramItems || []) {
    const hid = getHostIdFromItem(r);
    if (!hid) continue;

    const acc = hostsMap.get(hid);
    if (!acc) continue;

    const v = Number(r.lastvalue);
    if (Number.isNaN(v)) continue;

    if (
      r.key_ === "vm.memory.size[total]" ||
      r.key_ === "vm.memory.total[fgSysMemCapacity.0]"
    ) {
      acc.ramTotalBytes = v;
    }

    if (
      r.key_ === "vm.memory.size[available]" ||
      r.key_ === "vm.memory.available[fgSysMemFree.0]"
    ) {
      acc.ramAvailableBytes = v;
    }
  }

  /* =====================================================
     6) Retorno final (igual seu formato antigo)
  ===================================================== */
  return Array.from(hostsMap.values())
    .map((h) => {
      let ramUsedGB: number | null = null;
      let ramTotalGB: number | null = null;

      if (
        h.ramTotalBytes !== null &&
        h.ramAvailableBytes !== null &&
        h.ramTotalBytes > 0
      ) {
        const usedBytes = h.ramTotalBytes - h.ramAvailableBytes;

        ramUsedGB = Number(
          ((usedBytes / h.ramTotalBytes) * 100).toFixed(2)
        );

        ramTotalGB = 100;
      }


      return {
        hostid: h.hostid,
        name: h.name,
        cpu: h.cpu ?? 0,
        processes: h.processes,
        ram_used_gb: ramUsedGB,
        ram_total_gb: ramTotalGB,
      };
    })
    .sort((a, b) => (b.cpu ?? 0) - (a.cpu ?? 0))
    .slice(0, limit);
}
