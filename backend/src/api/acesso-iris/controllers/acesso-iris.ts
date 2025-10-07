import { buscarCasos } from "../services/acesso-iris";
import { parse, isAfter, isBefore, startOfDay, endOfDay, subDays } from 'date-fns';

export default {
  // LISTA TODOS OS CASOS IRIS
  async listCases(ctx) {
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

      const data = await buscarCasos(fullUser.tenant, fullUser);

      return data;
    } catch (err) {
      strapi.log.error("❌ Erro ao buscar casos no Iris:", err.response?.data || err);
      return ctx.badRequest("Erro ao acessar Iris");
    }
  },

  // LISTA SOMENTE CASOS RECENTES (últimas 24 horas)
  async listarRecentes(ctx) {
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

      const casosResponse = await buscarCasos(fullUser.tenant, fullUser);
      const casos = casosResponse.data || casosResponse;

      // 🔽 PARTE NOVA — tratar query param ?range=7d etc
      const range = ctx.query.range || "1d"; // default para 1d (24h)

      let dias = 1;
      if (range === "7d") dias = 7;
      if (range === "30d") dias = 30;

      const inicio = startOfDay(subDays(new Date(), dias));
      const fim = endOfDay(new Date());

      const recentes = casos.filter((caso) => {
        if (!caso.case_open_date) return false;

        const data = parse(caso.case_open_date, 'MM/dd/yyyy', new Date());
        return isAfter(data, inicio) && isBefore(data, fim);
      });

      return ctx.send(recentes);
    } catch (err) {
      strapi.log.error("❌ Erro ao listar casos recentes:", err.response?.data || err);
      return ctx.internalServerError("Erro ao buscar casos recentes");
    }
  }
};