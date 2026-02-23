import { calcularRiskOperacionalTenant } from "../src/api/acesso-wazuh/services/risklevel.service";
import storageService from "../src/api/storage/services/storage";
import {
  getFirewallsOfflinePorTenant,
  getAtivosPorTenant,
} from "../src/api/admin-multitenant/services/admin-multitenant";

let isRunning = false; // 🔒 Lock anti-sobreposição

export default {
  snapshotRiskDebug: {
    task: async ({ strapi }) => {

      if (isRunning) {
        strapi.log.warn("⚠️ Snapshot já está em execução. Pulando ciclo.");
        return;
      }

      isRunning = true;

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
        // CALCULA ATIVOS (UMA VEZ)
        // ============================

        const tenantIds = tenants.map(t => t.id);
        let ativosMap: Record<number, number> = {};

        try {
          ativosMap = await getAtivosPorTenant(tenantIds);
        } catch (err) {
          strapi.log.error("❌ Erro ao calcular ativos:", err);
        }

        // ============================
        // PROCESSAMENTO POR TENANT
        // ============================

        for (const tenant of tenants) {

          try {

            const ativos = ativosMap[tenant.id] || 0;

            strapi.log.info(
              `➡️ ${tenant.organizacao} | Ativos: ${ativos}`
            );

            // ============================
            // CALCULA RISK
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
                `❌ Wazuh offline ou erro externo (${tenant.organizacao})`,
                err
              );
              fail++;
              continue; // NÃO atualiza snapshot
            }

            // ============================
            // VALIDAÇÃO RIGOROSA
            // ============================

            if (
              !result ||
              typeof result.indiceRisco !== "number" ||
              isNaN(result.indiceRisco)
            ) {
              strapi.log.warn(
                `⚠️ Risk inválido para ${tenant.organizacao}. Snapshot NÃO atualizado.`
              );
              fail++;
              continue;
            }

            // Proteção opcional contra retorno zerado suspeito
            if (
              result.indiceRisco === 0 &&
              result.severidades?.critico === 0 &&
              result.severidades?.alto === 0
            ) {
              strapi.log.warn(
                `⚠️ Dados suspeitos (todos 0) para ${tenant.organizacao}. Mantendo último snapshot.`
              );
              fail++;
              continue;
            }

            // ============================
            // VOLUME (GB)
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
                `❌ Erro ao calcular offline (${tenant.organizacao})`,
                err
              );
            }

            // ============================
            // UPDATE OU CREATE (BUSCA DIRETA)
            // ============================

            const existing = await strapi
              .documents("api::tenant-summary.tenant-summary")
              .findFirst({
                filters: {
                  tenant: tenant.documentId,
                  period: 1,
                },
              });

            const data = {
              risk: result.indiceRisco,
              period: 1,
              snapshot_at: new Date(),
              critical_inc: result.severidades.critico,
              high_inc: result.severidades.alto,
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
                  data: {
                    tenant: tenant.documentId,
                    ...data,
                  },
                });

              strapi.log.info(`🆕 Criado → ${tenant.organizacao}`);
            }

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
          `🎯 SNAPSHOT FINALIZADO | Sucesso: ${success} | Falhas: ${fail} | Tempo: ${totalTime}s`
        );

      } catch (err: any) {
        strapi.log.error("❌ ERRO GERAL DO SNAPSHOT:", err.message);
      } finally {
        isRunning = false; // 🔓 Libera lock SEMPRE
      }
    },

    options: {
      rule: "0 */5 * * * *",
    },
  },
};