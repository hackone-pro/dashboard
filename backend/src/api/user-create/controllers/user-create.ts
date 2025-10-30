// src/api/user-create/controllers/user-create.ts
import { v4 as uuid } from "uuid";

export default {
  async create(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Usuário não autenticado");

      // 🔹 Busca o usuário logado com tenant e papel
      const fullUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { id: user.id },
          populate: { tenant: true, user_role: true },
        });

      if (!fullUser?.tenant)
        return ctx.notFound("Tenant não encontrado para este usuário");

      if (fullUser?.user_role?.slug !== "admin")
        return ctx.forbidden("Apenas administradores podem criar novos usuários");

      // 🔹 Dados enviados pelo frontend
      const { nome, username, email, owner_name_iris } = ctx.request.body;

      if (!nome || !username || !email)
        return ctx.badRequest("Campos obrigatórios: nome, username e email");

      // 🔹 Verifica se já existe usuário com esse e-mail
      const existingUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({ where: { email } });

      if (existingUser)
        return ctx.badRequest("Já existe um usuário com este e-mail");

      // 🔹 Busca o role padrão "Authenticated"
      const authenticatedRole = await strapi.db
        .query("plugin::users-permissions.role")
        .findOne({ where: { type: "authenticated" } });

      if (!authenticatedRole)
        return ctx.internalServerError("Role 'Authenticated' não encontrada");

      // 🔹 Gera token de convite (reutilizando campos reset_token e reset_expire)
      const inviteToken = uuid();
      const inviteExpire = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

      // 🔹 Cria novo usuário ainda não confirmado
      const novoUsuario = await strapi.db
        .query("plugin::users-permissions.user")
        .create({
          data: {
            nome,
            username,
            email,
            confirmed: false,
            blocked: false,
            owner_name_iris: owner_name_iris || "",
            tenant: fullUser.tenant.id,
            role: authenticatedRole.id,
            provider: "local",
            reset_token: inviteToken, // ✅ Reaproveita campos já existentes
            reset_expire: inviteExpire,
          },
        });

      // 🔹 Envia o e-mail de convite usando o mesmo service de reset
      await strapi
        .service("api::reset-password.reset-password")
        .sendInviteEmail(email, inviteToken);

      // 🔹 Remove campos sensíveis antes de retornar
      const { password, reset_token, reset_expire, ...userSanitized } = novoUsuario;

      return ctx.send({
        message: "Convite enviado com sucesso.",
        user: userSanitized,
      });
    } catch (err) {
      strapi.log.error("❌ Erro ao criar usuário:", err);
      return ctx.internalServerError("Erro ao criar usuário.");
    }
  },
};
