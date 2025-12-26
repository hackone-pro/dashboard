// src/api/acesso-wazuh/controllers/mitre-techniques.controller.ts
import { buscarTopMitreTechniques, buscarTopMitreTactics } from "../services/mitre-techniques.service";
import { getTenantAtivo } from "./_utils";

export default {
    /* ======================================================
          MITRE — TÉCNICAS + TÁTICAS
    ====================================================== */
    async topMitreTechniques(ctx) {
      try {
        const tenant = await getTenantAtivo(ctx);
        if (!tenant) {
          return ctx.notFound("Tenant não encontrado ou inativo");
        }
  
        const dias = ctx.query.dias || "7";
  
        const [techniques, tactics] = await Promise.all([
          buscarTopMitreTechniques(tenant, dias),
          buscarTopMitreTactics(tenant, dias),
        ]);
  
        return ctx.send({
          topMitreTechniques: techniques,
          topMitreTactics: tactics,
        });
      } catch (error) {
        console.error("Erro ao buscar MITRE:", error);
        return ctx.internalServerError(
          "Erro ao consultar MITRE Techniques/Tactics"
        );
      }
    },
  };
