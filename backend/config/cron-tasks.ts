import { calcularRiskOperacionalTenant } from "../src/api/acesso-wazuh/services/risklevel.service";
import storageService from "../src/api/storage/services/storage";
import {
  getFirewallsOfflinePorTenant,
  getAtivosPorTenant,
} from "../src/api/admin-multitenant/services/admin-multitenant";

let runningSince: number | null = null;
const MAX_EXECUTION_TIME = 10 * 60 * 1000; // 10 minutos

export default {
  snapshotRiskDebug: {
    task: async ({ strapi }) => {

      const now = Date.now();

      // 🔒 Lock com timeout inteligente
      if (runningSince && now - runningSince < MAX_EXECUTION_TIME) {
        strapi.log.warn("⚠️ Snapshot ainda rodando. Pulando ciclo.");
        return;
      }

      if (runningSince && now - runningSince >= MAX_EXECUTION_TIME) {
        strapi.log.warn("⚠️ Snapshot anterior travou. Reiniciando execução.");
      }

      runningSince = now;

      const startTime = Date.now();
      strapi.log.info("🚀 SNAPSHOT RISK INICIADO");

      let success = 0;
      let fail = 0;

      try {

        // ============================
        // BUSCA TENANTS ATIVOS
        // ============================

        const tenants = await strapi.db
          .query("api::tenant.tenant")
          .findMany({
            where: {
              ativa: true,
              publishedAt: { $notNull: true },
            },
          });

        if (!tenants.length) {
          strapi.log.warn("⚠️ Nenhum tenant ativo encontrado.");
          return;
        }

        strapi.log.info(`📦 Tenants encontrados: ${tenants.length}`);

        // ============================
        // CALCULA ATIVOS (1x só)
        // ============================

        const tenantIds = tenants.map(t => t.id);
        let ativosMap: Record<number, number> = {};

        try {
          ativosMap = await getAtivosPorTenant(tenantIds);
        } catch (err) {
          strapi.log.error("❌ Erro ao calcular ativos:", err);
        }

        // ============================
        // LOOP POR TENANT
        // ============================

        for (const tenant of tenants) {

          const tenantStart = Date.now();

          try {

            const ativos = ativosMap[tenant.id] || 0;

            strapi.log.info(
              `➡️ ${tenant.organizacao} | Ativos: ${ativos}`
            );

            // ============================
            // CALCULA RISK (pode falhar)
            // ============================

            let result;

            try {
              result = await calcularRiskOperacionalTenant(tenant, {
                diasFirewall: "1",
                diasAgentes: "1",
                diasIris: "1",
              });
            } catch (err) {
              strapi.log.error(
                `❌ Erro externo (${tenant.organizacao})`,
                err
              );
              fail++;
              continue; // 🔥 pula tenant
            }

            // ============================
            // VALIDAÇÃO
            // ============================

            if (
              !result ||
              (result.indiceRisco !== null &&
                (typeof result.indiceRisco !== "number" ||
                  isNaN(result.indiceRisco)))
            ) {
              strapi.log.warn(
                `⚠️ Risk inválido para ${tenant.organizacao}.`
              );
              fail++;
              continue;
            }

            // ============================
            // VOLUME
            // ============================

            let volumeGB = 0;
            try {
              volumeGB = Number(
                storageService
                  .lerStateUsedGB(tenant.organizacao)
                  .toFixed(2)
              );
            } catch {
              strapi.log.warn(
                `⚠️ Falha ao ler volume para ${tenant.organizacao}`
              );
            }

            // ============================
            // FIREWALLS OFFLINE
            // ============================

            let firewallsOffline = 0;
            try {
              const offlineMap = await getFirewallsOfflinePorTenant([tenant]);
              firewallsOffline = offlineMap[tenant.id] || 0;
            } catch (err) {
              strapi.log.error(
                `❌ Erro offline (${tenant.organizacao})`,
                err
              );
            }

            // ============================
            // BUSCA EXISTENTE
            // ============================

            const existing = await strapi
              .documents("api::tenant-summary.tenant-summary")
              .findFirst({
                filters: {
                  tenant_numeric_id: tenant.id,
                  period: 1,
                },
              });

            const data = {
              tenant: tenant.documentId,        // mantém relação
              tenant_numeric_id: tenant.id,     // chave técnica
              risk: result.indiceRisco,
              period: 1,
              snapshot_at: new Date(),
              critical_inc: result.severidades?.critico ?? 0,
              high_inc: result.severidades?.alto ?? 0,
              volume_gb: volumeGB,
              logs_offline: firewallsOffline,
              ativos: ativos,
            };

            if (existing) {

              await strapi
                .documents("api::tenant-summary.tenant-summary")
                .update({
                  documentId: existing.documentId,
                  data,
                });

              strapi.log.info(`♻️ Atualizado → ${tenant.organizacao}`);

            } else {

              await strapi
                .documents("api::tenant-summary.tenant-summary")
                .create({
                  data,
                });

              strapi.log.info(`🆕 Criado → ${tenant.organizacao}`);
            }

            const tenantTime = ((Date.now() - tenantStart) / 1000).toFixed(2);

            strapi.log.info(
              `⏱️ ${tenant.organizacao} processado em ${tenantTime}s`
            );

            success++;

          } catch (err: any) {
            strapi.log.error(
              `❌ ERRO inesperado tenant ${tenant.id}: ${err.message}`
            );
            fail++;
          }
        }

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

        strapi.log.info(
          `🎯 SNAPSHOT FINALIZADO | Sucesso: ${success} | Falhas: ${fail} | Tempo total: ${totalTime}s`
        );

      } catch (err: any) {
        strapi.log.error("❌ ERRO GERAL DO SNAPSHOT:", err.message);
      } finally {
        runningSince = null; // 🔓 libera lock sempre
      }
    },

    options: {
      rule: "0 */5 * * * *",
    },
  },
};