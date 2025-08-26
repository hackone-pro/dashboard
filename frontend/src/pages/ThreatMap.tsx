// src/pages/ThreatMap.tsx
import LayoutModel from '../componentes/LayoutModel';
import GeoHitsMap from '../componentes/graficos/GeoHitsMap';

export default function ThreatMap() {
  return (
    <LayoutModel titulo="Threat Map">
      <div className="w-full h-[calc(100vh-140px)]"> 
        {/* 👆 ajuste o valor (140px) conforme a altura do header/breadcrumb dentro do seu LayoutModel */}
        <GeoHitsMap height="100%" />
      </div>
    </LayoutModel>
  );
}
