import { getTenantAtivo } from "../../acesso-wazuh/controllers/_utils";

export default {
  async gerar(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) return ctx.notFound("Tenant não encontrado");

      const { period } = ctx.request.body;

      const service = strapi.service("api::n-eight-n.n-eight-n");

      const resp = await service.gerarRelatorioN8N(
        tenant.cliente_name,
        period
      );

      return ctx.send({ ok: true, resposta: resp });

    } catch (err) {
      console.error(err);
      return ctx.internalServerError("Erro ao solicitar relatório remoto");
    }
  },

  async data(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) return ctx.notFound("Tenant não encontrado");

      const { period = "15" } = ctx.query;

      const service = strapi.service("api::n-eight-n.n-eight-n");

      const dados = await service.buscarDadosReport(period, tenant.cliente_name);

      return ctx.send({ ok: true, data: dados });

    } catch (err) {
      console.error(err);
      return ctx.internalServerError("Erro ao buscar dados do relatório");
    }
  },
};
