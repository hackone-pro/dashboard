/**
 * Serviço Zabbix — Top 5 Roteadores (Firewalls) por alertas ativos (EVENTOS)
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
 
 export async function buscarTopRoutersSeveridade(tenant: any, limit = 5) {
   const cfg = tenant.zabbix_config;
   if (!cfg?.enabled) return { routers: [] };
 
   const host = cfg.zabbix_url.replace(/^https?:\/\//, "");
   const url = `http://${host}/zabbix/api_jsonrpc.php`;
   const token = cfg.zabbix_token;
 
   /**
    * Buscar EVENTOS ativos (mesma fonte do card Alertas)
    */
   const eventos = await zabbixRequest(url, token, "event.get", {
     output: ["eventid", "severity"],
     selectHosts: ["name"],
     value: 1,
   });
 
   if (!Array.isArray(eventos)) return { routers: [] };
 
   /**
    * Agrupar alertas (eventos) por roteador/firewall
    */
   const mapa: Record<
     string,
     {
       name: string;
       critico: number;
       high: number;
       average: number;
       warning: number;
       total: number;
     }
   > = {};
 
   for (const e of eventos) {
     const host = e.hosts?.[0];
     if (!host) continue;
 
     const hostName: string = host.name;
 
     // 🔹 critério de firewall / roteador
     if (
       !hostName.startsWith("FGT") &&
       !hostName.toLowerCase().includes("forti")
     ) {
       continue;
     }
 
     if (!mapa[hostName]) {
       mapa[hostName] = {
         name: hostName,
         critico: 0,
         high: 0,
         average: 0,
         warning: 0,
         total: 0,
       };
     }
 
     // 🔹 1 EVENTO = 1 ALERTA
     mapa[hostName].total++;
 
     switch (String(e.severity)) {
       case "5":
         mapa[hostName].critico++;
         break;
       case "4":
         mapa[hostName].high++;
         break;
       case "3":
         mapa[hostName].average++;
         break;
       case "2":
         mapa[hostName].warning++;
         break;
       default:
         break;
     }
   }
 
   return {
     routers: Object.values(mapa)
       .sort((a, b) => b.total - a.total)
       .slice(0, limit),
   };
 }
 