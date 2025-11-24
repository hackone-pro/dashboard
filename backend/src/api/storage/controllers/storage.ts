import storageService from "../services/storage";

export default {
  async state(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized("Usuário não autenticado");

      // busca user completo (com tenant incluso)
      const fullUser = await strapi.db
        .query("plugin::users-permissions.user")
        .findOne({
          where: { id: user.id },
          populate: { tenant: true },
        });

      if (!fullUser?.tenant)
        return ctx.notFound("Tenant não encontrado para este usuário");

      const tenantName = fullUser.tenant.cliente_name || "";
      const tenantNameLower = tenantName.toLowerCase();

      // lê o JSON inteiro
      const dados = await storageService.lerStorageJSON();

      // filtra somente o customer do tenant (case insensitive)
      const chaveEncontrada = Object.keys(dados).find(
        (key) => key.toLowerCase() === tenantNameLower
      );

      if (!chaveEncontrada) {
        strapi.log.warn(
          `⚠ Storage: Nenhuma chave no JSON corresponde ao tenant "${tenantName}".`
        );
        return ctx.send({
          mensagem: "Nenhum dado correspondente ao tenant encontrado.",
          tenant: tenantName,
          encontrado: false,
        });
      }

      // envia somente os dados desse cliente
      return ctx.send({
        cliente: chaveEncontrada,
        dados: dados[chaveEncontrada],
      });

    } catch (err) {
      strapi.log.error("❌ Erro ao buscar dados de storage:", err);
      return ctx.internalServerError("Erro ao acessar estado do storage.");
    }
  }
};
