export default {
  routes: [
    {
      method: "GET",
      path: "/admin/multitenant/tenants",
      handler: "admin-multitenant.myTenants",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/admin/multitenant/summary",
      handler: "admin-multitenant.summary",
      config: {
        policies: [],
      },
    },
  ],
};
