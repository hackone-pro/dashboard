/**
 * Serviço de integração com Zabbix
 * Retorna severidade agregada dos problemas ativos
 */

 import axios from "axios";

 type ZabbixEvent = {
   eventid: string;
   severity: string;
 };
 
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
 
   if (response.data?.error) {
     console.error("❌ Zabbix API error:", response.data.error);
     throw new Error(response.data.error.data || "Erro Zabbix");
   }
 
   return response.data.result;
 }
 
 export async function buscarSeveridade(tenant: any) {
   try {
     const cfg = tenant.zabbix_config;
 
     if (!cfg?.enabled) {
       return {
         total: 0,
         severity: { warning: 0, high: 0, disaster: 0 },
       };
     }
 
     const host = cfg.zabbix_url
       ?.replace("http://", "")
       .replace("https://", "")
       .trim();
 
     const url = `http://${host}/zabbix/api_jsonrpc.php`;
     const token = cfg.zabbix_token;
 
     const events: ZabbixEvent[] = await zabbixRequest(
       url,
       token,
       "problem.get",
       {
         output: ["eventid", "severity"],
         recent: true,
         sortfield: "eventid",
         sortorder: "DESC",
       }
     );
 
     let warning = 0;
     let high = 0;
     let disaster = 0;
 
     for (const ev of events) {
       const sev = Number(ev.severity);
 
       if (sev === 2) warning++;
       else if (sev === 3 || sev === 4) high++; // Average + High
       else if (sev === 5) disaster++;
     }
 
     return {
       total: warning + high + disaster,
       severity: {
         warning,
         high,
         disaster,
       },
     };
 
   } catch (err) {
     console.error("Erro buscarSeveridade:", err);
     return {
       total: 0,
       severity: { warning: 0, high: 0, disaster: 0 },
     };
   }
 }
 