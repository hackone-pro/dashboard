import { calcularRiskOperacionalTenant } from "../services/risklevel.service";
import { getTenantAtivo } from "./_utils";

export default {
  async riskLevel(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) {
        return ctx.unauthorized("Usuário não autenticado");
      }

      // =====================================================
      // 🔹 FILTROS DE TEMPO
      // =====================================================
      const periodo =
        ctx.query.from && ctx.query.to
          ? { from: ctx.query.from, to: ctx.query.to }
          : null;

      const diasGlobal = ctx.query.dias || "1";

      const diasFirewall = ctx.query.firewall || diasGlobal;
      const diasAgentes = ctx.query.agentes || diasGlobal;
      const diasIris = ctx.query.iris || diasGlobal;

      // =====================================================
      // 🔹 TENANT
      // =====================================================
      const tenant = await getTenantAtivo(ctx);

      strapi.log.info("========== TENANT INDIVIDUAL ==========");
      strapi.log.info(JSON.stringify(tenant, null, 2));

      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      // =====================================================
      // 🔹 CÁLCULO CENTRALIZADO NO SERVICE
      // =====================================================
      const resultado = await calcularRiskOperacionalTenant(
        tenant,
        {
          diasFirewall,
          diasAgentes,
          diasIris,
          periodo,
          user: ctx.state.user,
        }
      );

      // Log técnico opcional
      strapi.log.info(
        `RiskLevel → C=${resultado.severidades.critico}, ` +
        `A=${resultado.severidades.alto}, ` +
        `M=${resultado.severidades.medio}, ` +
        `B=${resultado.severidades.baixo}, ` +
        `Total=${resultado.severidades.total}`
      );

      // =====================================================
      // 🔹 RESPONSE FINAL
      // =====================================================
      return ctx.send({
        severidades: resultado.severidades,
        indiceRisco: resultado.indiceRisco,
        filtrosUsados: {
          diasGlobal,
          periodo,
          diasFirewall,
          diasAgentes,
          diasIris,
        },
      });

    } catch (error) {
      console.error("Erro ao calcular RiskLevel:", error);
      return ctx.internalServerError("Erro ao calcular RiskLevel");
    }
  },
};
