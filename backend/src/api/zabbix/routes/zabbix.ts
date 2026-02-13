export default {
  routes: [
    {
      method: "GET",
      path: "/acesso/zabbix/firewalls",
      handler: "zabbix.listFirewalls",
      config: { policies: [] },
    },
    {
      method: "GET",
      path: "/acesso/zabbix/top-hosts-cpu",
      handler: "zabbix.topHostsCPU",
      config: { policies: [] },
    },
    {
      method: "GET",
      path: "/acesso/zabbix/severidade",
      handler: "zabbix.severidade",
      config: { policies: [] },
    },
    {
      method: "GET",
      path: "/acesso/zabbix/top-switches-cpu",
      handler: "zabbix.topSwitchesCPU",
      config: { policies: [] },
    },
    {
      method: "GET",
      path: "/acesso/zabbix/alertas",
      handler: "zabbix.alertas",
    },
    {
      method: "GET",
      path: "/acesso/zabbix/switches/status",
      handler: "zabbix.switchesStatus",
    },
    {
      method: "GET",
      path: "/acesso/zabbix/ativos",
      handler: "zabbix.ativos"
    },
    {
      method: "GET",
      path: "/acesso/zabbix/vpn",
      handler: "zabbix.vpn"
    },
    {
      method: "GET",
      path: "/acesso/zabbix/routers",
      handler: "zabbix.routers"
    },
    {
      method: "GET",
      path: "/acesso/zabbix/links-wan",
      handler: "zabbix.linksWan",
    }    
  ],
};