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
    {
      method: "GET",
      path: "/acesso/wazuh/top-paises",
      handler: "acesso-wazuh.topPaisesOrigem",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/acesso/wazuh/top-paises-geo",
      handler: "acesso-wazuh.topPaisesOrigemGeo",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/acesso/wazuh/vulnerabilidades/severidade",
      handler: "acesso-wazuh.vulnSeveridades",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/acesso/wazuh/vulnerabilidades/top",
      handler: "acesso-wazuh.topVulnerabilidades",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/acesso/wazuh/vulnerabilidades/top-os",
      handler: "acesso-wazuh.topOSVulnerabilidades",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/acesso/wazuh/vulnerabilidades/top-agentes",
      handler: "acesso-wazuh.topAgentesVulnerabilidades",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/acesso/wazuh/vulnerabilidades/top-packages",
      handler: "acesso-wazuh.topPackagesVulnerabilidades",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/acesso/wazuh/vulnerabilidades/top-scores",
      handler: "acesso-wazuh.topScoresVulnerabilidades",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/acesso/wazuh/vulnerabilidades/por-ano",
      handler: "acesso-wazuh.porAnoVulnerabilidades",
      config: {
        policies: [],
      },
    },
    
  ],
};