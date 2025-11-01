/**
 * custom-dashboard controller
 */

 export default {
    /**
     * GET /api/custom-dashboards/me
     * Retorna o layout do usuário logado.
     */
    async me(ctx) {
      try {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized("Usuário não autenticado");
  
        // 🔹 Busca layout do usuário
        const userLayout = await strapi.db
          .query("api::custom-dashboard.custom-dashboard")
          .findOne({
            where: { users_permissions_user: user.id },
            select: ["id", "layout", "is_default"],
          });
  
        if (userLayout) return ctx.send(userLayout);
  
        // 🔹 Se não existir, retorna layout padrão
        const defaultLayout = await strapi.db
          .query("api::custom-dashboard.custom-dashboard")
          .findOne({
            where: { is_default: true },
            select: ["id", "layout", "is_default"],
          });
  
        if (defaultLayout) return ctx.send(defaultLayout);
  
        return ctx.notFound("Nenhum layout encontrado (usuário ou padrão).");
      } catch (err) {
        strapi.log.error("❌ Erro em custom-dashboard.me:", err);
        return ctx.internalServerError("Erro ao buscar layout do usuário");
      }
    },
  
    /**
     * PUT /api/custom-dashboards/me
     * Cria/atualiza o layout do usuário logado.
     */
    async updateMe(ctx) {
      try {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized("Usuário não autenticado");
  
        const { layout } = ctx.request.body || {};
        const isValidLayout =
          layout && (Array.isArray(layout) || typeof layout === "object");
  
        if (!isValidLayout) {
          return ctx.badRequest(
            "Campo 'layout' é obrigatório e deve ser um JSON válido."
          );
        }
  
        // 🔹 Verifica se o usuário já possui layout salvo
        const existing = await strapi.db
          .query("api::custom-dashboard.custom-dashboard")
          .findOne({
            where: { users_permissions_user: user.id },
            select: ["id"],
          });
  
        if (existing) {
          const updated = await strapi.db
            .query("api::custom-dashboard.custom-dashboard")
            .update({
              where: { id: existing.id },
              data: { layout, is_default: false },
            });
  
          return ctx.send(updated);
        }
  
        // 🔹 Cria novo layout
        const created = await strapi.db
          .query("api::custom-dashboard.custom-dashboard")
          .create({
            data: {
              layout,
              is_default: false,
              users_permissions_user: user.id,
            },
          });
  
        return ctx.send(created);
      } catch (err) {
        strapi.log.error("❌ Erro em custom-dashboard.updateMe:", err);
        return ctx.internalServerError("Erro ao salvar layout do usuário");
      }
    },
  
    /**
     * GET /api/custom-dashboards/reset
     * Retorna o layout padrão global (is_default=true).
     */
    async reset(ctx) {
      try {
        const defaultLayout = await strapi.db
          .query("api::custom-dashboard.custom-dashboard")
          .findOne({
            where: { is_default: true },
            select: ["id", "layout", "is_default"],
          });
  
        if (!defaultLayout) {
          return ctx.notFound("Layout padrão não encontrado.");
        }
  
        return ctx.send(defaultLayout);
      } catch (err) {
        strapi.log.error("❌ Erro em custom-dashboard.reset:", err);
        return ctx.internalServerError("Erro ao buscar layout padrão");
      }
    },
  };  