import { buscarTopPaisesAtaque } from "../services/acesso-wazuh";
import { getTenantAtivo } from "./_utils";
import { resolveCountryCoords } from "../../../utils/countryResolver";

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
        GEO — ORIGEM ➝ DESTINO (flows para o mapa)
  ====================================================== */
  async topPaisesOrigemGeo(ctx) {
    try {
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const { dias, range } = ctx.query;

      const filtroTempo = range
        ? { range }
        : { dias: dias || "7" };

      const resultado = await buscarTopPaisesAtaque(tenant, filtroTempo);

      // Apenas destinos
      const destinos = resultado.filter((p: any) => p.tipo === "destino");

      const flows = destinos.flatMap((dest: any) => {
        return (dest.origens || []).map((o: any) => {

          const origemCountry =
            o.pais && o.pais !== "Interno"
              ? resolveCountryCoords(o.pais)
              : null;

          const destinoCountry =
            dest.pais && dest.pais !== "Interno"
              ? resolveCountryCoords(dest.pais)
              : null;

          return {
            origem: {
              ip: o.ip,
              pais: o.pais || null,
              city: o.cidade || null,
              region: null,

              lat: o.lat ?? origemCountry?.lat ?? null,
              lng: o.lng ?? origemCountry?.lng ?? null,

              srcport: o.srcport ?? null,
              servico: o.servico ?? null,
              interface: o.interface ?? null,
            },

            destino: {
              ip: dest.destino,
              pais: dest.pais || null,
              city: dest.cidade || null,
              region: null,

              lat: dest.lat ?? destinoCountry?.lat ?? null,
              lng: dest.lng ?? destinoCountry?.lng ?? null,

              agente: dest.agente || null,
              dstintf: dest.dstintf || null,
              dstport: dest.dstport || null,
              devname: dest.devname || null,
            },

            rule: dest.rule || null,
            total: o.total,
            severidades: dest.severidades,
          };
        });
      });

      return ctx.send({ flows });

    } catch (error) {
      console.error("Erro ao buscar fluxos de ataque:", error);
      return ctx.internalServerError("Erro ao consultar fluxos de ataque");
    }
  },
};