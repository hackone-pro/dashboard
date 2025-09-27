// src/pages/VulnerabilitiesDetection.tsx
import { useRef } from "react";
import LayoutModel from '../componentes/LayoutModel';

//CARDS COMPONENTES
import VulnSeveridadeCard, { VulnSeveridadeCardRef } from '../componentes/wazuh/VulnerabilitiesDetection/VulnServeridadeCard';
import TopVulnerabilidadeCard, { TopVulnerabilidadeCardRef } from '../componentes/wazuh/VulnerabilitiesDetection/TopVulnerabilidadeCard';
import TopOSVulnerabilidadeCard, { TopOSVulnerabilidadeCardRef } from '../componentes/wazuh/VulnerabilitiesDetection/TopOSVulnerabilidadeCard';
import TopAgenteVulnerabilidadeCard, { TopAgenteVulnerabilidadeCardRef } from '../componentes/wazuh/VulnerabilitiesDetection/TopAgenteVulnerabilidadeCard';
import TopPackageVulnerabilidadeCard, { TopPackageVulnerabilidadeCardRef } from '../componentes/wazuh/VulnerabilitiesDetection/TopPackageVulnerabilidadeCard';
import TopScoreVulnerabilidadeCard, { TopScoreVulnerabilidadeCardRef } from '../componentes/wazuh/VulnerabilitiesDetection/TopScoreVulnerabilidadeCard';
import TopOSGraficoCard, { TopOSGraficoCardRef } from '../componentes/wazuh/VulnerabilitiesDetection/TopOSGraficoCard';
import AnoVulnerabilidadeCard, { AnoVulnerabilidadeCardRef } from '../componentes/wazuh/VulnerabilitiesDetection/AnoVulnerabilidadeCard';
import { FaSyncAlt } from "react-icons/fa";

export default function VulnerabilitiesDetection() {
  const vulnseveridadeRef = useRef<VulnSeveridadeCardRef>(null);
  const topvulnerabilidadeRef = useRef<TopVulnerabilidadeCardRef>(null);
  const topvosulnerabilidadeRef = useRef<TopOSVulnerabilidadeCardRef>(null);
  const topagentevulnerabilidadeRef = useRef<TopAgenteVulnerabilidadeCardRef>(null);
  const toppackagevulnerabilidadeRef = useRef<TopPackageVulnerabilidadeCardRef>(null);
  const toppscorevulnerabilidadeRef = useRef<TopScoreVulnerabilidadeCardRef>(null);
  const toposgraficovulnerabilidadeRef = useRef<TopOSGraficoCardRef>(null);
  const anovulnerabilidadeRef = useRef<AnoVulnerabilidadeCardRef>(null);

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

      <VulnSeveridadeCard
        ref={vulnseveridadeRef}
        onAtualizar={atualizarTudo} // 👈 botão do card chama esse
      />

      <section className="rounded-2xl shadow-lg my-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
          <TopVulnerabilidadeCard ref={topvulnerabilidadeRef} />
          <TopOSVulnerabilidadeCard ref={topvosulnerabilidadeRef} />
          <TopAgenteVulnerabilidadeCard ref={topagentevulnerabilidadeRef} />
          <TopPackageVulnerabilidadeCard ref={toppackagevulnerabilidadeRef} />
        </div>
      </section>

      <section className="rounded-2xl shadow-lg my-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          <TopScoreVulnerabilidadeCard ref={toppscorevulnerabilidadeRef} />
          <TopOSGraficoCard ref={toposgraficovulnerabilidadeRef} />
          <AnoVulnerabilidadeCard ref={anovulnerabilidadeRef} />
        </div>
      </section>
    </LayoutModel>
  );
}
