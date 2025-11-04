export default {
  /**
   * GET /api/custom-dashboards/me
   */
  async me(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Usuário não autenticado");

      const layout = await strapi.db.query("api::custom-dashboard.custom-dashboard").findOne({
        where: { user: String(user.id) },
      });

      if (layout) return ctx.send(layout);

      // Busca layout padrão global
      const defaultLayout = await strapi.db.query("api::custom-dashboard.custom-dashboard").findOne({
        where: { is_default: true },
      });

      if (defaultLayout) return ctx.send(defaultLayout);

      return ctx.notFound("Nenhum layout encontrado.");
    } catch (err) {
      strapi.log.error("❌ Erro em custom-dashboard.me:", err);
      return ctx.internalServerError("Erro ao buscar layout.");
    }
  },

  /**
   * PUT /api/custom-dashboards/me
   */
  async updateMe(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Usuário não autenticado");

      const { layout } = ctx.request.body || {};
      if (!layout || !Array.isArray(layout)) {
        return ctx.badRequest("Campo 'layout' deve ser um array JSON válido.");
      }

      const userId = String(user.id);

      strapi.log.info(`🟢 Salvando layout para user=${userId}`);

      // 🔹 Verifica se o usuário já possui registro
      const existing = await strapi.db
        .query("api::custom-dashboard.custom-dashboard")
        .findOne({
          where: { user: userId },
          select: ["id"],
        });

      if (existing) {
        strapi.log.info(`✏️ Atualizando layout existente ID=${existing.id}`);
        const updated = await strapi.db
          .query("api::custom-dashboard.custom-dashboard")
          .update({
            where: { id: existing.id },
            data: {
              layout,
              user: userId,
            },
          });

        strapi.log.info(`✅ Layout atualizado com sucesso`);
        return ctx.send(updated);
      }

      // 🔹 Caso não exista, cria novo
      strapi.log.info(`➕ Criando novo layout para user=${userId}`);
      const created = await strapi.db
        .query("api::custom-dashboard.custom-dashboard")
        .create({
          data: {
            layout,
            user: userId,
          },
        });

      strapi.log.info(`✅ Layout criado ID=${created.id}`);
      return ctx.send(created);
    } catch (err) {
      strapi.log.error("❌ Erro em custom-dashboard.updateMe:", err);
      return ctx.internalServerError("Erro ao salvar layout.");
    }
  },

  /**
   * PUT /api/custom-dashboards/reset-me
   * Atualiza o layout do usuário para o padrão fixo (sem apagar nem recriar).
   */
  async resetMe(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Usuário não autenticado");

      const userId = String(user.id);

      // 🔹 Define o layout padrão fixo (igual ao do frontend)
      const layoutPadrao = [
        { i: "grafico_risco", x: 0, y: 0, w: 3, h: 9 },
        { i: "geo_map", x: 3, y: 0, w: 6, h: 13 },
        { i: "top_paises", x: 9, y: 0, w: 3, h: 13 },
        { i: "top_incidentes", x: 0, y: 10, w: 3, h: 18 },
        { i: "ia_humans", x: 3, y: 12, w: 6, h: 14 },
        { i: "top_firewalls", x: 9, y: 12, w: 3, h: 14 },
      ];

      // 🔹 Busca o registro existente do usuário
      const existing = await strapi.db
        .query("api::custom-dashboard.custom-dashboard")
        .findOne({ where: { user: userId }, select: ["id"] });

      if (!existing) {
        strapi.log.warn(`⚠️ Nenhum layout encontrado para user=${userId}`);
        return ctx.notFound("Layout do usuário não encontrado.");
      }

      // 🔹 Atualiza o layout atual com o padrão fixo
      const updated = await strapi.db
        .query("api::custom-dashboard.custom-dashboard")
        .update({
          where: { id: existing.id },
          data: { layout: layoutPadrao, user: userId },
        });

      strapi.log.info(`🔄 Layout do user=${userId} restaurado para o padrão.`);
      return ctx.send(updated);
    } catch (err) {
      strapi.log.error("❌ Erro em custom-dashboard.resetMe:", err);
      return ctx.internalServerError("Erro ao restaurar layout padrão.");
    }
  }
};
