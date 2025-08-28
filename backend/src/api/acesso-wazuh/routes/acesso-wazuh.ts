export default {
  routes: [
    {
      method: "GET",
      path: '/acesso/wazuh/severidade',
      handler: 'acesso-wazuh.severidade',
      config: { policies: [] },
    },
    {
      method: "GET",
      path: "/acesso/wazuh/tenant",
      handler: "acesso-wazuh.buscarTenantPorUsuario",
      config: { policies: [] },
    },
    {
      method: "GET",
      path: "/acesso/wazuh/top-geradores",
      handler: "acesso-wazuh.topGeradores",
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/acesso/wazuh/top-agentes',
      handler: 'acesso-wazuh.topAgentes',
      config: { policies: [] },
    },
    {
      method: "GET",
      path: "/acesso/wazuh/top-agentes-cis",
      handler: "acesso-wazuh.topAgentesCis",
      config: { policies: [] },
    },
  ],
};