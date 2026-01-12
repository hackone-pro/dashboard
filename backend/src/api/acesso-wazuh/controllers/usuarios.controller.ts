import { buscarTopUsers } from "../services/acesso-wazuh";
import { getTenantAtivo } from "./_utils";

export default {
  async topUsers(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const { from, to, dias = "todos" } = ctx.query;

      const resultado = await buscarTopUsers(tenant, {
        from: from ? String(from) : undefined,
        to: to ? String(to) : undefined,
        dias: String(dias),
      });

      return ctx.send({ topUsers: resultado });

    } catch (error) {
      console.error("Erro ao buscar top users:", error);
      return ctx.internalServerError("Erro ao consultar top users");
    }
  }

};