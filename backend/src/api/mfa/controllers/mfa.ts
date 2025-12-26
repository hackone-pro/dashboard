// src/api/mfa/controllers/mfa.ts

export default {

  /**
   * Envia código MFA para o e-mail do usuário
   * Usado após login com email + senha
   */
  async send(ctx) {
    try {
      const { userId } = ctx.request.body;

      if (!userId) {
        return ctx.badRequest("userId é obrigatório");
      }

      const user = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({ where: { id: userId } });

      if (!user) {
        return ctx.notFound("Usuário não encontrado");
      }

      const result = await strapi
        .service("api::mfa.mfa")
        .sendCode(user);

      return ctx.send({
        ok: true,
        mfaToken: result.mfaToken,
        expire: result.expire,
      });

    } catch (err: any) {
      strapi.log.error("Erro ao enviar MFA:", err);
      return ctx.internalServerError("Erro ao enviar código MFA");
    }
  },

  /**
   * Verifica código MFA e gera JWT
   */
  async verify(ctx) {
    try {
      const { mfaToken, code } = ctx.request.body;

      if (!mfaToken || !code) {
        return ctx.badRequest("mfaToken e code são obrigatórios");
      }

      const result = await strapi
        .service("api::mfa.mfa")
        .verifyCode(mfaToken, code);

      return ctx.send({
        ok: true,
        jwt: result.jwt,
        user: result.user,
      });

    } catch (err: any) {
      return ctx.badRequest(err.message || "Falha ao validar código MFA");
    }
  },
};
