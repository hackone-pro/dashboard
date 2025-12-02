/**
 * Serviço de integração com Zabbix via API Token (Bearer)
 */

 import axios from "axios";

 /**
  * 🔵 Função padrão para chamar o Zabbix via JSON-RPC com API Token
  */
 async function zabbixRequest(url: string, token: string, method: string, params: any) {
   const body = {
     jsonrpc: "2.0",
     method,
     params,
     id: 1,
   };
 
   const response = await axios.post(url, body, {
     headers: {
       "Content-Type": "application/json",
       "Authorization": `Bearer ${token}`,
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
  * 🔵 Buscar hosts da classe "Firewall"
  */
 export async function buscarFirewalls(tenant: any) {
   try {
     const cfg = tenant.zabbix_config;
     if (!cfg?.enabled) return [];
 
     // 🔥 Aqui montamos automaticamente a URL correta
     const host = cfg.zabbix_url?.replace("http://", "").replace("https://", "").trim();
     const url = `http://${host}/zabbix/api_jsonrpc.php`;
 
     const token = cfg.zabbix_token;
 
     // Buscar hosts
     const hosts = await zabbixRequest(url, token, "host.get", {
       output: "extend",
       selectInterfaces: ["ip"],
       selectParentTemplates: ["templateid", "name"],
     });
 
     if (!Array.isArray(hosts)) {
       console.error("ERRO: host.get retornou algo inesperado:", hosts);
       return [];
     }
 
     // 🔥 Filtro baseado no template FortiGate
     const firewalls = hosts.filter((h: any) =>
       Array.isArray(h.parentTemplates) &&
       h.parentTemplates.some((tpl: any) =>
         tpl.name.toLowerCase().includes("fortigate")
       )
     );
 
     // Normalização dos campos
     return firewalls.map((h: any) => ({
       id: h.hostid,
       name: h.name,
       ip: h.interfaces?.[0]?.ip || null,
       online: Number(h.status) === 0,
       templates: h.parentTemplates,
     }));
 
   } catch (err) {
     console.error("Erro buscarFirewalls:", err);
     return [];
   }
 }
 