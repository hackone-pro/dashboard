import bcrypt from "bcryptjs";
import axios from "axios";

const ENABLE_TURNSTILE = process.env.ENABLE_TURNSTILE === "true";
const ENABLE_LOGIN_ATTEMPT_LIMIT =
  process.env.ENABLE_LOGIN_ATTEMPT_LIMIT === "true";
const ENABLE_MFA = process.env.ENABLE_MFA === "true";

async function validarTurnstile(token: string, ip?: string) {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET;

  if (!secret) {
    throw new Error("Turnstile secret não configurado");
  }

  const response = await axios.post(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    new URLSearchParams({
      secret,
      response: token,
      ...(ip && { remoteip: ip }),
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      timeout: 5000,
    }
  );

  return response.data;
}

export default {
  async login(ctx) {
    const { email, password, captchaToken } = ctx.request.body as any;

    if (!email || !password) {
      return ctx.badRequest("Email e senha são obrigatórios");
    }

    // =========================
    // CAPTCHA (se habilitado)
    // =========================
    if (ENABLE_TURNSTILE) {
      if (!captchaToken) {
        return ctx.badRequest("Captcha não enviado");
      }

      const captcha = await validarTurnstile(
        captchaToken,
        ctx.request.ip
      );

      if (!captcha.success) {
        return ctx.unauthorized("Falha na verificação do captcha");
      }
    }

    // =========================
    // BUSCA USUÁRIO
    // =========================
    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { email },
        populate: ["user_role"],
      });

    if (!user) {
      return ctx.badRequest("Credenciais inválidas.");
    }

    // =========================
    // BLOQUEIO TEMPORÁRIO
    // =========================
    if (
      ENABLE_LOGIN_ATTEMPT_LIMIT &&
      user.blocked_time &&
      new Date(user.blocked_time) > new Date()
    ) {
      const minutos = Math.ceil(
        (new Date(user.blocked_time).getTime() - Date.now()) / 60000
      );
      return ctx.forbidden(
        `Login bloqueado. Tente novamente em ${minutos} minutos.`
      );
    }

    // =========================
    // VALIDA SENHA
    // =========================
    const senhaCorreta = await bcrypt.compare(
      password,
      user.password
    );

    if (!senhaCorreta) {
      const novasTentativas = (user.login_attempts || 0) + 1;
      let updateData: any = { login_attempts: novasTentativas };

      if (
        ENABLE_LOGIN_ATTEMPT_LIMIT &&
        novasTentativas >= 3
      ) {
        updateData = {
          login_attempts: 0,
          blocked_time: new Date(Date.now() + 15 * 60 * 1000),
        };

        await strapi.db
          .query("plugin::users-permissions.user")
          .update({
            where: { id: user.id },
            data: updateData,
          });

        return ctx.forbidden(
          "Login bloqueado. Tente novamente em 15 minutos."
        );
      }

      await strapi.db
        .query("plugin::users-permissions.user")
        .update({
          where: { id: user.id },
          data: updateData,
        });

      return ctx.badRequest("Credenciais inválidas.");
    }

    // =========================
    // RESET TENTATIVAS
    // =========================
    await strapi.db
      .query("plugin::users-permissions.user")
      .update({
        where: { id: user.id },
        data: { login_attempts: 0, blocked_time: null },
      });

    // =========================
    // MFA (se habilitado)
    // =========================
    if (ENABLE_MFA) {
      const { mfaToken } = await strapi
        .service("api::mfa.mfa")
        .sendCode(user);

      return ctx.send({
        mfaRequired: true,
        mfaToken,
      });
    }

    // =========================
    // LOGIN DIRETO (sem MFA)
    // =========================
    const { password: _, reset_token, reset_expire, ...safeUser } = user;

    const userWithTenant = await strapi.entityService.findOne(
      "plugin::users-permissions.user",
      user.id,
      { populate: { tenant: true } }
    ) as any;

    const jwt = strapi
      .plugin("users-permissions")
      .service("jwt")
      .issue({ id: user.id, tenant_id: userWithTenant?.tenant?.id ?? null });

    return ctx.send({
      jwt,
      user: safeUser,
    });
  },
};
