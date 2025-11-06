import { gerarRelatorioN8N, buscarDadosReport } from "../services/reports";

export default {
  // 🔹 POST → dispara geração no n8n
  async gerar(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Usuário não autenticado");

      const { customer, period } = ctx.request.body;

      if (!customer) return ctx.badRequest("Campo 'customer' é obrigatório");

      const resultado = await gerarRelatorioN8N(customer, period);

      return ctx.send({
        success: true,
        message: "Relatório solicitado com sucesso",
        response: resultado,
      });
    } catch (err: any) {
      strapi.log.error("❌ Erro no controller reports.gerar:", err.message || err);
      return ctx.internalServerError("Erro ao gerar relatório remoto.");
    }
  },

  // 🔹 GET → obtém dados do relatório gerado
  async data(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Usuário não autenticado");

      const { cliente } = ctx.params;
      const { period } = ctx.query;
      const periodo = period || "15";

      const dados = await buscarDadosReport(periodo, cliente);

      return ctx.send({
        tenant: cliente,
        period: periodo,
        data: dados,
      });
    } catch (err: any) {
      strapi.log.error("❌ Erro no controller reports.data:", err.message || err);
      return ctx.internalServerError("Erro ao buscar dados do relatório remoto.");
    }
  },
};
