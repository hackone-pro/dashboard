// src/api/mfa/services/mfa.ts

import { v4 as uuid } from "uuid";

export default {

  /**
   * Gera e envia o código MFA por e-mail
   */
  async sendCode(user: any) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = uuid();

    const expire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // salva no usuário
    await strapi.db.query("plugin::users-permissions.user").update({
      where: { id: user.id },
      data: {
        mfa_code: code,
        mfa_token: token,
        mfa_expire: expire,
      },
    });

    const html = `
      <div style="font-family: Arial, sans-serif; background:#f4f4f4; padding:40px">
        <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; overflow:hidden">
          
          <div style="background:linear-gradient(90deg,#1d0f3a,#23094f); text-align:center">
            <img src="${process.env.FRONTEND_URL}/assets/img/banner-securityone.jpg" width="100%" />
          </div>

          <div style="padding:30px; color:#333">
            <p>Olá,</p>
            <p>Use o código abaixo para concluir seu login no <b>SecurityOne</b>:</p>

            <div style="text-align:center; margin:30px 0">
              <div style="
                font-size:32px;
                letter-spacing:6px;
                font-weight:bold;
                color:#5b21b6;
              ">
                ${code}
              </div>
            </div>

            <p><b>Este código expira em 10 minutos.</b></p>
            <p>Se você não solicitou este acesso, ignore este e-mail.</p>
          </div>

        </div>
      </div>
    `;

    await strapi.plugin("email").service("email").send({
      to: user.email,
      from: process.env.SMTP_USER,
      subject: "Código de verificação - SecurityOne",
      html,
    });

    return {
      mfaToken: token,
      expire,
    };
  },

  /**
   * Valida código MFA e emite JWT
   */
  async verifyCode(mfaToken: string, code: string) {
    const user = await strapi.db
      .query("plugin::users-permissions.user")
      .findOne({
        where: { mfa_token: mfaToken },
        populate: {
          user_role: true,
          tenant: true,
        },
      });

    if (!user) {
      throw new Error("Sessão MFA inválida.");
    }

    if (!user.mfa_expire || new Date(user.mfa_expire) < new Date()) {
      throw new Error("Código expirado.");
    }

    if (user.mfa_code !== code) {
      throw new Error("Código inválido.");
    }

    // gera JWT oficial
    const jwt = strapi
      .plugin("users-permissions")
      .service("jwt")
      .issue({ id: user.id, tenant_id: user?.tenant?.uid ?? null });

    // limpa dados MFA
    await strapi.db.query("plugin::users-permissions.user").update({
      where: { id: user.id },
      data: {
        mfa_code: null,
        mfa_token: null,
        mfa_expire: null,
      },
    });

    return {
      jwt,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        user_role: user.user_role
          ? {
              id: user.user_role.id,
              name: user.user_role.name,
              slug: user.user_role.slug,
            }
          : null,
      },
    };
  },
};
