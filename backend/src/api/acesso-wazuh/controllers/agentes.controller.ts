import {
  buscarTopAgentes,
  buscarTopAgentesCis,
  buscarListaServidores,
  buscarTopAgentesSyscheck
} from "../services/acesso-wazuh";

import { getTenantAtivo } from "./_utils";

export default {
  async topAgentes(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const { from, to, dias = "1" } = ctx.query;

      const resultado = await buscarTopAgentes(tenant, {
        from: from ? String(from) : undefined,
        to: to ? String(to) : undefined,
        dias: String(dias),
      });

      return ctx.send({ topAgentes: resultado });

    } catch (error) {
      console.error("Erro ao buscar top agentes:", error);
      return ctx.internalServerError("Erro ao consultar top agentes");
    }
  },

  async topAgentesCis(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }
  
      // 🔹 Período absoluto (calendário)
      const periodo =
        ctx.query.from && ctx.query.to
          ? { from: ctx.query.from, to: ctx.query.to }
          : null;
  
      // 🔹 Dias (fallback)
      const dias = ctx.query.dias || "7";
  
      const resultado = await buscarTopAgentesCis(
        tenant,
        periodo ?? { dias }
      );
  
      return ctx.send({ topAgentesCis: resultado });
  
    } catch (error) {
      console.error("Erro ao buscar top agentes CIS:", error);
      return ctx.internalServerError("Erro ao consultar top agentes CIS");
    }
  },
  
  async agentesInventario(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) return ctx.notFound("Tenant não encontrado ou inativo");

      const lista = await buscarListaServidores(tenant);
      return ctx.send({ agentes: lista });

    } catch (error) {
      console.error("Erro ao listar agentes (inventário):", error);
      return ctx.internalServerError("Erro ao consultar agentes");
    }
  },

  async topAgentesSyscheck(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const { from, to, dias } = ctx.query;

      const resultado = await buscarTopAgentesSyscheck(tenant, {
        from: from ? String(from) : undefined,
        to: to ? String(to) : undefined,
        dias: dias ? String(dias) : "7",
      });

      return ctx.send({ topAgentes: resultado });

    } catch (error) {
      console.error("Erro ao buscar top agentes syscheck:", error);
      return ctx.internalServerError("Erro ao consultar top agentes syscheck");
    }
  },

};
