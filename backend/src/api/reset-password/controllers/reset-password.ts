// src/api/reset-password/controllers/reset-password.ts
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";

export default {
  /**
   * 🔹 Fluxo normal de reset de senha (usuário esqueceu)
   */
  async forgotPassword(ctx) {
    const { email } = ctx.request.body;
    if (!email) return ctx.badRequest("Email é obrigatório");

    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({ where: { email } });

    if (!user) return ctx.notFound("Usuário não encontrado");

    const token = uuid();

    await strapi.db.query("plugin::users-permissions.user").update({
      where: { id: user.id },
      data: {
        reset_token: token,
        reset_expire: new Date(Date.now() + 30 * 60000), // 30 min
      },
    });

    await strapi
      .service("api::reset-password.reset-password")
      .sendResetEmail(email, token);

    ctx.send({ ok: true, message: "E-mail de redefinição enviado." });
  },

  /**
   * 🔹 Reutilizado tanto para redefinir senha quanto para convite
   */
  async resetPassword(ctx) {
    try {
      const { token, password } = ctx.request.body;
      if (!token || !password)
        return ctx.badRequest("Token e nova senha são obrigatórios.");

      const user = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({ where: { reset_token: token } });

      if (!user) return ctx.badRequest("Token inválido.");

      if (!user.reset_expire || new Date(user.reset_expire) < new Date())
        return ctx.badRequest("Token expirado.");

      const hashedPassword = await bcrypt.hash(password, 10);

      await strapi.db.query("plugin::users-permissions.user").update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          reset_token: null,
          reset_expire: null,
          confirmed: true, // ✅ ativa usuário se for convite
        },
      });

      return ctx.send({
        ok: true,
        message: "Senha definida e acesso ativado com sucesso.",
      });
    } catch (err) {
      strapi.log.error("Erro ao redefinir senha:", err);
      return ctx.internalServerError("Falha ao redefinir senha");
    }
  },
};
