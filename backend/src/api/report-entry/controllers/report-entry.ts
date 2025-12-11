/**
 * report-entry controller (extendido)
 */

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

    async delete(ctx) {
      try {
        const { id } = ctx.params;

        const deleted = await strapi.entityService.delete(
          "api::report-entry.report-entry",
          id
        );

        return {
          ok: true,
          message: "Relatório excluído",
          data: deleted,
        };

      } catch (error) {
        console.error("Erro ao deletar relatório:", error);
        return ctx.internalServerError("Erro ao deletar relatório");
      }
    },

    async find(ctx) {
      try {
        const tenant = await getTenantAtivo(ctx);
        if (!tenant) {
          return ctx.notFound("Tenant não encontrado ou inativo");
        }
    
        const resultado = await strapi.entityService.findMany(
          "api::report-entry.report-entry",
          {
            filters: {
              tenant: tenant.cliente_name,
            },
            sort: { createdAt: "desc" },
          }
        );
    
        return { data: resultado };
    
      } catch (error) {
        console.error("Erro ao buscar relatórios:", error);
        return ctx.internalServerError("Erro ao consultar relatórios");
      }
    }

  })
);
