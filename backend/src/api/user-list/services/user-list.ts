/**
 * user-list service
 */

export default {
  async buscarUsuarios(user) {
    try {
      // 🔹 Busca o usuário completo com tenant
      const fullUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { id: user.id },
          populate: { tenant: true },
        });

      if (!fullUser?.tenant) {
        throw new Error("Tenant não encontrado para este usuário");
      }

      // 🔹 Busca todos os usuários do mesmo tenant
      const usuarios = await strapi.db
        .query("plugin::users-permissions.user")
        .findMany({
          where: { tenant: fullUser.tenant.id },
          select: ["id", "nome", "email", "owner_name_iris"],
          orderBy: { nome: "asc" },
        });

      return usuarios;
    } catch (err) {
      strapi.log.error("❌ Erro no service user-list:", err);
      throw err;
    }
  },

  async deletarUsuario(usuarioSolicitante, targetId) {
    try {
      // 🔹 Busca o solicitante com tenant
      const fullUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { id: usuarioSolicitante.id },
          populate: { tenant: true },
        });

      if (!fullUser?.tenant) {
        throw new Error("Tenant não encontrado para este usuário");
      }

      // 🔹 Busca o usuário alvo
      const targetUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { id: targetId },
          populate: { tenant: true },
        });

      if (!targetUser) {
        throw new Error("Usuário não encontrado");
      }

      // 🔹 Valida mesmo tenant
      if (targetUser.tenant?.id !== fullUser.tenant.id) {
        throw new Error("Usuário pertence a outro tenant");
      }

      // 🔹 Impede deletar a si mesmo
      if (targetUser.id === fullUser.id) {
        throw new Error("Você não pode deletar a si mesmo");
      }

      // 🔹 Executa o delete
      await strapi.db
        .query("plugin::users-permissions.user")
        .delete({ where: { id: targetUser.id } });

      strapi.log.info(`🗑️ Usuário ${targetUser.email} deletado por ${fullUser.email}`);

      return { ok: true, deletedId: targetUser.id };
    } catch (err) {
      strapi.log.error("❌ Erro ao deletar usuário:", err);
      throw err;
    }
  },

  // ✏️ Atualizar usuário
  async atualizarUsuario(usuarioSolicitante, targetId, dados) {
    try {
      const fullUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { id: usuarioSolicitante.id },
          populate: { tenant: true },
        });
  
      if (!fullUser?.tenant) {
        throw new Error("Tenant não encontrado para este usuário");
      }
  
      const targetUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { id: targetId },
          populate: { tenant: true },
        });
  
      if (!targetUser) {
        throw new Error("Usuário não encontrado");
      }
  
      if (targetUser.tenant?.id !== fullUser.tenant.id) {
        throw new Error("Usuário pertence a outro tenant");
      }
  
      const camposPermitidos = ["nome", "email", "owner_name_iris"];
      const dadosAtualizados = Object.fromEntries(
        Object.entries(dados).filter(([k]) => camposPermitidos.includes(k))
      );
  
      // 🔹 Verifica duplicidade de e-mail (se for alterado)
      if (
        dadosAtualizados.email &&
        dadosAtualizados.email !== targetUser.email
      ) {
        const existente = await strapi.db
          .query("plugin::users-permissions.user")
          .findOne({
            where: { email: dadosAtualizados.email },
          });
  
        if (existente) {
          throw new Error("O e-mail informado já está em uso por outro usuário");
        }
      }
  
      const atualizado = await strapi.db
        .query("plugin::users-permissions.user")
        .update({
          where: { id: targetUser.id },
          data: dadosAtualizados,
        });
  
      return atualizado;
    } catch (err) {
      strapi.log.error("❌ Erro ao atualizar usuário:", err);
      throw err;
    }
  },

};