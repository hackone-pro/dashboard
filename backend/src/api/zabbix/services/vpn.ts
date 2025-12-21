/**
 * Serviço Zabbix — VPN Tunnels (FortiGate)
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
 
 export async function buscarVpnZabbix(tenant: any) {
   const cfg = tenant.zabbix_config;
   if (!cfg?.enabled) return [];
 
   const host = cfg.zabbix_url?.replace(/^https?:\/\//, "").trim();
   const url = `http://${host}/zabbix/api_jsonrpc.php`;
   const token = cfg.zabbix_token;
 
   const items = await zabbixRequest(url, token, "item.get", {
     search: {
       key_: "vpn.tunnel.status",
     },
     output: ["itemid", "name", "lastvalue"],
     selectHosts: ["name"],
   });
 
   if (!Array.isArray(items)) return [];
 
   return items.map((item: any) => {
     const nome = item.name
       .replace("VPN", "")
       .replace(": Tunnel Status", "")
       .trim();
 
     return {
       nome,
       firewall: item.hosts?.[0]?.name ?? "Desconhecido",
       status: item.lastvalue === "1" ? "up" : "down",
     };
   });
 }
 