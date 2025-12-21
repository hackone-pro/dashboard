/**
 * Serviço Zabbix — Links WAN (Saúde por RAM do Firewall)
 *
 * Conceito:
 * - Link WAN não consome RAM
 * - A RAM vem do FIREWALL
 * - Cada link herda a saúde do firewall
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
 
 const RAM_BASELINE_BYTES = 4 * 1024 * 1024 * 1024; // 4GB visual padrão
 
 export async function buscarLinksWan(tenant: any) {
   const cfg = tenant.zabbix_config;
   if (!cfg?.enabled) return [];
 
   const host = cfg.zabbix_url.replace(/^https?:\/\//, "").trim();
   const url = `http://${host}/zabbix/api_jsonrpc.php`;
   const token = cfg.zabbix_token;
 
   /**
    * 1️⃣ Buscar RAM dos firewalls (SNMP)
    */
   const ramItems = await zabbixRequest(url, token, "item.get", {
     filter: {
       key_: [
         "vm.memory.available[fgSysMemFree.0]",
         "vm.memory.total[fgSysMemCapacity.0]",
       ],
     },
     output: ["key_", "lastvalue"],
     selectHosts: ["hostid", "name"],
   });
 
   const ramMap = new Map<
     string,
     { total: number | null; available: number | null }
   >();
 
   for (const r of ramItems) {
     const hostInfo = r.hosts?.[0];
     if (!hostInfo) continue;
 
     if (!ramMap.has(hostInfo.name)) {
       ramMap.set(hostInfo.name, { total: null, available: null });
     }
 
     const acc = ramMap.get(hostInfo.name)!;
     const value = Number(r.lastvalue);
 
     if (Number.isNaN(value)) continue;
 
     if (r.key_.includes("MemCapacity")) acc.total = value;
     if (r.key_.includes("MemFree")) acc.available = value;
   }
 
   /**
    * 2️⃣ Buscar itens de interface (somente para identificar LINKS)
    */
   const items = await zabbixRequest(url, token, "item.get", {
     search: {
       key_: "net.if.",
     },
     output: ["itemid", "name", "key_"],
     selectHosts: ["name"],
   });
 
   if (!Array.isArray(items)) return [];
 
   const links: any[] = [];
 
   for (const item of items) {
     const hostName = item.hosts?.[0]?.name;
     if (!hostName) continue;
 
     // Apenas firewalls
     if (
       !hostName.startsWith("FGT") &&
       !hostName.toLowerCase().includes("forti")
     ) {
       continue;
     }
 
     // Aceitar apenas interfaces reais
     if (
       !item.key_.includes("ifHCInOctets") &&
       !item.key_.includes("ifHCOutOctets")
     ) {
       continue;
     }
 
     /**
      * RAM herdada do firewall
      */
     const ram = ramMap.get(hostName);
 
     const ramTotal =
       ram?.total && ram.total > 0 ? ram.total : RAM_BASELINE_BYTES;
 
     const ramAvailable =
       ram?.available !== null && ram?.available !== undefined
         ? Math.min(ram.available, ramTotal)
         : ramTotal;
 
     const ramUsed = Math.max(0, ramTotal - ramAvailable);
 
     const ramUsedPercent = Number(
       ((ramUsed / ramTotal) * 100).toFixed(2)
     );
 
     /**
      * Severidade baseada em RAM
      */
     let severidade: "baixo" | "medio" | "alto" | "critico" = "baixo";
 
     if (ramUsedPercent >= 90) severidade = "critico";
     else if (ramUsedPercent >= 75) severidade = "alto";
     else if (ramUsedPercent >= 50) severidade = "medio";
 
     /**
      * Normalizar nome do link
      */
     const link = item.name
       .replace("Interface", "")
       .replace("Bits received", "")
       .replace("Bits sent", "")
       .replace(/[():]/g, "")
       .trim();
 
     links.push({
       firewall: hostName,
       link,
 
       // 🔹 RAM
       ram_total_bytes: ramTotal,
       ram_available_bytes: ramAvailable,
       ram_used_bytes: ramUsed,
       ram_used_percent: ramUsedPercent,
 
       severidade,
     });
   }
 
   return links;
 }
 