/**
 * Serviço Zabbix — Alertas ativos
 */

 import axios from "axios";

 function mapSeverity(sev: string) {
    switch (sev) {
      case "5":
        return "critico";
      case "4":
        return "alto";
      case "3":
        return "medio";
      case "2":
        return "baixo";
      default:
        return "info";
    }
  }
  
  function formatarDuracao(segundos: number) {
    const h = Math.floor(segundos / 3600);
    const m = Math.floor((segundos % 3600) / 60);
  
    if (h > 0) return `${h}h ${m} min`;
    return `${m} min`;
  }
  

 async function zabbixRequest(url: string, token: string, method: string, params: any) {
   const body = { jsonrpc: "2.0", method, params, id: 1 };
 
   const response = await axios.post(url, body, {
     headers: {
       "Content-Type": "application/json",
       Authorization: `Bearer ${token}`,
     },
   });
 
   if (response.data.error) {
     throw new Error(JSON.stringify(response.data.error));
   }
 
   return response.data.result;
 }
 
 export async function buscarAlertasZabbix(tenant: any, limit = 10) {
   const cfg = tenant.zabbix_config;
   if (!cfg?.enabled) return [];
 
   const host = cfg.zabbix_url.replace(/^https?:\/\//, "");
   const url = `http://${host}/zabbix/api_jsonrpc.php`;
   const token = cfg.zabbix_token;
 
   const eventos = await zabbixRequest(url, token, "event.get", {
     output: ["eventid", "name", "severity", "clock"],
     selectHosts: ["name"],
     value: 1,
     sortfield: ["clock"],
     sortorder: "DESC",
     limit,
   });
 
   const agora = Math.floor(Date.now() / 1000);
 
   return eventos.map((e: any) => {
     const duracao = agora - Number(e.clock);
 
     return {
       horario: new Date(Number(e.clock) * 1000).toLocaleTimeString("pt-BR", {
         hour: "2-digit",
         minute: "2-digit",
       }),
       host: e.hosts?.[0]?.name ?? "Desconhecido",
       problema: e.name,
       severidade: mapSeverity(e.severity),
       duracao: formatarDuracao(duracao),
     };
   });
 }
 