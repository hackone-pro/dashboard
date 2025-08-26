export default {
  routes: [
    {
      method: "GET",
      path: "/acesso/iris/manage/cases/list",
      handler: "acesso-iris.listCases",
      config: {
        policies: [], // 👈 correto no v5
      },
    },
    {
      method: "GET",
      path: "/acesso/iris/manage/cases/recent",
      handler: "acesso-iris.listarRecentes",
      config: {
        policies: [], // 👈 correto no v5
      },
    },
  ],
};