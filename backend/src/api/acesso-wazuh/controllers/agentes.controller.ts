import { buscarTopAgentes, buscarTopAgentesCis, buscarListaServidores } from "../services/acesso-wazuh";
import { getTenantAtivo } from "./_utils";

export default {
  async topAgentes(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const dias = ctx.query.dias || "7";

      const resultado = await buscarTopAgentes(tenant, dias);

      return ctx.send({ topAgentes: resultado });

    } catch (error) {
      console.error("Erro ao buscar top agentes com risco:", error);
      return ctx.internalServerError("Erro ao consultar top agentes");
    }
  },

  async topAgentesCis(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const dias = ctx.query.dias || "7";

      const resultado = await buscarTopAgentesCis(tenant, dias);

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
};
