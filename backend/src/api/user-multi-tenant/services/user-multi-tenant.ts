/**
 * user-multi-tenant service
 */

 export default {
    async buscarTenantsUsuario(user) {
      try {
        // 1️⃣ Busca o usuário completo com o tenant ativo atual
        const fullUser = await strapi.db
          .query("plugin::users-permissions.user")
          .findOne({
            where: { id: user.id },
            populate: {
              tenant: {
                select: ["id", "cliente_name", "organizacao"], // ✅ adiciona aqui
              },
            },
          });
  
        if (!fullUser) throw new Error("Usuário não encontrado");
  
        // 2️⃣ Busca todos os registros de acesso do usuário (multi-tenant)
        const acessos = await strapi.db
          .query("api::user-multi-tenant.user-multi-tenant")
          .findMany({
            where: { users_permissions_user: user.id, ativo: true },
            populate: {
              tenant: {
                select: ["id", "cliente_name", "organizacao"], // ✅ adiciona aqui também
              },
            },
          });
  
        // 3️⃣ Junta tenants do usuário e do multi-tenant
        const tenantsAcessiveis = [];
  
        if (fullUser.tenant) {
          tenantsAcessiveis.push({
            id: fullUser.tenant.id,
            cliente_name: fullUser.tenant.cliente_name,
            organizacao: fullUser.tenant.organizacao, // ✅ inclui aqui
          });
        }
  
        acessos.forEach((a) => {
          if (a.tenant) {
            tenantsAcessiveis.push({
              id: a.tenant.id,
              cliente_name: a.tenant.cliente_name,
              organizacao: a.tenant.organizacao, // ✅ inclui aqui também
            });
          }
        });
  
        // 4️⃣ Remove duplicados por ID ou cliente_name
        const uniqueTenants = tenantsAcessiveis.filter(
          (t, index, self) =>
            index ===
            self.findIndex(
              (x) =>
                x.id === t.id ||
                x.cliente_name.toLowerCase() === t.cliente_name.toLowerCase()
            )
        );
  
        // 5️⃣ Retorna o resultado final
        return {
          tenantAtivo: fullUser.tenant || null,
          tenantsAcessiveis: uniqueTenants,
        };
      } catch (err) {
        strapi.log.error("❌ Erro ao buscar tenants do usuário:", err);
        throw new Error("Erro ao buscar tenants do usuário");
      }
    },
  };
  