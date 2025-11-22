import {
    buscarTopGeradoresFirewall,
    buscarTopAgentes,
    buscarSeveridadeIndexer,
  } from "../services/acesso-wazuh";
  
  import { buscarIncidentesIris } from "../../acesso-iris/services/acesso-iris";
  
  import { getTenantAtivo } from "./_utils";
  
  export default {
    async riskLevel(ctx) {
      try {
        const userId = ctx.state.user?.id;
        if (!userId) return ctx.unauthorized("Usuário não autenticado");
  
        // Filtros
        const diasGlobal = ctx.query.dias || "1";
        const diasFirewall = ctx.query.firewall || diasGlobal;
        const diasAgentes = ctx.query.agentes || diasGlobal;
        const diasSeveridade = ctx.query.severidade || diasGlobal;
        const diasIris = ctx.query.iris || diasGlobal;
  
        // Tenant ativo
        const tenant = await getTenantAtivo(ctx);
        if (!tenant) return ctx.notFound("Tenant não encontrado ou inativo");
  
        // Buscar dados simultaneamente
        const [fw, agentes, severidade, iris] = await Promise.all([
          buscarTopGeradoresFirewall(tenant, diasFirewall),
          buscarTopAgentes(tenant, diasAgentes),
          buscarSeveridadeIndexer(tenant, diasSeveridade),
          buscarIncidentesIris(tenant, diasIris, ctx.state.user),
        ]);
  
        // Totais
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
  
        // Cálculo do índice de risco
        const risco =
          total > 0
            ? ((baixo * 0.2 + medio * 0.6 + alto * 0.8 + critico * 1.0) / total) * 100
            : 0;
  
        // Log
        strapi.log.info(
          `🧩 RiskLevel (${diasGlobal}d): FW=${fw.length}, Agentes=${agentes.length}, IRIS=${iris.total || 0}, Severidade.total=${severidade.total || 0}`
        );
  
        return ctx.send({
          severidades: { baixo, medio, alto, critico, total },
          indiceRisco: parseFloat(risco.toFixed(2)),
          filtrosUsados: {
            diasGlobal,
            diasFirewall,
            diasAgentes,
            diasSeveridade,
            diasIris,
          },
        });
  
      } catch (error) {
        console.error("❌ Erro ao calcular RiskLevel:", error);
        return ctx.internalServerError("Erro ao calcular RiskLevel");
      }
    },
  };  