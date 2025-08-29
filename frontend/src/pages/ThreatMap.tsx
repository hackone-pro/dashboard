import LayoutModel from '../componentes/LayoutModel';
import GeoHitsMap from '../componentes/graficos/GeoHitsMap';
import TopCountriesCard from '../componentes/wazuh/threatmap/TopCountriesCard';
import ThreatSeverityCard from '../componentes/wazuh/threatmap/ThreatSeverityCard';

export default function ThreatMap() {
  return (
    <LayoutModel titulo="Threat Map">
      <div className="relative w-full h-[calc(100vh-140px)]">
        {/* Mapa */}
        <GeoHitsMap height="100%" />

        {/* Card (overlay direita) */}
        <div className="absolute top-4 right-4 w-[300px] z-50">
          <TopCountriesCard />
          <ThreatSeverityCard dias="todos" topN={5} />
        </div>
      </div>
    </LayoutModel>
  );
}
