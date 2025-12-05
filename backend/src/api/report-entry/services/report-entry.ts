/**
 * report-entry service (extendido)
 */

 import { factories } from "@strapi/strapi";

 // IMPORTAÇÃO DE SERVICES QUE EXISTEM NO SEU PROJETO
 import { buscarTopAgentes } from "../../acesso-wazuh/services/agentes.service";
 import { buscarVulnSeveridades } from "../../acesso-wazuh/services/vulnerabilidades.service";
 
 import { buscarTopGeradoresFirewall } from "../../acesso-wazuh/services/firewalls.service";
 import { buscarSeveridadeIndexer } from "../../acesso-wazuh/services/severidade.service";
 import { buscarIncidentesIris } from "../../acesso-iris/services/acesso-iris";
 
 import { getTenantAtivo } from "../../acesso-wazuh/controllers/_utils";
 
 export default factories.createCoreService(
   "api::report-entry.report-entry",
   ({ strapi }) => ({
 
     /**
      * ==========================================================
      * FUNÇÃO INTERNA - REPLICA O CÁLCULO DO CONTROLLER riskLevel
      * ==========================================================
      */
     async gerarRiskLevel(tenant, dias, user) {
 
       const diasFirewall = dias;
       const diasAgentes = dias;
       const diasSeveridade = dias;
       const diasIris = dias;
 
       const [fw, agentes, severidade, iris] = await Promise.all([
         buscarTopGeradoresFirewall(tenant, diasFirewall),
         buscarTopAgentes(tenant, diasAgentes),
         buscarSeveridadeIndexer(tenant, diasSeveridade),
         buscarIncidentesIris(tenant, diasIris, user),
       ]);
 
       let baixo = severidade.baixo || 0;
       let medio = severidade.medio || 0;
       let alto = severidade.alto || 0;
       let critico = severidade.critico || 0;
       let total = severidade.total || 0;
 
       // Somar Firewalls
       fw.forEach((item) => {
         baixo += item.severidade.baixo;
         medio += item.severidade.medio;
         alto += item.severidade.alto;
         critico += item.severidade.critico;
         total += item.total;
       });
 
       // Somar Agentes
       agentes.forEach((agente) => {
         agente.severidades.forEach((s) => {
           if (s.key <= 6) baixo += s.doc_count;
           else if (s.key <= 11) medio += s.doc_count;
           else if (s.key <= 14) alto += s.doc_count;
           else critico += s.doc_count;
 
           total += s.doc_count;
         });
       });
 
       // Somar IRIS
       if (iris && typeof iris === "object") {
         baixo += iris.baixo || 0;
         medio += iris.medio || 0;
         alto += iris.alto || 0;
         critico += iris.critico || 0;
         total += iris.total || 0;
       }
 
       const indice =
         total > 0
           ? ((baixo * 0.2 + medio * 0.6 + alto * 0.8 + critico * 1.0) / total) * 100
           : 0;
 
       return {
         severidades: { baixo, medio, alto, critico, total },
         indiceRisco: Number(indice.toFixed(2)),
       };
     },
 
     /**
      * ==========================================================
      * GERAR RELATÓRIO
      * ==========================================================
      */
     async gerarRelatorio(ctx) {
       try {
         const user = ctx.state.user;
         if (!user) throw new Error("Usuário não autenticado");
 
         const tenant = await getTenantAtivo(ctx);
         if (!tenant) throw new Error("Tenant ativo não encontrado");
 
         // Pegando os dados enviados pelo frontend
         const { period = "24h", sections = [] } = ctx.request.body;
 
         // Criar registro inicial
         const entry = await strapi.entityService.create(
           "api::report-entry.report-entry",
           {
             data: {
               tenant: tenant.cliente_name,
               period,
               sections,
               progress: "gerando",
               snapshot: {},
             },
           }
         );
 
         const snapshot: Record<string, any> = {};
 
         /**
          * ================================================
          * EXECUTA APENAS O QUE O CLIENTE SELECIONOU
          * ================================================
          */
 
         // ----- NÍVEL DE RISCO -----
         if (sections.includes("Nível de Risco")) {
           snapshot.risklevel = await this.gerarRiskLevel(tenant, period, user);
         }
 
         // ----- VULNERABILIDADES -----
         if (sections.includes("Vulnerabilidades Detectadas")) {
           snapshot.vulnerabilidades = await buscarVulnSeveridades(tenant, {
             dias: period,
           });
         }
 
         // ----- TOP AGENTES -----
         if (sections.includes("Top Agentes")) {
           snapshot.top_agentes = await buscarTopAgentes(tenant, {
             dias: period,
           });
         }
 
         /**
          * FINALIZA
          */
         const finalizado = await strapi.entityService.update(
           "api::report-entry.report-entry",
           entry.id,
           {
             data: {
               progress: "finalizado",
               snapshot,
               updatedAt: new Date(),
             },
           }
         );
 
         return finalizado;
 
       } catch (e) {
         console.error("❌ Erro ao gerar relatório:", e);
         throw e;
       }
     },
 
   })
 );
 