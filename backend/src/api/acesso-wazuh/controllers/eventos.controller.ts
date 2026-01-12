import {
  buscarEventosOvertime,
  buscarEventosSummary,
  buscarRuleDistribution
} from "../services/acesso-wazuh";

import { getTenantAtivo } from "./_utils";

export default {
  // -----------------------------
  // OVERTIME
  // -----------------------------
  async overtimeEventos(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const { from, to, dias = "todos" } = ctx.query;

      let resultado;

      // PRIORIDADE: range absoluto (calendário)
      if (from && to) {
        resultado = await buscarEventosOvertime(tenant, {
          from: String(from),
          to: String(to),
        });
      }
      // FALLBACK: modelo antigo por dias
      else {
        resultado = await buscarEventosOvertime(tenant, {
          dias: String(dias),
        });
      }

      return ctx.send({ overtime: resultado });

    } catch (error) {
      console.error("Erro ao buscar eventos overtime:", error);
      return ctx.internalServerError("Erro ao consultar eventos overtime");
    }
  },

  // -----------------------------
  // SUMMARY
  // -----------------------------
  async eventosSummary(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) return ctx.notFound("Tenant não encontrado");

      const { from, to, dias } = ctx.query;

      const resultado = await buscarEventosSummary(tenant, {
        from,
        to,
        dias,
      });

      return ctx.send({ eventos: resultado });
    } catch (error) {
      console.error(error);
      return ctx.internalServerError("Erro ao consultar eventos summary");
    }
  },

  // -----------------------------
  // RULE DISTRIBUTION
  // -----------------------------
  async ruleDistribution(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) return ctx.notFound("Tenant não encontrado ou inativo");

      const { from, to, dias = "todos" } = ctx.query;

      const resultado = await buscarRuleDistribution(tenant, {
        from: from ? String(from) : undefined,
        to: to ? String(to) : undefined,
        dias: String(dias),
      });

      return ctx.send({ rules: resultado });

    } catch (error) {
      console.error("Erro ao buscar rule distribution:", error);
      return ctx.internalServerError("Erro ao consultar rule distribution");
    }
  }
  
};
