import { factories } from "@strapi/strapi";
import { getTenantAtivo } from "../../acesso-wazuh/controllers/_utils";

export default factories.createCoreController(
  "api::zabbix-config.zabbix-config",
  ({ strapi }) => ({

    async ativo(ctx) {
        try {
          const tenant = await getTenantAtivo(ctx);
      
          if (!tenant) {
            return ctx.send({ enabled: false });
          }
      
          const configs = (await strapi.entityService.findMany(
            "api::zabbix-config.zabbix-config",
            {
              filters: {
                enabled: true,
              },
              populate: ["tenant"],
            }
          )) as any[]; // 👈 resolve a tipagem
      
          const ativo = configs.some((cfg) => {
            return (
              cfg.tenant &&
              cfg.tenant.cliente_name === tenant.cliente_name
            );
          });
      
          return ctx.send({ enabled: ativo });
      
        } catch (error) {
          console.error("Erro ao validar Zabbix:", error);
          return ctx.internalServerError("Erro ao validar Zabbix");
        }
      }
      
      
  })
);
