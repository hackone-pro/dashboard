import {
  buscarSeveridadeIndexer,
  buscarTopGeradoresFirewall,
  buscarTopAgentes,
  buscarTopAgentesCis,
  buscarTopPaisesAtaque,
  buscarVulnSeveridades,
  buscarTopVulnerabilidades,
  buscarTopOSVulnerabilidades,
  buscarTopAgentesVulnerabilidades,
  buscarTopPackagesVulnerabilidades,
  buscarTopScoresVulnerabilidades,
  buscarVulnerabilidadesPorAno,
  buscarEventosSummary,
  buscarEventosOvertime,
  buscarRuleDistribution,
  buscarTopUsers
} from '../services/acesso-wazuh';

import { resolveCountryCoords } from '../../../utils/countryResolver';
import { resolveIpCoords } from "../../../utils/geo";

export default {
  async severidade(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const tenant = await strapi.entityService.findMany('api::tenant.tenant', {
        filters: {
          users_permissions_users: { id: userId },
          ativa: true,
        },
        populate: ['users_permissions_users'],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];
      const resultado = await buscarSeveridadeIndexer(tenantData);
      return ctx.send({ severidade: resultado });

    } catch (error) {
      console.error("Erro ao buscar severidade:", error);
      return ctx.internalServerError("Erro ao consultar severidade");
    }
  },

  async buscarTenantPorUsuario(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: {
          users_permissions_users: { id: userId },
          ativa: true,
        },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      return ctx.send(tenant[0]); // ou retornar apenas alguns campos se quiser limitar

    } catch (error) {
      console.error("Erro ao buscar tenant:", error);
      return ctx.internalServerError("Erro ao consultar tenant");
    }
  },

  async topGeradores(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const dias = ctx.query.dias || "7"; // valores: "1", "7", "15", "30", "todos"

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: {
          users_permissions_users: { id: userId },
          ativa: true,
        },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];
      const resultado = await buscarTopGeradoresFirewall(tenantData, dias);

      return ctx.send({ topGeradores: resultado });

    } catch (error) {
      console.error("Erro ao buscar top geradores:", error);
      return ctx.internalServerError("Erro ao consultar top geradores");
    }
  },

  async topAgentes(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const dias = ctx.query.dias || "7";

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: {
          users_permissions_users: { id: userId },
          ativa: true,
        },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];
      const resultado = await buscarTopAgentes(tenantData, dias);

      return ctx.send({ topAgentes: resultado });

    } catch (error) {
      console.error("Erro ao buscar top agentes com risco:", error);
      return ctx.internalServerError("Erro ao consultar top agentes");
    }
  },

  async topAgentesCis(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const dias = ctx.query.dias || "7";

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];
      const resultado = await buscarTopAgentesCis(tenantData, dias);

      return ctx.send({ topAgentesCis: resultado });

    } catch (error) {
      console.error("Erro ao buscar top agentes CIS:", error);
      return ctx.internalServerError("Erro ao consultar top agentes CIS");
    }
  },

  async topPaisesOrigem(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const dias = ctx.query.dias || "7"; // "1","7","15","30","todos"

      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: {
          users_permissions_users: { id: userId },
          ativa: true,
        },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];
      const resultado = await buscarTopPaisesAtaque(tenantData, dias);

      return ctx.send({ topPaises: resultado });
    } catch (error) {
      console.error("Erro ao buscar top países de origem:", error);
      return ctx.internalServerError("Erro ao consultar top países");
    }
  },

  async topPaisesOrigemGeo(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");
  
      const dias = ctx.query.dias || "7"; // "1","7","15","30","todos"
  
      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: {
          users_permissions_users: { id: userId },
          ativa: true,
        },
        populate: ["users_permissions_users"],
      });
  
      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }
  
      const tenantData = tenant[0];
      const resultado = await buscarTopPaisesAtaque(tenantData, dias);
  
      // Filtra apenas destinos (IPs atacados)
      const destinos = resultado.filter((p: any) => p.tipo === "destino");
  
      // Cada origem dentro do destino gera um "flow"
      const flows = destinos.flatMap((dest: any) => {
        return (dest.origens || []).map((o: any) => {
          // Origem → resolve via GeoIP
          const origemCoords = resolveIpCoords(o.ip);
          // Destino → resolve via GeoIP
          const destinoCoords = resolveIpCoords(dest.destino);
  
          return {
            origem: {
              ip: o.ip,
              pais: origemCoords?.country || null,
              lat: origemCoords?.lat ?? null,
              lng: origemCoords?.lng ?? null,
            },
            destino: {
              pais: destinoCoords?.country || null,
              // agente: tenantData.wazuh_client_name || null, // 👈 pega do tenant
              lat: destinoCoords?.lat ?? null,
              lng: destinoCoords?.lng ?? null,
            },      
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

  async vulnSeveridades(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      const tenant = await strapi.entityService.findMany('api::tenant.tenant', {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ['users_permissions_users'],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];
      const resultado = await buscarVulnSeveridades(tenantData);

      // mantém o formato igual ao do Postman que você mostrou
      return ctx.send({ aggregations: resultado });

    } catch (error) {
      console.error("Erro ao buscar vulnerabilidades resumo:", error);
      return ctx.internalServerError("Erro ao consultar vulnerabilidades resumo");
    }
  },

  async topVulnerabilidades(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");
  
      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });
  
      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }
  
      const tenantData = tenant[0];
  
      // lê query params (opcionais)
      const { by = "cve", size = "5", dias = "todos" } = ctx.query;
  
      const resultado = await buscarTopVulnerabilidades(tenantData, {
        by: String(by) as any,
        size: Number(size),
        dias: String(dias),
      });
  
      return ctx.send({ topVulnerabilidades: resultado });
    } catch (error) {
      console.error("Erro ao buscar top vulnerabilidades:", error);
      return ctx.internalServerError("Erro ao consultar top vulnerabilidades");
    }
  },
  
  async topOSVulnerabilidades(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");
  
      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });
  
      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }
  
      const tenantData = tenant[0];
  
      // query params opcionais
      const { size = "5", dias = "todos" } = ctx.query;
  
      const resultado = await buscarTopOSVulnerabilidades(tenantData, {
        size: Number(size),
        dias: String(dias),
      });
  
      return ctx.send({ topOS: resultado });
    } catch (error) {
      console.error("Erro ao buscar top OS vulnerabilidades:", error);
      return ctx.internalServerError("Erro ao consultar top OS vulnerabilidades");
    }
  },

  async topAgentesVulnerabilidades(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");
  
      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });
  
      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }
  
      const tenantData = tenant[0];
  
      // query params opcionais
      const { size = "5", dias = "todos" } = ctx.query;
  
      const resultado = await buscarTopAgentesVulnerabilidades(tenantData, {
        size: Number(size),
        dias: String(dias),
      });
  
      return ctx.send({ topAgentes: resultado });
    } catch (error) {
      console.error("Erro ao buscar top Agentes vulnerabilidades:", error);
      return ctx.internalServerError("Erro ao consultar top Agentes vulnerabilidades");
    }
  },
  
  async topPackagesVulnerabilidades(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");
  
      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });
  
      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }
  
      const tenantData = tenant[0];
  
      // query params opcionais
      const { size = "5", dias = "todos" } = ctx.query;
  
      const resultado = await buscarTopPackagesVulnerabilidades(tenantData, {
        size: Number(size),
        dias: String(dias),
      });
  
      return ctx.send({ topPackages: resultado });
    } catch (error) {
      console.error("Erro ao buscar top Packages vulnerabilidades:", error);
      return ctx.internalServerError("Erro ao consultar top Packages vulnerabilidades");
    }
  },
  
  async topScoresVulnerabilidades(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");
  
      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });
  
      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }
  
      const tenantData = tenant[0];
  
      // query params opcionais
      const { size = "5", dias = "todos" } = ctx.query;
  
      const resultado = await buscarTopScoresVulnerabilidades(tenantData, {
        size: Number(size),
        dias: String(dias),
      });
  
      return ctx.send({ topScores: resultado });
    } catch (error) {
      console.error("Erro ao buscar top scores de vulnerabilidades:", error);
      return ctx.internalServerError(
        "Erro ao consultar top scores de vulnerabilidades"
      );
    }
  },

  async porAnoVulnerabilidades(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");
  
      // busca tenant ativo do usuário
      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });
  
      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }
  
      const tenantData = tenant[0];
  
      // query params opcionais
      const { dias = "todos" } = ctx.query;
  
      const resultado = await buscarVulnerabilidadesPorAno(tenantData, {
        dias: String(dias),
      });
  
      return ctx.send({ porAno: resultado });
    } catch (error) {
      console.error("Erro ao buscar vulnerabilidades por ano:", error);
      return ctx.internalServerError(
        "Erro ao consultar vulnerabilidades por ano"
      );
    }
  },
  
  async overtimeEventos(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");
  
      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });
  
      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }
  
      const tenantData = tenant[0];
      const { dias = "todos" } = ctx.query;
  
      // 👇 Corrigido para chamar a função certa
      const resultado = await buscarEventosOvertime(tenantData, {
        dias: String(dias),
      });
  
      return ctx.send({ overtime: resultado });
    } catch (error) {
      console.error("Erro ao buscar eventos overtime:", error);
      return ctx.internalServerError("Erro ao consultar eventos overtime");
    }
  },
  
  async eventosSummary(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");
  
      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });
  
      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }
  
      const tenantData = tenant[0];
      const { dias = "todos" } = ctx.query;
  
      const resultado = await buscarEventosSummary(tenantData, {
        dias: String(dias),
      });
  
      return ctx.send({ eventos: resultado });
    } catch (error) {
      console.error("Erro ao buscar eventos summary:", error);
      return ctx.internalServerError("Erro ao consultar eventos summary");
    }
  },

  async ruleDistribution(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");
  
      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });
  
      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }
  
      const tenantData = tenant[0];
      const { dias = "todos" } = ctx.query;
  
      const resultado = await buscarRuleDistribution(tenantData, {
        dias: String(dias),
      });
  
      return ctx.send({ rules: resultado });
    } catch (error) {
      console.error("Erro ao buscar rule distribution:", error);
      return ctx.internalServerError("Erro ao consultar rule distribution");
    }
  },

  async topUsers(ctx) {
    try {
      const userId = ctx.state.user?.id;
      if (!userId) return ctx.unauthorized("Usuário não autenticado");

      // Buscar tenant ativo vinculado ao usuário
      const tenant = await strapi.entityService.findMany("api::tenant.tenant", {
        filters: { users_permissions_users: { id: userId }, ativa: true },
        populate: ["users_permissions_users"],
      });

      if (!tenant || tenant.length === 0) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      const tenantData = tenant[0];
      const { dias = "todos" } = ctx.query;

      // Chama o service que criamos
      const resultado = await buscarTopUsers(tenantData, {
        dias: String(dias),
      });

      return ctx.send({ topUsers: resultado });
    } catch (error) {
      console.error("Erro ao buscar top users:", error);
      return ctx.internalServerError("Erro ao consultar top users");
    }
  },
  
  
}