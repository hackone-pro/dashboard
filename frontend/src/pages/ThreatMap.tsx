import { useEffect, useState } from 'react';
import LayoutModel from '../componentes/LayoutModel';
import GeoHitsMap from '../componentes/graficos/GeoHitsMap';
import TopCountriesCard from '../componentes/wazuh/threatmap/TopCountriesCard';
import ThreatSeverityCard from '../componentes/wazuh/threatmap/ThreatSeverityCard';
import TopAttackCard from '../componentes/wazuh/threatmap/TopAttackCard';
import TopThreatCard from '../componentes/wazuh/threatmap/TopThreatCard';
import LiveAttackCard from '../componentes/wazuh/threatmap/LiveAttackCard';

import { AttackStreamProvider, useAttackStream } from '../context/AttackStreamProvider';
import { useScreenContext } from '../context/ScreenContext';

type PaisItem = { pais: string; total: number };
type MitreItem = { tecnica: string; total: number };

function ThreatMapContent() {
  const { setScreenData } = useScreenContext();
  const { events, ready } = useAttackStream();

  const [topPaises, setTopPaises] = useState<PaisItem[]>([]);
  const [topTecnicas, setTopTecnicas] = useState<MitreItem[]>([]);

  useEffect(() => {
    if (!ready && events.length === 0) return;

    // Computa top países a partir dos eventos do stream
    const contagemPaises: Record<string, number> = {};
    events.forEach((e) => {
      const pais = e.origem?.pais;
      if (pais) contagemPaises[pais] = (contagemPaises[pais] ?? 0) + 1;
    });
    const paisesOrdenados = Object.entries(contagemPaises)
      .map(([pais, total]) => ({ pais, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    setScreenData("threat-map", {
      totalEventosAtivos: events.length,
      topPaisesStream: paisesOrdenados,
      topPaises: topPaises.slice(0, 5),
      topTecnicasMitre: topTecnicas.slice(0, 5),
    });
  }, [events, ready, topPaises, topTecnicas, setScreenData]);

  return (
    <div className="relative w-full h-[calc(100vh-140px)]">
      {/* Mapa */}
      <GeoHitsMap height="100%" />

      {/* =====================
          COLUNA ESQUERDA
      ===================== */}
      <div className="absolute top-4 left-4 w-[300px] z-50 space-y-3">
        <TopAttackCard onDadosCarregados={setTopTecnicas} />
        <TopThreatCard />
      </div>

      {/* Card (overlay direita) */}
      <div className="absolute top-4 right-4 w-[300px] z-50">
        <TopCountriesCard onDadosCarregados={setTopPaises} />
        <ThreatSeverityCard dias="todos" topN={5} />
      </div>

      {/* CARD CENTRAL NO BOTTOM */}
      <div className="absolute bottom-4 left-1/2 z-50
                      -translate-x-1/2
                      w-[660px]">
        <LiveAttackCard />
      </div>
    </div>
  );
}

export default function ThreatMap() {
  return (
    <LayoutModel titulo="Threat Map">
      <AttackStreamProvider>
        <ThreatMapContent />
      </AttackStreamProvider>
    </LayoutModel>
  );
}
