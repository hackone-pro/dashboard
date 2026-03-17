import { factories } from "@strapi/strapi";
import { getTenantAtivo } from "../../acesso-wazuh/controllers/_utils";

export default factories.createCoreController(
  "api::report-entry.report-entry",
  ({ strapi }) => ({

    async generate(ctx) {
      try {
        const service = strapi.service("api::report-entry.report-entry");
        const result = await service.gerarRelatorio(ctx);
        return ctx.send({
          ok: true,
          message: "Relatório gerado com sucesso",
          data: result,
        });
      } catch (error) {
        console.error("Erro ao gerar relatório:", error);
        return ctx.internalServerError("Erro ao gerar relatório");
      }
    },

    async search(ctx) {
      try {
        const { nome } = ctx.query;
        if (!nome) return ctx.badRequest("Parâmetro 'nome' é obrigatório");

        const knex = strapi.db.connection;

        const resultado = await knex("report_entries")
          .select("*")
          .where({ nome })
          .whereNull("published_at")
          .first();

        if (!resultado) {
          return ctx.notFound("Relatório não encontrado");
        }

        if (typeof resultado.snapshot === "string") {
          try { resultado.snapshot = JSON.parse(resultado.snapshot); }
          catch (e) { resultado.snapshot = {}; }
        }

        if (typeof resultado.sections === "string") {
          try { resultado.sections = JSON.parse(resultado.sections); }
          catch (e) { resultado.sections = []; }
        }

        return ctx.send({ data: resultado });

      } catch (error) {
        console.error("Erro ao buscar relatório:", error);
        return ctx.internalServerError("Erro ao buscar relatório");
      }
    },

    async find(ctx) {
      try {
        const tenant = await getTenantAtivo(ctx);
        if (!tenant) return ctx.notFound("Tenant não encontrado ou inativo");

        const knex = strapi.db.connection;

        const relatorios = await knex("report_entries")
          .select(
            "id",
            "nome",
            "period",
            "tenant",
            "progress",
            "created_at as createdAt",
            "updated_at as updatedAt"
          )
          .where({ tenant: tenant.cliente_name })
          .whereNull("published_at")
          .orderBy("created_at", "desc")
          .limit(50);

        return ctx.send({ data: relatorios });

      } catch (error) {
        console.error("Erro ao buscar relatórios:", error);
        return ctx.internalServerError("Erro ao consultar relatórios");
      }
    },

    async delete(ctx) {
      try {
        const { id } = ctx.params;
        const deleted = await strapi.entityService.delete(
          "api::report-entry.report-entry",
          id
        );
        return { ok: true, message: "Relatório excluído", data: deleted };
      } catch (error) {
        console.error("Erro ao deletar relatório:", error);
        return ctx.internalServerError("Erro ao deletar relatório");
      }
    },

  })
);