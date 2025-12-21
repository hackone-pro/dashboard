// src/pages/MonitoriaSOC.tsx
import { useRef } from "react";
import LayoutModel from "../componentes/LayoutModel";
import { useZabbixAtivo } from "../hooks/useZabbixAtivo";

import FirewallCard, { FirewallCardRef } from "../componentes/zabbix/Monitoria/FirewallCard";
import TopHostsCPU from "../componentes/zabbix/Monitoria/TopHostsCPU";
import SeveridadeDonutCard from "../componentes/zabbix/Monitoria/Severidade";
import TopSwitchesCPU from "../componentes/zabbix/Monitoria/TopSwitchesCPU";
import SwitchesStatusCard from "../componentes/zabbix/Monitoria/SwitchesStatus";
import AlertasZabbix from "../componentes/zabbix/Monitoria/Alertas";
import Ativos from "../componentes/zabbix/Monitoria/Ativos";
import VPN from "../componentes/zabbix/Monitoria/VPN";
import Roteadores from "../componentes/zabbix/Monitoria/Roteadores";
import LinksWanCard from "../componentes/zabbix/Monitoria/LinksWan";
import TopUseCPU from "../componentes/zabbix/Monitoria/TopUseCPU";
import FirewallsRamCard from "../componentes/zabbix/Monitoria/TopFirewallTrafego";

export default function MonitoriaSOC() {
  // ref obrigatório para usar <FirewallCard ref={firewallRef}>
  const firewallRef = useRef<FirewallCardRef>(null);
  const { loading, ativo } = useZabbixAtivo();

  /* =========================
     LOADING
  ========================= */
  if (loading) {
    return (
      <LayoutModel titulo="Monitoria">
        <div className="text-gray-300 p-10">
          Carregando monitoria…
        </div>
      </LayoutModel>
    );
  }

  /* =========================
     SEM PERMISSÃO / SEM ZABBIX
  ========================= */
  if (!ativo) {
    return (
      <LayoutModel titulo="Monitoria">
        <div className="h-[40vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <h2 className="text-lg text-white mb-2">
              Monitoria indisponível
            </h2>
            <p className="text-gray-400 text-sm">
              O tenant selecionado não possui integração ativa com o Zabbix
              ou a integração está desabilitada.
            </p>
          </div>
        </div>
      </LayoutModel>
    );
  }

  /* =========================
     CONTEÚDO NORMAL
  ========================= */
  return (
    <LayoutModel titulo="Monitoria">
      <section className="grid grid-cols-1 gap-6">

        {/* ================================
            LINHA 1 – FIREWALL / CPU / DONUT
        ================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* CARD – Firewall */}
          <FirewallCard ref={firewallRef} />

          {/* CARD – CPU e memória */}
          <div className="cards rounded-2xl p-6 zabbix-card">
            <TopHostsCPU />
          </div>

          {/* CARD – Problemas por severidade */}
          <div className="cards rounded-2xl p-6 flex flex-col zabbix-card">
            <h3 className="text-white mb-4">
              Problemas por severidade
            </h3>

            <div className="flex-1 flex items-center justify-center">
              <SeveridadeDonutCard />
            </div>
          </div>

        </div>

        {/* ================================
            LINHA 2 – TOP SWITCHES CPU
        ================================= */}
        <div className="cards rounded-2xl p-6">
          <TopSwitchesCPU />
        </div>

        {/* ================================
            LINHA 3 – HOSTS CPU + FIREWALLS
        ================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          <TopUseCPU />

          <div className="cards rounded-2xl p-6">
            <FirewallsRamCard />
          </div>

        </div>

        {/* ================================
            LINHA 4 – ATIVOS / VPN / SWITCHES
        ================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          <div className="cards rounded-2xl p-6">
            <h3 className="text-white mb-4">Ativos monitorados</h3>
            <Ativos />
          </div>

          <div className="cards rounded-2xl p-6">
            <h3 className="text-white mb-4">VPN</h3>
            <VPN />
          </div>

          <SwitchesStatusCard />

        </div>

        {/* ================================
            LINHA 5 – WAN + ROTEADORES
        ================================= */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          <LinksWanCard />

          <div className="cards rounded-2xl p-6">
            <Roteadores />
          </div>

        </div>

        {/* ================================
            LINHA 6 – ALERTAS
        ================================= */}
        <div className="cards rounded-2xl p-6 alertas-card">
          <AlertasZabbix />
        </div>

      </section>
    </LayoutModel>
  );
}
