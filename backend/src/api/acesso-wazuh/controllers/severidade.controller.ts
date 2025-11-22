import { buscarSeveridadeIndexer } from "../services/acesso-wazuh";
import { getTenantAtivo } from "./_utils";

export default {
  async severidade(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) return ctx.notFound("Tenant não encontrado ou inativo");

      const dias = ctx.query.dias || "7";

      const resultado = await buscarSeveridadeIndexer(tenant, dias);

      return ctx.send({ severidade: resultado });
    } catch (error) {
      console.error("Erro ao buscar severidade:", error);
      return ctx.internalServerError("Erro ao consultar severidade");
    }
  },
};