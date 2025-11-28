import { buscarEventosEDR } from "../services/edr.service";
import { getTenantAtivo } from "./_utils";

export default {
  async edr(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      // opcional: limite de itens (default 200)
      const size = ctx.query.size || "200";

      const resultado = await buscarEventosEDR(tenant, { size });

      return ctx.send({ edr: resultado });

    } catch (error) {
      console.error("Erro ao listar eventos EDR:", error);
      return ctx.internalServerError("Erro ao consultar eventos EDR");
    }
  },
};
