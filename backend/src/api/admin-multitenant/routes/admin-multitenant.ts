export default {
  routes: [
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
