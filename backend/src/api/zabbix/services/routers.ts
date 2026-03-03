/**
 * Serviço Zabbix — Top Roteadores por uso de CPU
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
 
 export async function buscarTopRoutersCPU(
   tenant: any,
   limit = 5
 ) {
   const cfg = tenant.zabbix_config;
   if (!cfg?.enabled) return { routers: [] };
 
   const host = cfg.zabbix_url.replace(/^https?:\/\//, "");
   const url = `http://${host}/zabbix/api_jsonrpc.php`;
   const token = cfg.zabbix_token;
 
   /**
    * 1️⃣ Buscar templates com tag class=roteador
    */
   const templates = await zabbixRequest(url, token, "template.get", {
     output: ["templateid"],
     tags: [
       {
         tag: "class",
         value: "roteador",
         operator: 1,
       },
     ],
   });
 
   const templateids = templates.map((t: any) => t.templateid);
   if (!templateids.length) return { routers: [] };
 
   /**
    * 2️⃣ Buscar hosts vinculados a esses templates
    */
   const hosts = await zabbixRequest(url, token, "host.get", {
     output: ["hostid", "name"],
     templateids,
     status: 0,
   });
 
   if (!hosts.length) return { routers: [] };
 
   const hostids = hosts.map((h: any) => h.hostid);
 
   /**
    * 3️⃣ Buscar itens de CPU
    */
   const items = await zabbixRequest(url, token, "item.get", {
     hostids,
     search: {
       key_: "cpu",
     },
     output: ["hostid", "lastvalue", "name", "key_"],
   });
 
   const routers: any[] = [];
 
   for (const host of hosts) {
     const cpuItem = items.find(
       (i: any) =>
         i.hostid === host.hostid &&
         (
           i.key_.includes("system.cpu.util") ||
           i.key_.includes("cpu.util") ||
           i.key_.includes("system.cpu.load")
         )
     );
 
     if (!cpuItem) continue;
 
     const cpu = Number(cpuItem.lastvalue);
     if (Number.isNaN(cpu)) continue;
 
     let severidade: "baixo" | "medio" | "alto" | "critico" = "baixo";
 
     if (cpu >= 80) severidade = "critico";
     else if (cpu >= 60) severidade = "alto";
     else if (cpu >= 30) severidade = "medio";
 
     routers.push({
       name: host.name,
       cpu_percent: Number(cpu.toFixed(1)),
       severidade,
     });
   }
 
   return {
     total: routers.length,
     routers: routers
       .sort((a, b) => b.cpu_percent - a.cpu_percent)
       .slice(0, limit),
   };
 }
 