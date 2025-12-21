/**
 * Serviço Zabbix — Top Switches por CPU
 * Fonte: itens de CPU (%)
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
  * Regra de severidade baseada na CPU
  */
 function calcularSeveridadeCPU(cpu: number) {
   if (cpu >= 90) return "critico";
   if (cpu >= 70) return "alto";
   if (cpu >= 40) return "medio";
   return "baixo";
 }
 
 /**
  * Retorna Top Switches por CPU
  */
 export async function buscarTopSwitchesCPU(
   tenant: any,
   limit = 5
 ) {
   const cfg = tenant.zabbix_config;
   if (!cfg?.enabled) return [];
 
   const host = cfg.zabbix_url
     ?.replace("http://", "")
     .replace("https://", "")
     .trim();
 
   const url = `http://${host}/zabbix/api_jsonrpc.php`;
   const token = cfg.zabbix_token;
 
   /**
    * Buscar TODOS os hosts ativos
    * (filtro de switch pode ser refinado depois por tag ou template)
    */
   const hosts = await zabbixRequest(url, token, "host.get", {
     output: ["hostid", "name", "status"],
   });
 
   if (!Array.isArray(hosts)) return [];
 
   const ativos = hosts.filter((h: any) => h.status === "0");
 
   /**
    * Buscar CPU de cada host
    */
   const dadosCPU = await Promise.all(
     ativos.map(async (h: any) => {
       try {
         const items = await zabbixRequest(url, token, "item.get", {
           hostids: h.hostid,
           search: {
             key_: "system.cpu.util",
           },
           output: ["lastvalue"],
           limit: 1,
         });
 
         const cpu = items?.[0]?.lastvalue
           ? Number(items[0].lastvalue)
           : 0;
 
         return {
           hostid: h.hostid,
           name: h.name,
           cpu,
           severity: calcularSeveridadeCPU(cpu),
         };
       } catch {
         return {
           hostid: h.hostid,
           name: h.name,
           cpu: 0,
           severity: "baixo",
         };
       }
     })
   );
 
   /**
    * Ordenar e limitar
    */
   return dadosCPU
     .sort((a, b) => b.cpu - a.cpu)
     .slice(0, limit);
 }

 /**
 * Retorna status ONLINE / OFFLINE dos switches
 */
export async function buscarSwitchesStatus(tenant: any) {
  const cfg = tenant.zabbix_config;
  if (!cfg?.enabled) {
    return {
      total: 0,
      online: 0,
      offline: 0,
      switches: [],
    };
  }

  const host = cfg.zabbix_url
    ?.replace("http://", "")
    .replace("https://", "")
    .trim();

  const url = `http://${host}/zabbix/api_jsonrpc.php`;
  const token = cfg.zabbix_token;

  /**
   * Buscar hosts
   * (por enquanto TODOS – depois refinamos por switch)
   */
  const hosts = await zabbixRequest(url, token, "host.get", {
    output: ["hostid", "name", "status"],
  });

  if (!Array.isArray(hosts)) {
    return {
      total: 0,
      online: 0,
      offline: 0,
      switches: [],
    };
  }

  const switches = hosts.map((h: any) => ({
    hostid: h.hostid,
    name: h.name,
    status: h.status === "0" ? "online" : "offline",
  }));

  const online = switches.filter(s => s.status === "online").length;
  const offline = switches.filter(s => s.status === "offline").length;

  return {
    total: switches.length,
    online,
    offline,
    switches,
  };
}

 