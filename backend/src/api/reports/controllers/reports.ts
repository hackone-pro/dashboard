import { buscarDadosReport } from "../services/reports";

export default {
  async data(ctx) {
    try {
      // 🔒 Autenticação obrigatória
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Usuário não autenticado");

      // 🔹 Busca o tenant do usuário logado
      const fullUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { id: user.id },
          populate: { tenant: true },
        });

      if (!fullUser?.tenant)
        return ctx.notFound("Tenant não encontrado para este usuário");

      // 🔹 Parâmetro opcional ?period=15
      const { period } = ctx.query;
      const periodo = period || "15";

      // 🔹 Busca os dados no serviço
      const dados = await buscarDadosReport(periodo);

      // 🔹 Retorna o JSON completo
      return ctx.send({
        tenant: fullUser.tenant.cliente_name || fullUser.tenant.name,
        period: periodo,
        data: dados,
      });
    } catch (err: any) {
      strapi.log.error("❌ Erro no controller acesso-report.data:", err.message || err);
      return ctx.internalServerError("Erro ao buscar dados do relatório remoto.");
    }
  },
};
