//MODELO DE PÁGINA
import LayoutModel from '../componentes/LayoutModel';

//CARDS COMPONENTES
import VulnSeveridadeCard from '../componentes/wazuh/VulnServeridadeCard';
import TopVulnerabilidadeCard from '../componentes/wazuh/TopVulnerabilidadeCard';
import TopOSVulnerabilidadeCard from '../componentes/wazuh/TopOSVulnerabilidadeCard';
import TopAgenteVulnerabilidadeCard from '../componentes/wazuh/TopAgenteVulnerabilidadeCard';
import TopPackageVulnerabilidadeCard from '../componentes/wazuh/TopPackageVulnerabilidadeCard';
import TopScoreVulnerabilidadeCard from '../componentes/wazuh/TopScoreVulnerabilidadeCard';
import TopOSGraficoCard from '../componentes/wazuh/TopOSGraficoCard';
import AnoVulnerabilidadeCard from '../componentes/wazuh/AnoVulnerabilidadeCard';

export default function VulnerabilitiesDetection() {

  return (
    <LayoutModel titulo="Detecção de vulnerabilidades">
      
      <VulnSeveridadeCard />

      <section className="rounded-2xl shadow-lg my-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">

          {/* Coluna 1 */}
          <TopVulnerabilidadeCard />

          {/* Coluna 2 */}
          <TopOSVulnerabilidadeCard />

          {/* Coluna 3 */}
          <TopAgenteVulnerabilidadeCard />

          {/* Coluna 4 */}
          <TopPackageVulnerabilidadeCard />

        </div>
      </section>

      <section className="rounded-2xl shadow-lg my-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        
          {/* Coluna 1 */}
          <TopScoreVulnerabilidadeCard />

          {/* Coluna 2 */}
          <TopOSGraficoCard />

          {/* Coluna 3 */}
          <AnoVulnerabilidadeCard />

        </div>
      </section>
    </LayoutModel>
  );
}
