export default {
  routes: [
    {
      method: "POST",
      path: "/acesso/wazuh",
      handler: "acesso-wazuh.login",
      config: {
        policies: [],
      },
    },
    {
      method: "GET",
      path: "/acesso/wazuh/agents",
      handler: "acesso-wazuh.agents",
      config: {
        policies: [],
      },
    },
  ],
};