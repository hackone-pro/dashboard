/**
 * Serviço Zabbix — Ativos por Host Group (dinâmico)
 * Fonte: hostgroup.get + selectHosts
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
  * Retorna TODOS os grupos existentes no Zabbix
  * com a quantidade real de hosts em cada um
  */
 export async function buscarAtivosZabbix(tenant: any) {
   const cfg = tenant.zabbix_config;
   if (!cfg?.enabled) {
     return {
       total: 0,
       grupos: [],
     };
   }
 
   const host = cfg.zabbix_url
     ?.replace(/^https?:\/\//, "")
     .trim();
 
   const url = `http://${host}/zabbix/api_jsonrpc.php`;
   const token = cfg.zabbix_token;
 
   /**
    * Buscar todos os host groups + hosts
    */
   const groups = await zabbixRequest(url, token, "hostgroup.get", {
     output: ["groupid", "name"],
     selectHosts: ["hostid"],
   });
 
   if (!Array.isArray(groups)) {
     return {
       total: 0,
       grupos: [],
     };
   }
 
   /**
    * Montar resposta SEM qualquer regra fixa
    */
   const grupos = groups.map((g: any) => ({
     groupid: g.groupid,
     name: g.name,
     total: Array.isArray(g.hosts) ? g.hosts.length : 0,
   }));
 
   const total = grupos.reduce((sum, g) => sum + g.total, 0);
 
   return {
     total,
     grupos,
   };
 }
 