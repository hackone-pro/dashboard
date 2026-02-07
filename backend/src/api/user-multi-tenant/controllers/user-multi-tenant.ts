/**
 * user-multi-tenant controller
 */

 export default {
  /**
   * 🔹 Endpoint customizado: retorna os tenants do usuário autenticado
   * GET /api/user-multi-tenant/me
   */
  async me(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) return ctx.unauthorized("Usuário não autenticado");

      const resultado = await strapi
        .service("api::user-multi-tenant.user-multi-tenant")
        .buscarTenantsUsuario(user);

      return ctx.send(resultado);
    } catch (err) {
      strapi.log.error("❌ Erro no controller user-multi-tenant.me:", err);
      return ctx.internalServerError("Erro ao buscar tenants do usuário");
    }
  },

  /**
   * 🔹 Troca o tenant ativo do usuário autenticado
   * PATCH /api/user-multi-tenant/:id
   */
  async trocarTenant(ctx) {
    try {
      const user = ctx.state.user;
      const { id } = ctx.params;

      if (!user) return ctx.unauthorized("Usuário não autenticado");
      if (!id) return ctx.badRequest("ID do tenant não informado");

      // 🔹 Verifica se o tenant pertence ao usuário
      const acesso = await strapi.db
        .query("api::user-multi-tenant.user-multi-tenant")
        .findOne({
          where: {
            users_permissions_user: user.id,
            tenant: Number(id),
            ativo: true,
          },
        });

      if (!acesso)
        return ctx.forbidden("Usuário não possui acesso a esse tenant");

      // 🔹 Atualiza tenant ativo no usuário
      await strapi.db.query("plugin::users-permissions.user").update({
        where: { id: user.id },
        data: { tenant: Number(id) },
      });

      // 🔹 Busca tenant COMPLETO (com contrato)
      const tenantAtualizado = await strapi.db
        .query("api::tenant.tenant")
        .findOne({
          where: { id: Number(id) },
          select: ["id", "cliente_name", "organizacao"],
          populate: {
            contract: {
              select: [
                "name",
                "firewalls",
                "edr",
                "servers",
                "storage_gb",
                "active",
              ],
            },
          },
        });

      return ctx.send({
        message: "Tenant alterado com sucesso",
        tenantAtivo: tenantAtualizado
          ? {
              id: tenantAtualizado.id,
              cliente_name: tenantAtualizado.cliente_name,
              organizacao: tenantAtualizado.organizacao,
              contract: tenantAtualizado.contract ?? null,
            }
          : null,
      });
    } catch (err) {
      strapi.log.error("❌ Erro ao trocar tenant:", err);
      return ctx.internalServerError("Erro ao trocar tenant");
    }
  },
};
