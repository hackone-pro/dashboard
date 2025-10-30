// src/api/user-list/controllers/user-list.ts
import { v4 as uuid } from "uuid";

export default {
  async find(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Usuário não autenticado");

      // chama o service com o usuário logado
      // @ts-ignore
      const usuarios = await strapi
        .service("api::user-list.user-list")
        .buscarUsuarios(user);

      return ctx.send({ usuarios });
    } catch (err) {
      strapi.log.error("❌ Erro ao listar usuários:", err);
      return ctx.internalServerError("Erro ao listar usuários");
    }
  },

  async reenviarConvite(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Usuário não autenticado");

      const { id } = ctx.params;

      // Busca o usuário alvo
      const target = await strapi.db.query("plugin::users-permissions.user").findOne({
        where: { id },
        populate: { tenant: true },
      });

      if (!target) return ctx.notFound("Usuário não encontrado");

      // Busca o tenant do solicitante
      const solicitante = await strapi.db.query("plugin::users-permissions.user").findOne({
        where: { id: user.id },
        populate: { tenant: true },
      });

      if (target.tenant?.id !== solicitante.tenant?.id)
        return ctx.forbidden("Usuário pertence a outro tenant");

      // Só reenvia se ainda não confirmado
      if (target.confirmed)
        return ctx.badRequest("Usuário já está ativo, não é necessário reenviar convite.");

      // Novo token
      const inviteToken = uuid();
      const inviteExpire = new Date(Date.now() + 48 * 60 * 60 * 1000);

      await strapi.db.query("plugin::users-permissions.user").update({
        where: { id: target.id },
        data: {
          reset_token: inviteToken,
          reset_expire: inviteExpire,
        },
      });

      await strapi
        .service("api::reset-password.reset-password")
        .sendInviteEmail(target.email, inviteToken);

      ctx.send({ ok: true, message: "Convite reenviado com sucesso." });
    } catch (err) {
      strapi.log.error("❌ Erro ao reenviar convite:", err);
      return ctx.internalServerError("Falha ao reenviar convite");
    }
  },

  async delete(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Usuário não autenticado");

      const { id } = ctx.params;

      // @ts-ignore
      const resultado = await strapi
        .service("api::user-list.user-list")
        .deletarUsuario(user, id);

      return ctx.send(resultado);
    } catch (err) {
      strapi.log.error("❌ Erro ao deletar usuário:", err);

      // mensagens específicas
      if (err.message.includes("não encontrado"))
        return ctx.notFound(err.message);
      if (err.message.includes("tenant") || err.message.includes("deletar a si mesmo"))
        return ctx.forbidden(err.message);

      return ctx.internalServerError("Erro ao deletar usuário");
    }
  },

  // ✏️ Atualizar usuário
  async update(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Usuário não autenticado");
  
      const { id } = ctx.params;
      const dados = ctx.request.body;
  
      // @ts-ignore
      const atualizado = await strapi
        .service("api::user-list.user-list")
        .atualizarUsuario(user, id, dados);
  
      return ctx.send({ ok: true, atualizado });
    } catch (err) {
      strapi.log.error("❌ Erro ao atualizar usuário:", err);
  
      if (err.message.includes("tenant"))
        return ctx.forbidden(err.message);
  
      if (err.message.includes("não encontrado"))
        return ctx.notFound(err.message);
  
      if (err.message.includes("em uso"))
        return ctx.badRequest(err.message); // 🔹 novo: e-mail já existe
  
      return ctx.internalServerError("Erro ao atualizar usuário");
    }
  },  

};

