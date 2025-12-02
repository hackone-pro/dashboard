import { getTenantAtivo } from "../utils/tenant";
import { buscarFirewalls } from "../services/zabbix";

export default {
  async listFirewalls(ctx) {
    try {
      // 1. Verificar tenant
      const tenant = await getTenantAtivo(ctx);
      if (!tenant) {
        return ctx.notFound("Tenant não encontrado ou inativo");
      }

      // 2. Buscar firewalls no Zabbix
      const firewalls = await buscarFirewalls(tenant);

      // 3. Retorno padronizado
      return ctx.send({
        total: firewalls.length,
        firewalls,
      });

    } catch (error) {
      console.error("Erro ao consultar Zabbix Firewalls:", error);
      return ctx.internalServerError("Erro ao consultar firewalls no Zabbix");
    }
  },
};
