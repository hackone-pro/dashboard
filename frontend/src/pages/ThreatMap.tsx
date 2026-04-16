import { useEffect } from 'react';
import LayoutModel from '../componentes/LayoutModel';
import GeoHitsMap from '../componentes/graficos/GeoHitsMap';
import TopCountriesCard from '../componentes/wazuh/threatmap/TopCountriesCard';
import ThreatSeverityCard from '../componentes/wazuh/threatmap/ThreatSeverityCard';
import TopAttackCard from '../componentes/wazuh/threatmap/TopAttackCard';
import TopThreatCard from '../componentes/wazuh/threatmap/TopThreatCard';
import LiveAttackCard from '../componentes/wazuh/threatmap/LiveAttackCard';

import { AttackStreamProvider } from '../context/AttackStreamProvider';
import { useScreenContext } from '../context/ScreenContext';

export default function ThreatMap() {
  const { setScreenData } = useScreenContext();

  useEffect(() => {
    setScreenData("threat-map", {
      observacao: "Mapa de ameaças em tempo real com ataques geo-referenciados, top países, severidades e ataques ativos.",
    });
  }, []);

  return (
    <LayoutModel titulo="Threat Map">
      <AttackStreamProvider>
        <div className="relative w-full h-[calc(100vh-140px)]">
          {/* Mapa */}
          <GeoHitsMap height="100%" />

          {/* =====================
              COLUNA ESQUERDA
          ===================== */}
          <div className="absolute top-4 left-4 w-[300px] z-50 space-y-3">
            <TopAttackCard />
            <TopThreatCard />
          </div>

          {/* Card (overlay direita) */}
          <div className="absolute top-4 right-4 w-[300px] z-50">
            <TopCountriesCard />
            <ThreatSeverityCard dias="todos" topN={5} />
          </div>

          {/* CARD CENTRAL NO BOTTOM */}
          <div className="absolute bottom-4 left-1/2 z-50
                          -translate-x-1/2
                          w-[660px]">
            <LiveAttackCard />
          </div>
        </div>
      </AttackStreamProvider>
    </LayoutModel>
  );
}