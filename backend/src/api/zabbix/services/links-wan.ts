/**
 * Serviço Zabbix — Links WAN (Tráfego Real + Capacidade)
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
 
 /**
  * Equipamentos válidos (Firewall + Roteadores de borda)
  */
 function isEquipamentoBorda(hostname: string): boolean {
   return (
     hostname.startsWith("FGT") ||
     hostname.startsWith("Fortinet") ||
     hostname.startsWith("RTR-")
   );
 }
 
 /**
  * Interfaces válidas para WAN
  */
 function isInterfaceWanValida(nomeInterface: string): boolean {
   const nome = nomeInterface.toLowerCase();
 
   if (
     nome.includes("fortilink") ||
     nome.includes("ssl.root") ||
     nome.includes("naf.root") ||
     nome.includes("l2t.root") ||
     nome.includes("loopback") ||
     nome.includes("vo0") ||
     nome.includes("ens")
   ) {
     return false;
   }
 
   return (
     nome.includes("port") ||
     nome.includes("wan") ||
     nome.includes("et") ||
     nome.includes("gi") ||
     nome.includes("eth")
   );
 }
 
 export async function buscarLinksWan(tenant: any) {
   const cfg = tenant.zabbix_config;
   if (!cfg?.enabled) return [];
 
   const host = cfg.zabbix_url.replace(/^https?:\/\//, "").trim();
   const url = `http://${host}/zabbix/api_jsonrpc.php`;
   const token = cfg.zabbix_token;
 
   /**
    * 1️⃣ Buscar todos hosts ativos
    */
   const hosts = await zabbixRequest(url, token, "host.get", {
     output: ["hostid", "name"],
     status: 0,
   });
 
   if (!hosts.length) return [];
 
   const hostsValidos = hosts.filter((h: any) =>
     isEquipamentoBorda(h.name)
   );
 
   if (!hostsValidos.length) return [];
 
   const hostids = hostsValidos.map((h: any) => h.hostid);
 
   /**
    * 2️⃣ Buscar itens relacionados a interfaces
    */
   const items = await zabbixRequest(url, token, "item.get", {
     hostids,
     search: {
       key_: "net.if.",
     },
     output: ["hostid", "name", "key_", "lastvalue"],
   });
 
   const linkMap = new Map<string, any>();
 
   for (const item of items) {
     const hostName =
       hostsValidos.find((h: any) => h.hostid === item.hostid)?.name;
 
     if (!hostName) continue;
 
     if (!isInterfaceWanValida(item.name)) continue;
 
     const match = item.key_.match(/\.(\d+)\]/);
     if (!match) continue;
 
     const index = match[1];
     const key = `${hostName}_${index}`;
 
     if (!linkMap.has(key)) {
       linkMap.set(key, {
         firewall: hostName,
         link: `port${index}`,
         in_mbps: 0,
         out_mbps: 0,
         speed_bps: 0,
       });
     }
 
     const acc = linkMap.get(key);
     const value = Number(item.lastvalue);
     if (Number.isNaN(value)) continue;
 
     // Entrada
     if (item.key_.includes("ifHCInOctets")) {
       acc.in_mbps = (value * 8) / 1_000_000;
     }
 
     // Saída
     if (item.key_.includes("ifHCOutOctets")) {
       acc.out_mbps = (value * 8) / 1_000_000;
     }
 
     // Capacidade
     if (item.key_.includes("net.if.speed")) {
       acc.speed_bps = value;
     }
   }
 
   /**
    * 3️⃣ Montar resultado final
    */
   const result = Array.from(linkMap.values())
     .map((l) => {
       const trafego = Number((l.in_mbps + l.out_mbps).toFixed(2));
       const capacidade = Number((l.speed_bps / 1_000_000).toFixed(0));
 
       const uso =
         capacidade > 0
           ? Number(((trafego / capacidade) * 100).toFixed(2))
           : 0;
 
       let severidade: "baixo" | "medio" | "alto" | "critico" = "baixo";
 
       if (uso >= 90) severidade = "critico";
       else if (uso >= 75) severidade = "alto";
       else if (uso >= 50) severidade = "medio";
 
       return {
         firewall: l.firewall,
         link: l.link,
         trafego_mbps: trafego,
         capacidade_mbps: capacidade,
         uso_percentual: uso,
         severidade,
       };
     })
     .filter((l) => l.capacidade_mbps > 0)
     .sort((a, b) => b.trafego_mbps - a.trafego_mbps);
 
   return result;
 }
 