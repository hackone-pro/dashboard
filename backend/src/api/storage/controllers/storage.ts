import storageService from "../services/storage";

export default {
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

      const dados = await storageService.lerArquivo("state");
      return ctx.send(dados);
    } catch (err) {
      strapi.log.error("❌ Erro storage state:", err);
      return ctx.internalServerError("Erro ao acessar estado do storage.");
    }
  },

  async internal(ctx) {
    try {
      const dados = await storageService.lerArquivo("internal");
      return ctx.send(dados);
    } catch (err) {
      strapi.log.error("❌ Erro storage internal:", err);
      return ctx.internalServerError("Erro ao acessar storage internal.");
    }
  },

  async timeline(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();

      const fullUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { id: user.id },
          populate: { tenant: true },
        });

      if (!fullUser?.tenant)
        return ctx.notFound("Tenant não encontrado");

      // 👇 aqui pode vir "Qolinty", "Dora Retail", etc.
      const tenantFromDb = fullUser.tenant.cliente_name || "";

      const dados = await storageService.gerarTimeline(tenantFromDb);
      return ctx.send(dados);
    } catch (err) {
      strapi.log.error("❌ Erro storage timeline:", err);
      return ctx.internalServerError("Erro ao gerar timeline do storage.");
    }
  },
};
