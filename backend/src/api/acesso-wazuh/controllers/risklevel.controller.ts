import {
  buscarTopGeradoresFirewall,
  buscarTopAgentes,
} from "../services/acesso-wazuh";

import { buscarIncidentesIris } from "../../acesso-iris/services/acesso-iris";
import { getTenantAtivo } from "./_utils";

/**
 * =====================================================
 * CÁLCULO FINAL DO ÍNDICE DE RISK LEVEL (OPERACIONAL)
 *
 * REGRAS:
 * - SEM crítico → nunca passa de 70%
 * - CRÍTICO domina
 * - Alto e Médio influenciam com teto
 * - Baixo nunca gera pânico
 * =====================================================
 */
function calcularRiskLevel({
  critico,
  alto,
  medio,
  baixo,
}: {
  critico: number;
  alto: number;
  medio: number;
  baixo: number;
}) {
  // CRÍTICO → incidente real
  if (critico > 0) {
    return Math.min(100, 80 + Math.log10(1 + critico) * 8);
  }

  // ALTO (sem crítico) → teto 70
  if (alto > 0) {
    const impactoAlto = Math.min(20, Math.log10(1 + alto) * 12);
    const impactoMedio = Math.min(10, Math.log10(1 + medio) * 4);

    return Math.min(70, 30 + impactoAlto + impactoMedio);
  }

  // MÉDIO → teto 55
  if (medio > 0) {
    return Math.min(55, 20 + Math.log10(1 + medio) * 10);
  }

  // BAIXO → teto 30
  if (baixo > 0) {
    return Math.min(30, 10 + Math.log10(1 + baixo) * 4);
  }

  return 0;
}

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

      const timeIris = periodo
        ? { from: periodo.from, to: periodo.to }
        : { dias: diasIris };

      // =====================================================
      // 🔹 TENANT
      // =====================================================
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      // =====================================================
      // 🔹 BUSCAS EM PARALELO (SOMENTE OPERACIONAL)
      // =====================================================
      const [firewalls, agentes, iris] = await Promise.all([
        buscarTopGeradoresFirewall(tenant, diasFirewall, periodo),
        buscarTopAgentes(tenant, {
          dias: diasAgentes,
          from: periodo?.from,
          to: periodo?.to,
        }),
        buscarIncidentesIris(tenant, timeIris, ctx.state.user),
      ]);

      // =====================================================
      // 🔹 SEVERIDADES OPERACIONAIS (CARD)
      // =====================================================
      let baixo = 0;
      let medio = 0;
      let alto = 0;
      let critico = 0;

      // 🔸 Firewall
      firewalls.forEach((fw) => {
        baixo += fw.severidade.baixo;
        medio += fw.severidade.medio;
        alto += fw.severidade.alto;
        critico += fw.severidade.critico;
      });

      // 🔸 Hosts / Agentes
      agentes.forEach((agente) => {
        agente.severidades.forEach((s) => {
          if (s.key <= 6) baixo += s.doc_count;
          else if (s.key <= 11) medio += s.doc_count;
          else if (s.key <= 14) alto += s.doc_count;
          else critico += s.doc_count;
        });
      });

      // 🔸 IRIS
      if (iris && typeof iris === "object") {
        baixo += iris.baixo || 0;
        medio += iris.medio || 0;
        alto += iris.alto || 0;
        critico += iris.critico || 0;
      }

      // =====================================================
      // 🔹 TOTAL DO CARD (APENAS SEVERIDADES)
      // =====================================================
      const total = baixo + medio + alto + critico;

      // =====================================================
      // 🔹 ÍNDICE DE RISCO (APENAS OPERACIONAL)
      // =====================================================
      const indiceRisco = calcularRiskLevel({
        critico,
        alto,
        medio,
        baixo,
      });

      // 🔹 Log técnico
      strapi.log.info(
        `RiskLevel → C=${critico}, A=${alto}, M=${medio}, B=${baixo}, Total=${total}`
      );

      // =====================================================
      // 🔹 RESPONSE FINAL
      // =====================================================
      return ctx.send({
        severidades: {
          baixo,
          medio,
          alto,
          critico,
          total,
        },
        indiceRisco: parseFloat(indiceRisco.toFixed(2)),
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
