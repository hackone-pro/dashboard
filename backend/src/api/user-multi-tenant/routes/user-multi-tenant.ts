export default {
    routes: [
      {
        method: "GET",
        path: "/acesso/user/tenants",
        handler: "user-multi-tenant.me",
        config: {
          policies: [],
        },
      },
      {
        method: "PATCH",
        path: "/acesso/user/tenant/:id",
        handler: "user-multi-tenant.trocarTenant",
        config: { policies: [] },
      }
    ],
  };
  