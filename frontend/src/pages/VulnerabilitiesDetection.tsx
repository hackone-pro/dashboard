// src/pages/VulnerabilitiesDetection.tsx
import { useRef, useState, useEffect } from "react";
import LayoutModel from '../componentes/LayoutModel';
import { useTenant } from "../context/TenantContext";
import { useScreenContext } from "../context/ScreenContext";

//CARDS COMPONENTES
import VulnSeveridadeCard, { VulnSeveridadeCardRef } from '../componentes/wazuh/VulnerabilitiesDetection/VulnServeridadeCard';
import TopVulnerabilidadeCard, { TopVulnerabilidadeCardRef } from '../componentes/wazuh/VulnerabilitiesDetection/TopVulnerabilidadeCard';
import TopOSVulnerabilidadeCard, { TopOSVulnerabilidadeCardRef } from '../componentes/wazuh/VulnerabilitiesDetection/TopOSVulnerabilidadeCard';
import TopAgenteVulnerabilidadeCard, { TopAgenteVulnerabilidadeCardRef } from '../componentes/wazuh/VulnerabilitiesDetection/TopAgenteVulnerabilidadeCard';
import TopPackageVulnerabilidadeCard, { TopPackageVulnerabilidadeCardRef } from '../componentes/wazuh/VulnerabilitiesDetection/TopPackageVulnerabilidadeCard';
import TopScoreVulnerabilidadeCard, { TopScoreVulnerabilidadeCardRef } from '../componentes/wazuh/VulnerabilitiesDetection/TopScoreVulnerabilidadeCard';
import TopOSGraficoCard, { TopOSGraficoCardRef } from '../componentes/wazuh/VulnerabilitiesDetection/TopOSGraficoCard';
import AnoVulnerabilidadeCard, { AnoVulnerabilidadeCardRef } from '../componentes/wazuh/VulnerabilitiesDetection/AnoVulnerabilidadeCard';
import { getTopAgentesVulnerabilidades } from "../services/wazuh/agentesvulnerabilidades.service";


import AgentSelectFilter from "../componentes/AgentSelectFilter";
import { FaSyncAlt } from "react-icons/fa";
import { FiRotateCcw } from "react-icons/fi";
import type { VulnSeveridades } from "../services/wazuh/vulnseveridades.service";

