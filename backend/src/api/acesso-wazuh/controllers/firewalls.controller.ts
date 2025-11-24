import { buscarListaFirewalls, buscarTopGeradoresFirewall } from "../services/acesso-wazuh";
import { getTenantAtivo } from "./_utils";

export default {
  async firewalls(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const lista = await buscarListaFirewalls(tenant);

      return ctx.send({ firewalls: lista });

    } catch (error) {
      console.error("Erro ao listar firewalls:", error);
      return ctx.internalServerError("Erro ao consultar firewalls");
    }
  },

  async topGeradores(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const dias = ctx.query.dias || "7";

      const resultado = await buscarTopGeradoresFirewall(tenant, dias);

      return ctx.send({ topGeradores: resultado });

    } catch (error) {
      console.error("Erro ao buscar top geradores:", error);
      return ctx.internalServerError("Erro ao consultar top geradores");
    }
  },
};
