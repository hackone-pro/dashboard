// src/componentes/dashboard/WidgetConfig.ts

export interface WidgetConfig {
    id: string;   // identificador único
    label: string; // nome amigável mostrado no menu
    w: number;     // largura no grid
    h: number;     // altura no grid
  }
  
  export const widgetsConfig: WidgetConfig[] = [
    { id: "grafico_risco", label: "Nível de Risco", w: 3, h: 9 },
    { id: "geo_map", label: "Mapa de Ataques", w: 6, h: 13 },
    { id: "top_paises", label: "Top Países", w: 3, h: 13 },
    { id: "top_incidentes", label: "Top Incidentes", w: 3, h: 18 },
    { id: "ia_humans", label: "IA Humans", w: 6, h: 14 },
    { id: "top_firewalls", label: "Top Firewalls", w: 3, h: 14 },
    { id: "top_agentes", label: "Top Hosts", w: 3, h: 14 },
  ];
  