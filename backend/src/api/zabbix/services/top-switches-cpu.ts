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
     * Buscar templates com class = switch
     */
    const templates = await zabbixRequest(url, token, "template.get", {
      output: ["templateid"],
      tags: [
        {
          tag: "class",
          value: "switch",
          operator: 1,
        },
      ],
    });
  
    const templateids = templates.map((t: any) => t.templateid);
  
    if (!templateids.length) return [];
  
    /**
     * Buscar hosts vinculados aos templates switch
     */
    const hosts = await zabbixRequest(url, token, "host.get", {
      output: ["hostid", "name"],
      templateids,
      status: 0,
    });
  
    if (!Array.isArray(hosts) || !hosts.length) return [];
  
    /**
     * Buscar CPU dos switches
     */
    const dadosCPU = await Promise.all(
      hosts.map(async (h: any) => {
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
     * Buscar templates class = switch
     */
    const templates = await zabbixRequest(url, token, "template.get", {
      output: ["templateid"],
      tags: [
        {
          tag: "class",
          value: "switch",
          operator: 1,
        },
      ],
    });
  
    const templateids = templates.map((t: any) => t.templateid);
  
    if (!templateids.length) {
      return {
        total: 0,
        online: 0,
        offline: 0,
        switches: [],
      };
    }
  
    /**
     * Buscar hosts vinculados
     */
    const hosts = await zabbixRequest(url, token, "host.get", {
      output: ["hostid", "name", "status"],
      templateids,
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