export default {
  routes: [
    {
      method: "GET",
      path: "/acesso/report/data",
      handler: "reports.data",
      config: {
        policies: [], // 👈 compatível com Strapi v5
      },
    },
  ],
};