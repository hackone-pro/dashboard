import { getTenantAtivo } from "./_utils";

export default {
  async buscarTenantPorUsuario(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);

      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      return ctx.send(tenant); // você pode filtrar campos aqui se quiser
    } catch (error) {
      console.error("Erro ao buscar tenant:", error);
      return ctx.internalServerError("Erro ao consultar tenant");
    }
  },
};