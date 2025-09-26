// src/api/login-attempts/controllers/login-attempts.ts

export default {
  async login(ctx) {
    try {
      // @ts-ignore
      return await strapi
        .service("api::login-attempts.login-attempts")
        .login(ctx);
    } catch (err: any) {
      // @ts-ignore
      strapi.log.error("Erro no login-attempts", err);

      return ctx.badRequest(
        err?.message || "Falha ao processar login-attempts"
      );
    }
  },
};
