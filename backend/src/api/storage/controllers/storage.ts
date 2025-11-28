import storageService from "../services/storage";

export default {

  // =============================
  // STORAGE STATE (cliente)
  // =============================
  async state(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Usuário não autenticado");

      const fullUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { id: user.id },
          populate: { tenant: true },
        });

      if (!fullUser?.tenant)
        return ctx.notFound("Tenant não encontrado para este usuário");

      const tenantName = fullUser.tenant.cliente_name || "";
      const tenantLower = tenantName.toLowerCase();

      const dados = await storageService.lerArquivo("state");

      const chave = Object.keys(dados).find(
        (key) => key.toLowerCase() === tenantLower
      );

      if (!chave) {
        strapi.log.warn(`⚠ Nenhuma chave no JSON corresponde ao tenant "${tenantName}".`);
        return ctx.send({
          mensagem: "Nenhum dado correspondente ao tenant encontrado.",
          tenant: tenantName,
          encontrado: false,
        });
      }

      return ctx.send({
        cliente: chave,
        dados: dados[chave],
      });

    } catch (err) {
      strapi.log.error("❌ Erro storage state:", err);
      return ctx.internalServerError("Erro ao acessar estado do storage.");
    }
  },

  // =============================
  // STORAGE INTERNAL (descartes)
  // =============================
  async internal(ctx) {
    try {
      const dados = await storageService.lerArquivo("internal");
      return ctx.send(dados);

    } catch (err) {
      strapi.log.error("❌ Erro storage internal:", err);
      return ctx.internalServerError("Erro ao acessar storage internal.");
    }
  },
};
