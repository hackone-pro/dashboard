export default {
  routes: [
    {
      method: "POST",
      path: "/acesso/report",          // 🔹 POST para gerar relatório
      handler: "reports.gerar",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/acesso/report/data/:cliente", // 🔹 GET para buscar dados
      handler: "reports.data",
      config: {
        policies: [],
      },
    },
  ],
};
