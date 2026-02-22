// src/api/admin-multitenant/controllers/admin-multitenant.ts

export default {
  async myTenants(ctx) {
    try {
      const user = ctx.state.user;

      if (!user) {
        return ctx.unauthorized("Usuário não autenticado");
      }

      const tenants = await strapi
        .service("api::admin-multitenant.admin-multitenant")
        .listarTenantsAdmin(user);

      return ctx.send(tenants);
    } catch (err: any) {
      strapi.log.error("❌ Erro controller admin-multitenant:", err);
      return ctx.badRequest(err.message || "Erro ao buscar tenants");
    }
  },

  async summary(ctx) {
    try {
      const user = ctx.state.user;
  
      if (!user) {
        return ctx.unauthorized("Usuário não autenticado");
      }
  
      const data = await strapi
        .service("api::admin-multitenant.admin-multitenant")
        .summary(user);
  
      return ctx.send(data);
  
    } catch (err) {
      strapi.log.error("❌ Erro controller summary:", err);
      return ctx.internalServerError("Erro ao gerar summary");
    }
  }
  
};
