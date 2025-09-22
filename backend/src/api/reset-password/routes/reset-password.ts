export default {
  routes: [
    {
      method: "POST",
      path: '/auth/forgot-password',
      handler: 'reset-password.forgotPassword',
      config: {
        auth: false,   // 🔑 torna a rota pública
      },
    },
    {
      method: "POST",
      path: "/auth/reset-password",
      handler: "reset-password.resetPassword",
      config: { auth: false }, // precisa ser público
    },
  ],
};
