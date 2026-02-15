import { getTenantAtivo } from "../utils/tenant";
import { buscarFirewalls } from "../services/zabbix";
import { buscarTopHostsCPU } from "../services/top-hosts-cpu";
import { buscarSeveridade } from "../services/severity";
import { buscarTopSwitchesCPU, buscarSwitchesStatus } from "../services/top-switches-cpu";
import { buscarAlertasZabbix } from "../services/alerts";
import { buscarAtivosZabbix } from "../services/actives";
import { buscarVpnZabbix } from "../services/vpn";
import { buscarTopRoutersCPU } from "../services/routers";
import { buscarLinksWan } from "../services/links-wan";

export default {
  async listFirewalls(ctx) {
    try {
      // 1. Verificar tenant
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      // 2. Buscar firewalls no Zabbix
      const firewalls = await buscarFirewalls(tenant);

      // 3. Retorno padronizado
      return ctx.send({
        total: firewalls.length,
        firewalls,
      });

    } catch (error) {
      console.error("Erro ao consultar Zabbix Firewalls:", error);
      return ctx.internalServerError("Erro ao consultar firewalls no Zabbix");
    }
  },
  async topHostsCPU(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }
  
      const limit = Math.max(
        1,
        Math.min(Number(ctx.query.limit) || 3, 10)
      );
  
      let hosts = await buscarTopHostsCPU(tenant, limit);
  
      // 🔒 Garante ordenação e TOP 3 mesmo com CPU = 0
      hosts = hosts
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, limit);
  
      return ctx.send({
        total: hosts.length,
        hosts,
      });
  
    } catch (error) {
      console.error("Erro ao buscar Top Hosts CPU:", error);
      return ctx.internalServerError(
        "Erro ao consultar Top Hosts CPU no Zabbix"
      );
    }
  },  

  async severidade(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const result = await buscarSeveridade(tenant);

      return ctx.send(result);

    } catch (error) {
      console.error("Erro controller severidade:", error);
      return ctx.internalServerError("Erro ao consultar severidade no Zabbix");
    }
  },

  async topSwitchesCPU(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const limit = ctx.query.limit
        ? Number(ctx.query.limit)
        : 5;

      const switches = await buscarTopSwitchesCPU(tenant, limit);

      return ctx.send({
        total: switches.length,
        switches,
      });

    } catch (error) {
      console.error("Erro ao buscar Top Switches CPU:", error);
      return ctx.internalServerError(
        "Erro ao consultar Top Switches CPU no Zabbix"
      );
    }
  },

  async switchesStatus(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const data = await buscarSwitchesStatus(tenant);

      return ctx.send(data);

    } catch (error) {
      console.error("Erro ao buscar status dos switches:", error);
      return ctx.internalServerError(
        "Erro ao consultar status dos switches no Zabbix"
      );
    }
  },

  async alertas(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) return ctx.notFound("Tenant não encontrado");

      const limit = ctx.query.limit ? Number(ctx.query.limit) : 10;

      const alertas = await buscarAlertasZabbix(tenant, limit);

      return ctx.send({
        total: alertas.length,
        alertas,
      });

    } catch (err) {
      console.error("Erro alertas Zabbix:", err);
      return ctx.internalServerError("Erro ao buscar alertas");
    }
  },

  async ativos(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) return ctx.notFound("Tenant não encontrado");

      const resultado = await buscarAtivosZabbix(tenant);
      return ctx.send(resultado);

    } catch (err) {
      console.error("Erro ativos Zabbix:", err);
      return ctx.internalServerError("Erro ao buscar ativos");
    }
  },

  async vpn(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) return ctx.notFound("Tenant não encontrado");

      const vpns = await buscarVpnZabbix(tenant);

      return ctx.send({
        total: vpns.length,
        vpns,
      });
    } catch (err) {
      console.error("Erro VPN Zabbix:", err);
      return ctx.internalServerError("Erro ao buscar VPNs");
    }
  },

  async routers(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) return ctx.notFound("Tenant não encontrado");
  
      const limit = ctx.query.limit ? Number(ctx.query.limit) : 5;
  
      const result = await buscarTopRoutersCPU(tenant, limit);
  
      return ctx.send({
        total: result.total,
        routers: result.routers,
      });
  
    } catch (err) {
      console.error("Erro routers CPU Zabbix:", err);
      return ctx.internalServerError("Erro ao buscar CPU dos roteadores");
    }
  },
  

  async linksWan(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado");
      }
  
      const links = await buscarLinksWan(tenant);
  
      return ctx.send({
        total: links.length,
        links,
      });
  
    } catch (err) {
      console.error("Erro links WAN Zabbix:", err);
      return ctx.internalServerError("Erro ao buscar links WAN");
    }
  }
  

};
