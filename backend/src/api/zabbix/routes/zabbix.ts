export default {
  routes: [
    {
      method: "GET",
      path: "/acesso/zabbix/firewalls",
      handler: "zabbix.listFirewalls",
      config: { policies: [] },
    },
  ],
};
