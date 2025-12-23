import { buscarTopPaisesAtaque } from "../services/acesso-wazuh";
import { getTenantAtivo } from "./_utils";

/**
 * Controller — Wazuh | Top Países + Geo (Live)
 */
export default {
  /* ======================================================
        TOP PAÍSES (ORIGEM + DESTINO)
     ====================================================== */
  async topPaisesOrigem(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const { dias, range } = ctx.query;

      // 🔹 prioridade para range (live)
      const filtroTempo = range
        ? { range }
        : { dias: dias || "7" };

      const resultado = await buscarTopPaisesAtaque(tenant, filtroTempo);

      return ctx.send({ topPaises: resultado });

    } catch (error) {
      console.error("Erro ao buscar top países de origem:", error);
      return ctx.internalServerError("Erro ao consultar top países");
    }
  },

  /* ======================================================
        GEO — ORIGEM ➝ DESTINO (flows p/ mapa + live)
     ====================================================== */
  async topPaisesOrigemGeo(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const { dias, range } = ctx.query;

      // 🔹 prioridade para range (30s no live)
      const filtroTempo = range
        ? { range }
        : { dias: dias || "7" };

      const resultado = await buscarTopPaisesAtaque(tenant, filtroTempo);

      // 🔹 apenas destinos geram flows
      const destinos = resultado.filter((p: any) => p.tipo === "destino");

      const flows = destinos.flatMap((dest: any) => {
        return (dest.origens || []).map((o: any) => ({
          origem: {
            ip: o.ip,
            pais: o.pais || null,
            cidade: o.cidade || null,
            lat: o.lat ?? null,
            lng: o.lng ?? null,
            srcport: o.srcport ?? null,
            servico: o.servico ?? null,
            interface: o.interface ?? null,
          },

          destino: {
            ip: dest.destino,
            pais: dest.pais || null,
            cidade: dest.cidade || null,
            lat: dest.lat ?? null,
            lng: dest.lng ?? null,
            agente: dest.agente || null,
            dstintf: dest.dstintf || null,
            dstport: dest.dstport || null,
            devname: dest.devname || null,
          },

          // 🔑 FUNDAMENTAL PARA LIVEATTACK
          rule: dest.rule || null,

          total: o.total,
          severidades: dest.severidades,
        }));
      });

      return ctx.send({ flows });

    } catch (error) {
      console.error("Erro ao buscar fluxos de ataque:", error);
      return ctx.internalServerError("Erro ao consultar fluxos de ataque");
    }
  },
};
