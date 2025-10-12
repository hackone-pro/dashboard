export default {
  routes: [
    {
      method: "GET",
      path: "/acesso/user/list",
      handler: "user-list.find",
      config: {
        policies: [],
      },
    },
    {
      method: "DELETE",
      path: "/acesso/user/:id",
      handler: "user-list.delete",
      config: {
        policies: [],
      },
    },
    {
      method: "PUT",
      path: "/acesso/user/:id",
      handler: "user-list.update",
      config: {
        policies: [],
      },
    },
  ],
};
