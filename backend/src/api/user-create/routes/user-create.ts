// src/api/user-create/routes/user-create.ts

export default {
  routes: [
    {
      method: "POST",
      path: "/acesso/user/create",
      handler: "user-create.create",
      config: {
        policies: [],
      },
    },
  ],
};
