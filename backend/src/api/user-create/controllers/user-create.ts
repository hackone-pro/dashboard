// src/api/user-create/controllers/user-create.ts
import bcrypt from "bcryptjs";

export default {
  // CRIA NOVO USUÁRIO
  async create(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Usuário não autenticado");

      // 🔹 Busca o usuário logado com tenant e papel
      const fullUser = await strapi.db.query("plugin::users-permissions.user").findOne({
        where: { id: user.id },
        populate: { tenant: true, user_role: true },
      });

      if (!fullUser?.tenant)
        return ctx.notFound("Tenant não encontrado para este usuário");

      // 🔹 Verifica se é admin
      if (fullUser?.user_role?.slug !== "admin")
        return ctx.forbidden("Apenas administradores podem criar novos usuários");

      // 🔹 Dados enviados pelo frontend
      const { nome, username, email, password, owner_name_iris } = ctx.request.body;

      if (!nome || !username || !email || !password)
        return ctx.badRequest("Campos obrigatórios: nome, username, email e password");

      // 🔹 Verifica se já existe usuário com esse e-mail
      const existingUser = await strapi.db.query("plugin::users-permissions.user").findOne({
        where: { email },
      });
      if (existingUser)
        return ctx.badRequest("Já existe um usuário com este e-mail");

      // 🔹 Busca o role padrão "Authenticated"
      const authenticatedRole = await strapi.db
        .query("plugin::users-permissions.role")
        .findOne({ where: { type: "authenticated" } });

      if (!authenticatedRole)
        return ctx.internalServerError("Role 'Authenticated' não encontrada no sistema.");

      // 🔹 Gera hash da senha manualmente
      const hashedPassword = await bcrypt.hash(password, 10);

      // 🔹 Cria novo usuário diretamente com todos os campos
      const novoUsuario = await strapi.db
        .query("plugin::users-permissions.user")
        .create({
          data: {
            nome, // ✅ agora o nome será salvo corretamente
            username,
            email,
            password: hashedPassword,
            confirmed: true,
            owner_name_iris: owner_name_iris || "",
            tenant: fullUser.tenant.id,
            role: authenticatedRole.id,
            provider: "local",
          },
        });

      // 🔹 Remove campos sensíveis
      const { password: _, resetPasswordToken, ...userSanitized } = novoUsuario;

      return ctx.send({
        message: "Usuário criado com sucesso",
        user: userSanitized,
      });
    } catch (err) {
      strapi.log.error("❌ Erro ao criar usuário:", err.response?.data || err);
      return ctx.internalServerError("Erro ao criar usuário");
    }
  },
};
