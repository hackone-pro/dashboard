import { buscarSeveridadeIndexer, buscarTopGeradoresFirewall, buscarTopAgentes, buscarTopAgentesCis } from '../services/acesso-wazuh';

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
};
