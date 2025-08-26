import { autenticarWazuh, buscarAgentes } from "../services/acesso-wazuh";

export default {
  async login(ctx) {
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

      const token = await autenticarWazuh(fullUser.tenant);

      return {
        user: fullUser.username,
        tenant: fullUser.tenant.slug,
        wazuhToken: token,
        wazuhUrl: fullUser.tenant.wazuh_url,
      };
    } catch (err) {
      strapi.log.error("Erro no login Wazuh:", err.response?.data || err);
      return ctx.badRequest("Erro ao autenticar no Wazuh");
    }
  },

  async agents(ctx) {
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

      const token = await autenticarWazuh(fullUser.tenant);
      const agents = await buscarAgentes(fullUser.tenant, token);

      return agents;
    } catch (err) {
      strapi.log.error("Erro ao buscar agentes:", err.response?.data || err);
      return ctx.badRequest("Erro ao buscar agentes no Wazuh");
    }
  },
};