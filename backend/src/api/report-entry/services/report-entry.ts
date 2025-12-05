/**
 * report-entry service (extendido — versão somente Vulnerabilidades)
 */

 import { factories } from "@strapi/strapi";

 // Apenas o service que estamos usando agora
 import { buscarVulnSeveridades } from "../../acesso-wazuh/services/vulnerabilidades.service";
 
 import { getTenantAtivo } from "../../acesso-wazuh/controllers/_utils";
 
 export default factories.createCoreService(
   "api::report-entry.report-entry",
   ({ strapi }) => ({
 
     /**
      * ==========================================================
      * GERAR RELATÓRIO (versão mínima — apenas Vulnerabilidades)
      * ==========================================================
      */
     async gerarRelatorio(ctx) {
       try {
         const user = ctx.state.user;
         if (!user) throw new Error("Usuário não autenticado");
 
         const tenant = await getTenantAtivo(ctx);
         if (!tenant) throw new Error("Tenant ativo não encontrado");
 
         // Dados enviados pelo frontend
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
          * EXECUTA APENAS A SEÇÃO: "Vulnerabilidades"
          * ================================================
          */
 
         if (sections.includes("Vulnerabilidades Detectadas")) {
           snapshot.vulnerabilidades = await buscarVulnSeveridades(tenant, {
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
 