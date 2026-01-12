import { buscarSeveridadeIndexer } from "../services/severidade.service";
import { getTenantAtivo } from "./_utils";

export default {
  async severidade(ctx) {
    try {
      // 🔹 Tenant ativo
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      // 🔹 Dias (default mantém o comportamento antigo: 24h = "1")
      const dias = ctx.query.dias || "1";

      // 🔹 Busca severidade (agora espelhada no firewall)
      const resultado = await buscarSeveridadeIndexer(tenant, dias);

      // 🔹 Resposta mantém o mesmo formato esperado pelo frontend
      return ctx.send({
        severidade: resultado,
      });
    } catch (error) {
      console.error("Erro ao buscar severidade:", error);
      return ctx.internalServerError("Erro ao consultar severidade");
    }
  },
};
