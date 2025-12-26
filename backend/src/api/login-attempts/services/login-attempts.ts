// src/api/login-attempts/services/login-attempts.ts
import bcrypt from "bcryptjs";

export default {
  async login(ctx) {
    const { email, password } = ctx.request.body;

    if (!email || !password) {
      return ctx.badRequest("Email e senha são obrigatórios");
    }

    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({ where: { email } });

    if (!user) {
      return ctx.badRequest("Credenciais inválidas.");
    }

    // bloqueio temporário
    if (user.blocked_time && new Date(user.blocked_time) > new Date()) {
      const minutos = Math.ceil(
        (new Date(user.blocked_time).getTime() - Date.now()) / 60000
      );
      return ctx.forbidden(
        `Login bloqueado. Tente novamente em ${minutos} minutos.`
      );
    }

    const senhaCorreta = await bcrypt.compare(password, user.password);

    if (!senhaCorreta) {
      const novasTentativas = (user.login_attempts || 0) + 1;
      let updateData: any = { login_attempts: novasTentativas };

      if (novasTentativas >= 3) {
        updateData = {
          login_attempts: 0,
          blocked_time: new Date(Date.now() + 15 * 60 * 1000),
        };

        await strapi.db.query("plugin::users-permissions.user").update({
          where: { id: user.id },
          data: updateData,
        });

        return ctx.forbidden("Login bloqueado. Tente novamente em 15 minutos.");
      }

      await strapi.db.query("plugin::users-permissions.user").update({
        where: { id: user.id },
        data: updateData,
      });

      return ctx.badRequest("Credenciais inválidas.");
    }

    // login ok → reseta tentativas
    await strapi.db.query("plugin::users-permissions.user").update({
      where: { id: user.id },
      data: { login_attempts: 0, blocked_time: null },
    });

    // AQUI entra o MFA (ESSENCIAL)
    const { mfaToken } = await strapi
      .service("api::mfa.mfa")
      .sendCode(user);

    // NÃO gera JWT aqui
    return ctx.send({
      mfaRequired: true,
      mfaToken,
    });
  },
};
