export default {
  routes: [
    {
      method: "GET",
      path: "/acesso/iris/manage/cases/list",
      handler: "acesso-iris.listCases",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/acesso/iris/manage/cases/recent",
      handler: "acesso-iris.listarRecentes",
      config: {
        policies: [],
      },
    },
    {
      method: "POST",
      path: "/acesso/iris/manage/cases/update",
      handler: "acesso-iris.updateCase",
      config: {
        policies: [],
      },
    },
  ],
};