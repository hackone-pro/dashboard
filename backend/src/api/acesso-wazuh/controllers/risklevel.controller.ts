import {
  buscarTopGeradoresFirewall,
  buscarTopAgentes,
  buscarSeveridadeIndexer,
} from "../services/acesso-wazuh";

import { buscarIncidentesIris } from "../../acesso-iris/services/acesso-iris";

import { getTenantAtivo } from "./_utils";

/**
 * Cálculo do índice de Risk Level
 * Baseado na severidade mais alta presente
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
  // CRÍTICO domina
  if (critico > 0) {
    return Math.min(100, 80 + critico * 0.5);
  }

  // ALTO domina (MÉDIO só ajusta levemente)
  if (alto > 0) {
    const impactoAlto = Math.min(30, alto * 1.5); // ALTO é o motor real
    const ajusteMedio = Math.min(10, Math.log10(1 + medio) * 2); // MÉDIO limitado

    return Math.min(80, 40 + impactoAlto + ajusteMedio);
  }

  // MÉDIO (quando não há ALTO)
  if (medio > 0) {
    return Math.min(60, 20 + Math.sqrt(medio) * 1.2);
  }

  // BAIXO
  if (baixo > 0) {
    return Math.min(30, 10 + Math.log10(1 + baixo));
  }

  return 0;
}

export default {
  async riskLevel(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      // 🔹 Período absoluto (calendário) — DEFINIR UMA VEZ
      const periodo =
        ctx.query.from && ctx.query.to
          ? { from: ctx.query.from, to: ctx.query.to }
          : null;

      // 🔹 Dias (fallback)
      const diasGlobal = ctx.query.dias || "1";

      const diasFirewall = ctx.query.firewall || diasGlobal;
      const diasAgentes = ctx.query.agentes || diasGlobal;
      const diasSeveridade = ctx.query.severidade || diasGlobal;
      const diasIris = ctx.query.iris || diasGlobal;

      // 🔹 Montagem correta do time do IRIS
      const timeIris = periodo
        ? { from: periodo.from, to: periodo.to }
        : { dias: diasIris };

      // Tenant ativo
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) return ctx.notFound("Tenant não encontrado ou inativo");

      // 🔹 Buscar dados simultaneamente
      const [fw, agentes, severidade, iris] = await Promise.all([
        buscarTopGeradoresFirewall(
          tenant,
          diasFirewall,
          periodo // (vamos alinhar esse service depois)
        ),
        buscarTopAgentes(
          tenant,
          {
            dias: diasAgentes,
            from: periodo?.from,
            to: periodo?.to,
          }
        ),
        buscarSeveridadeIndexer(
          tenant,
          diasSeveridade,
          periodo
        ),
        buscarIncidentesIris(
          tenant,
          timeIris,
          ctx.state.user
        ),
      ]);

      // 🔹 Totais iniciais (Indexer)
      let baixo = severidade.baixo || 0;
      let medio = severidade.medio || 0;
      let alto = severidade.alto || 0;
      let critico = severidade.critico || 0;
      let total = severidade.total || 0;

      // 🔹 Firewall
      fw.forEach((item) => {
        baixo += item.severidade.baixo;
        medio += item.severidade.medio;
        alto += item.severidade.alto;
        critico += item.severidade.critico;
        total += item.total;
      });

      // 🔹 Agentes
      agentes.forEach((agente) => {
        agente.severidades.forEach((s) => {
          if (s.key <= 6) baixo += s.doc_count;
          else if (s.key <= 11) medio += s.doc_count;
          else if (s.key <= 14) alto += s.doc_count;
          else critico += s.doc_count;

          total += s.doc_count;
        });
      });

      // 🔹 IRIS
      if (iris && typeof iris === "object") {
        baixo += iris.baixo || 0;
        medio += iris.medio || 0;
        alto += iris.alto || 0;
        critico += iris.critico || 0;
        total += iris.total || 0;
      }

      // 🔹 Cálculo final do Risk Level
      const risco = calcularRiskLevel({
        critico,
        alto,
        medio,
        baixo,
      });

      // 🔹 Log técnico
      if (periodo) {
        strapi.log.info(
          `RiskLevel (${periodo.from} → ${periodo.to}): ` +
            `C=${critico}, A=${alto}, M=${medio}, B=${baixo}, Total=${total}`
        );
      } else {
        strapi.log.info(
          `RiskLevel (${diasGlobal}d): ` +
            `C=${critico}, A=${alto}, M=${medio}, B=${baixo}, Total=${total}`
        );
      }

      return ctx.send({
        severidades: {
          baixo,
          medio,
          alto,
          critico,
          total,
        },
        indiceRisco: parseFloat(risco.toFixed(2)),
        filtrosUsados: {
          diasGlobal,
          periodo,
          diasFirewall,
          diasAgentes,
          diasSeveridade,
          diasIris,
        },
      });
    } catch (error) {
      console.error("Erro ao calcular RiskLevel:", error);
      return ctx.internalServerError("Erro ao calcular RiskLevel");
    }
  },
};
