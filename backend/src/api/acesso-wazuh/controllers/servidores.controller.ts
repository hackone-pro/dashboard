import { buscarListaServidores } from "../services/servidores.service";
import { getTenantAtivo } from "./_utils";

export default {
  async servidores(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) return ctx.notFound("Tenant não encontrado");

      const lista = await buscarListaServidores(tenant);

      return ctx.send({ servidores: lista });
    } catch (err) {
      console.error("Erro ao listar servidores:", err);
      return ctx.internalServerError("Erro ao consultar servidores");
    }
  }
};