/**
 * report-entry controller (extendido)
 */

import { factories } from "@strapi/strapi";

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

    })
);
