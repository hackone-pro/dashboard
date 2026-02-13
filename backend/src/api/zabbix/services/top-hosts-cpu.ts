/**
 * Serviço Zabbix — Top Hosts por CPU (tempo real)
 * Busca TODOS os hosts ativos
 */

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
 
 export async function buscarTopHostsCPU(tenant: any, limit = 3) {
   const cfg = tenant.zabbix_config;
   if (!cfg?.enabled) return [];
 
   const host = cfg.zabbix_url.replace(/^https?:\/\//, "").trim();
   const url = `http://${host}/zabbix/api_jsonrpc.php`;
   const token = cfg.zabbix_token;
 
   const now = Math.floor(Date.now() / 1000);
 
   /**
    * Buscar todos hosts ativos
    */
   const hosts = await zabbixRequest(url, token, "host.get", {
     output: ["hostid", "name"],
     status: 0,
   });
 
   if (!Array.isArray(hosts) || !hosts.length) return [];
 
   const hostids = hosts.map((h: any) => h.hostid);
 
   /**
    * Buscar CPU idle items
    */
   const cpuItems = await zabbixRequest(url, token, "item.get", {
     hostids,
     search: {
       key_: "system.cpu.util[,idle]",
     },
     output: ["itemid"],
     selectHosts: ["hostid", "name"],
   });
 
   if (!Array.isArray(cpuItems) || !cpuItems.length) return [];
 
   /**
    * Inicializar mapa
    */
   const hostsMap = new Map<
     string,
     {
       hostid: string;
       name: string;
       soma: number;
       count: number;
       processes: number | null;
       ramTotalBytes: number | null;
       ramAvailableBytes: number | null;
     }
   >();
 
   for (const item of cpuItems) {
     const hostInfo = item.hosts?.[0];
     if (!hostInfo) continue;
 
     hostsMap.set(hostInfo.hostid, {
       hostid: hostInfo.hostid,
       name: hostInfo.name,
       soma: 0,
       count: 0,
       processes: null,
       ramTotalBytes: null,
       ramAvailableBytes: null,
     });
   }
 
   /**
    * Buscar histórico CPU (último minuto)
    */
   const history = await zabbixRequest(url, token, "history.get", {
     history: 0,
     itemids: cpuItems.map((i: any) => i.itemid),
     time_from: now - 60,
     output: "extend",
   });
 
   for (const h of history) {
     const item = cpuItems.find((i: any) => i.itemid === h.itemid);
     const hostInfo = item?.hosts?.[0];
     if (!hostInfo) continue;
 
     const idle = Number(h.value);
     if (Number.isNaN(idle)) continue;
 
     const acc = hostsMap.get(hostInfo.hostid);
     if (!acc) continue;
 
     acc.soma += idle;
     acc.count += 1;
   }
 
   /**
    * Buscar proc.num
    */
   const procItems = await zabbixRequest(url, token, "item.get", {
     hostids,
     filter: { key_: ["proc.num"] },
     output: ["lastvalue"],
     selectHosts: ["hostid"],
   });
 
   for (const p of procItems) {
     const hostInfo = p.hosts?.[0];
     if (!hostInfo) continue;
 
     const acc = hostsMap.get(hostInfo.hostid);
     if (!acc) continue;
 
     const value = Number(p.lastvalue);
     acc.processes = Number.isNaN(value) ? null : value;
   }
 
   /**
    * Buscar RAM
    */
   const ramItems = await zabbixRequest(url, token, "item.get", {
     hostids,
     filter: {
       key_: ["vm.memory.size[total]", "vm.memory.size[available]"],
     },
     output: ["key_", "lastvalue"],
     selectHosts: ["hostid"],
   });
 
   for (const r of ramItems) {
     const hostInfo = r.hosts?.[0];
     if (!hostInfo) continue;
 
     const acc = hostsMap.get(hostInfo.hostid);
     if (!acc) continue;
 
     const value = Number(r.lastvalue);
     if (Number.isNaN(value)) continue;
 
     if (r.key_ === "vm.memory.size[total]") {
       acc.ramTotalBytes = value;
     }
 
     if (r.key_ === "vm.memory.size[available]") {
       acc.ramAvailableBytes = value;
     }
   }
 
   /**
    * Montar retorno final
    */
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
         ramUsedGB = Number((usedBytes / 1024 / 1024 / 1024).toFixed(2));
         ramTotalGB = Number((h.ramTotalBytes / 1024 / 1024 / 1024).toFixed(0));
       }
 
       return {
         hostid: h.hostid,
         name: h.name,
         cpu:
           h.count > 0
             ? Number((100 - h.soma / h.count).toFixed(2))
             : 0,
         processes: h.processes,
         ram_used_gb: ramUsedGB,
         ram_total_gb: ramTotalGB,
       };
     })
     .sort((a, b) => b.cpu - a.cpu)
     .slice(0, limit);
 }
 