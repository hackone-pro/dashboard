import { v4 as uuid } from "uuid";

export default {
  async afterFindOne(event) {
    const { result } = event;
    if (!result) return;

    // Fallback: tenants existentes sem plan retornam "full"
    if (!result.plan) {
      result.plan = "full";
    }

    if (result.users_permissions_users && result.users_permissions_users.length > 0) {
      const user = result.users_permissions_users[0];
      if (user?.owner_name_iris) {
        result.owner_name = user.owner_name_iris;
      }
    }
  },

  async afterFindMany(event) {
    const { result } = event;
    if (!Array.isArray(result)) return;

    for (const tenant of result) {
      // Fallback: tenants existentes sem plan retornam "full"
      if (!tenant.plan) {
        tenant.plan = "full";
      }

      if (tenant.users_permissions_users && tenant.users_permissions_users.length > 0) {
        const user = tenant.users_permissions_users[0];
        if (user?.owner_name_iris) {
          tenant.owner_name = user.owner_name_iris;
        }
      }
    }
  },

  async beforeCreate(event) {
    const { params } = event;

    // ✅ Gera uid automaticamente se não informado
    if (!params.data.uid) {
      params.data.uid = uuid();
    }
    const users = params.data.users_permissions_users || [];
    if (users.length > 0) {
      const userId = users[0].id || users[0];
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
      });
      if (user?.owner_name_iris) {
        params.data.owner_name = user.owner_name_iris;
      }
    }
  },

  async beforeUpdate(event) {
    const { params } = event;

    if (params.data.users_permissions_users?.connect?.length > 0) {
      const userId = params.data.users_permissions_users.connect[0].id;
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: userId },
      });
      if (user?.owner_name_iris) {
        params.data.owner_name = user.owner_name_iris;
      }
    }
  },
};