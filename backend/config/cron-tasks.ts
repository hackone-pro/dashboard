import { calcularRiskOperacionalTenant } from "../src/api/acesso-wazuh/services/risklevel.service";
import storageService from "../src/api/storage/services/storage";

export default {
  snapshotRiskDebug: {
    task: async ({ strapi }) => {
      const startTime = Date.now();

      strapi.log.info("🔥 SNAPSHOT RISK INICIADO");

      let success = 0;
      let fail = 0;

      try {
        const tenants = await strapi.db
          .query("api::tenant.tenant")
          .findMany({
            where: {
              ativa: true,
              publishedAt: { $notNull: true },
            },
          });

        strapi.log.info(`📦 Tenants encontrados: ${tenants.length}`);

        const snapshots = await strapi
          .documents("api::tenant-summary.tenant-summary")
          .findMany({
            filters: { period: 1 },
            populate: ["tenant"],
          });

        const snapshotMap = new Map();

        for (const snap of snapshots) {
          if (snap.tenant?.documentId) {
            snapshotMap.set(snap.tenant.documentId, snap);
          }
        }

        for (const tenant of tenants) {
          strapi.log.info(
            `➡️ Processando tenant ${tenant.id} - ${tenant.organizacao}`
          );

          try {
            const result = await calcularRiskOperacionalTenant(tenant, {
              diasFirewall: "1",
              diasAgentes: "1",
              diasIris: "1",
            });

            if (!result || typeof result.indiceRisco !== "number") {
              strapi.log.warn(
                `⚠️ Risk inválido para tenant ${tenant.id}`
              );
              fail++;
              continue;
            }

            // ============================
            // VOLUME (GB)
            // ============================

            let volumeGB = 0;
            try {
              volumeGB = Number(storageService.lerStateUsedGB(tenant.organizacao).toFixed(2));
            } catch (err) {
              strapi.log.warn(`⚠️ Falha ao ler state.used para tenant ${tenant.id}`);
            }

            const existing = snapshotMap.get(tenant.documentId);

            if (existing) {
              await strapi
                .documents("api::tenant-summary.tenant-summary")
                .update({
                  documentId: existing.documentId,
                  data: {
                    risk: result.indiceRisco,
                    period: 1,
                    snapshot_at: new Date(),
                    critical_inc: result.severidades.critico,
                    high_inc: result.severidades.alto,
                    volume_gb: volumeGB,
                  },
                });

              strapi.log.info(`♻️ Atualizado → ${tenant.organizacao}`);

            } else {
              await strapi
                .documents("api::tenant-summary.tenant-summary")
                .create({
                  data: {
                    tenant: tenant.documentId,
                    risk: result.indiceRisco,
                    period: 1,
                    snapshot_at: new Date(),
                    critical_inc: result.severidades.critico,
                    high_inc: result.severidades.alto,
                    volume_gb: volumeGB,
                  },
                });

              strapi.log.info(`🆕 Criado → ${tenant.organizacao}`);
            }

            success++;

          } catch (err: any) {
            strapi.log.error(
              `❌ ERRO ao processar tenant ${tenant.id}: ${err.message}`
            );
            fail++;
          }
        }

        const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

        strapi.log.info(
          `🎯 SNAPSHOT FINALIZADO | Sucesso: ${success} | Falhas: ${fail} | Tempo: ${totalTime}s`
        );

      } catch (err: any) {
        strapi.log.error("❌ ERRO GERAL DO SNAPSHOT:", err.message);
      }
    },

    options: {
      rule: "0 */5 * * * *",
    },
  },
};
