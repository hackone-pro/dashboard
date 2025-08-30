export default {
  routes: [
    {
      method: "GET",
      path: '/acesso/wazuh/severidade',
      handler: 'acesso-wazuh.severidade',
      config: { auth: false, policies: [] },
    },
    {
      method: "GET",
      path: "/acesso/wazuh/tenant",
      handler: "acesso-wazuh.buscarTenantPorUsuario",
      config: { auth: false, policies: [] },
    },
    {
      method: "GET",
      path: "/acesso/wazuh/top-geradores",
      handler: "acesso-wazuh.topGeradores",
      config: { auth: false, policies: [] },
    },
    {
      method: 'GET',
      path: '/acesso/wazuh/top-agentes',
      handler: 'acesso-wazuh.topAgentes',
      config: { auth: false, policies: [] },
    },
    {
      method: "GET",
      path: "/acesso/wazuh/top-agentes-cis",
      handler: "acesso-wazuh.topAgentesCis",
      config: { auth: false, policies: [] },
    },
    {
      method: "GET",
      path: "/acesso/wazuh/top-paises",
      handler: "acesso-wazuh.topPaisesOrigem",
      config: {
        auth: false,
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/acesso/wazuh/top-paises-geo",
      handler: "acesso-wazuh.topPaisesOrigemGeo",
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};