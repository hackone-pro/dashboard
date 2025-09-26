export default {
  routes: [
    {
      method: "POST",
      path: "/auth/login-attempts",
      handler: "login-attempts.login",
      config: {
        auth: false, // 🔑 rota pública, igual /auth/local
      },
    },
  ],
};
