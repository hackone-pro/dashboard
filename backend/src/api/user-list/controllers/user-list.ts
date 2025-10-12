/**
 * A set of functions called "actions" for `user-list`
 */

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