export default function VulnerabilitiesDetection() {
  const { tenantAtivo } = useTenant();
  const { setScreenData } = useScreenContext();
  const vulnseveridadeRef = useRef<VulnSeveridadeCardRef>(null);
  const topvulnerabilidadeRef = useRef<TopVulnerabilidadeCardRef>(null);
  const topvosulnerabilidadeRef = useRef<TopOSVulnerabilidadeCardRef>(null);
  const topagentevulnerabilidadeRef = useRef<TopAgenteVulnerabilidadeCardRef>(null);
  const toppackagevulnerabilidadeRef = useRef<TopPackageVulnerabilidadeCardRef>(null);
  const toppscorevulnerabilidadeRef = useRef<TopScoreVulnerabilidadeCardRef>(null);
  const toposgraficovulnerabilidadeRef = useRef<TopOSGraficoCardRef>(null);
  const anovulnerabilidadeRef = useRef<AnoVulnerabilidadeCardRef>(null);
  const [agentSelecionado, setAgentSelecionado] = useState<string | null>(null);
  const [agents, setAgents] = useState<string[]>([]);
  const [vulnSeveridades, setVulnSeveridades] = useState<VulnSeveridades | null>(null);
  const [topCVEs, setTopCVEs] = useState<Array<{ cve: string; total: number }>>([]);

  useEffect(() => {
    const total = vulnSeveridades?.total || 1;
    setScreenData("vulnerabilidades", {
      nomePagina: "Detecção de Vulnerabilidades",
      agentFiltrado: agentSelecionado ?? "todos",
      totalAgentes: agents.length,
      severidades: vulnSeveridades ? {
        critico: vulnSeveridades.critical,
        alto: vulnSeveridades.high,
        medio: vulnSeveridades.medium,
        baixo: vulnSeveridades.low,
        pendentes: vulnSeveridades.pending,
        total: vulnSeveridades.total ?? 0,
        pctCritico: `${Math.round(((vulnSeveridades.critical) / total) * 100)}%`,
        pctAlto: `${Math.round(((vulnSeveridades.high) / total) * 100)}%`,
        pctMedio: `${Math.round(((vulnSeveridades.medium) / total) * 100)}%`,
        pctBaixo: `${Math.round(((vulnSeveridades.low) / total) * 100)}%`,
      } : null,
      topCVEs,
    });
  }, [agentSelecionado, agents, vulnSeveridades, topCVEs, setScreenData]);

  useEffect(() => {
    if (!tenantAtivo) return;
  
    async function carregarAgents() {
      try {
        const lista = await getTopAgentesVulnerabilidades(200, "todos");
  
        const nomes = Array.from(
          new Set(
            lista
              .map((x) => x.agent)
              .filter((a) => a && a !== "Desconhecido")
          )
        ).sort((a, b) => a.localeCompare(b));
  
        setAgents(nomes);
      } catch (err) {
        console.error("Erro ao carregar agents:", err);
        setAgents([]);
      }
    }
  
    setAgentSelecionado(null);
  
    carregarAgents();
  }, [tenantAtivo]);

  const atualizarTudo = () => {
    vulnseveridadeRef.current?.carregar();
    topvulnerabilidadeRef.current?.carregar();
    topvosulnerabilidadeRef.current?.carregar();
    topagentevulnerabilidadeRef.current?.carregar();
    toppackagevulnerabilidadeRef.current?.carregar();
    toppscorevulnerabilidadeRef.current?.carregar();
    toposgraficovulnerabilidadeRef.current?.carregar();
    anovulnerabilidadeRef.current?.carregar();
  };

  return (
    <LayoutModel titulo="Detecção de vulnerabilidades">

      {/* ================= FILTRO POR AGENTE ================= */}
      <div className="flex justify-end mt-5 mb-3 px-6 gap-3">
        <AgentSelectFilter
          agents={agents}
          value={agentSelecionado}
          onApply={(agent) => {
            setAgentSelecionado(agent);
            atualizarTudo();
          }}
        />

        <button
          onClick={() => {
            setAgentSelecionado(null);
            atualizarTudo();
          }}
          className="flex items-center gap-1 text-[14px] text-purple-400 hover:text-purple-200 transition-colors"
        >
          {/* @ts-ignore */}
          <FiRotateCcw className="w-4 h-4" />
          Limpar filtro
        </button>
      </div>

      <VulnSeveridadeCard
        ref={vulnseveridadeRef}
        agent={agentSelecionado}
        onAtualizar={atualizarTudo}
        onDadosCarregados={setVulnSeveridades}
      />

      <section className="rounded-2xl shadow-lg my-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
          <TopVulnerabilidadeCard
            ref={topvulnerabilidadeRef}
            agent={agentSelecionado}
            onDadosCarregados={setTopCVEs}
          />
          <TopOSVulnerabilidadeCard
            ref={topvosulnerabilidadeRef}
            agent={agentSelecionado}
          />
          <TopAgenteVulnerabilidadeCard
            ref={topagentevulnerabilidadeRef}
            agent={agentSelecionado}
          />
          <TopPackageVulnerabilidadeCard
            ref={toppackagevulnerabilidadeRef}
            agent={agentSelecionado}
          />
        </div>
      </section>

      <section className="rounded-2xl shadow-lg my-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          <TopScoreVulnerabilidadeCard
            ref={toppscorevulnerabilidadeRef}
            agent={agentSelecionado}
          />
          <TopOSGraficoCard
            ref={toposgraficovulnerabilidadeRef}
            agent={agentSelecionado}
          />
          <AnoVulnerabilidadeCard
            ref={anovulnerabilidadeRef}
            agent={agentSelecionado}
          />
        </div>
      </section>
    </LayoutModel>
  );
}
