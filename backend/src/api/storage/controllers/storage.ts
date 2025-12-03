import storageService from "../services/storage";

export default {

  // =============================
  // STORAGE STATE (cliente)
  // =============================
  async state(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Usuário não autenticado");
  
      const fullUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { id: user.id },
          populate: { tenant: true },
        });
  
      if (!fullUser?.tenant)
        return ctx.notFound("Tenant não encontrado para este usuário");
  
      const tenantName = fullUser.tenant.cliente_name || "";
      const tenantLower = tenantName.toLowerCase();
  
      const dados = await storageService.lerArquivo("state", tenantLower);
  
      return ctx.send({
        cliente: tenantLower,
        dados,
      });
  
    } catch (err) {
      strapi.log.error("❌ Erro storage state:", err);
      return ctx.internalServerError("Erro ao acessar estado do storage.");
    }
  },
  
  async internal(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Usuário não autenticado");
  
      const fullUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { id: user.id },
          populate: { tenant: true },
        });
  
      if (!fullUser?.tenant)
        return ctx.notFound("Tenant não encontrado ou inativo");
  
      const tenantName = fullUser.tenant.cliente_name.toLowerCase();
  
      const dados = await storageService.lerArquivo("internal", tenantName);
  
      return ctx.send(dados);
    } catch (err) {
      strapi.log.error("❌ Erro storage internal:", err);
      return ctx.internalServerError("Erro ao acessar storage internal.");
    }
  }
  
};
