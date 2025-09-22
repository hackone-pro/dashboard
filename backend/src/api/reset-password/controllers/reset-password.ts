import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";

export default {
  async forgotPassword(ctx) {
    const { email } = ctx.request.body;

    if (!email) {
      return ctx.badRequest("Email é obrigatório");
    }

    // Verifica se o usuário existe
    const user = await strapi.db.query("plugin::users-permissions.user").findOne({
      where: { email },
    });

    if (!user) {
      return ctx.notFound("Usuário não encontrado");
    }

    // Gera token
    const token = uuid();

    // Salva em algum campo customizado do usuário ou em uma tabela de tokens
    await strapi.db.query("plugin::users-permissions.user").update({
      where: { id: user.id },
      data: { reset_token: token, reset_expire: new Date(Date.now() + 30 * 60000) }, // 30min
    });

    // Chama o service para disparar email (ActiveCampaign)
    await strapi.service("api::reset-password.reset-password").sendResetEmail(email, token);

    ctx.send({ ok: true, message: "Email enviado" });
  },

  async resetPassword(ctx) {
    try {
      const { token, password } = ctx.request.body;

      if (!token || !password) {
        return ctx.badRequest("Token e nova senha são obrigatórios.");
      }

      // Busca usuário pelo token
      const user = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({ where: { reset_token: token } });

      if (!user) {
        return ctx.badRequest("Token inválido.");
      }

      // Verifica expiração
      if (!user.reset_expire || new Date(user.reset_expire) < new Date()) {
        return ctx.badRequest("Token expirado.");
      }

      // Criptografa nova senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Atualiza senha e limpa token
      await strapi.db.query("plugin::users-permissions.user").update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          reset_token: null,
          reset_expire: null,
        },
      });

      return ctx.send({ ok: true, message: "Senha redefinida com sucesso." });
    } catch (err) {
      strapi.log.error("Erro ao redefinir senha", err);
      return ctx.internalServerError("Falha ao redefinir senha");
    }
  },
};
