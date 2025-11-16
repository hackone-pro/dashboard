// src/componentes/dashboard/WidgetConfig.ts

export interface WidgetConfig {
    id: string;   // identificador único
    label: string; // nome amigável mostrado no menu
    w: number;     // largura no grid
    h: number;     // altura no grid
  }
  
  export const widgetsConfig: WidgetConfig[] = [
    //RiskLevel
    { id: "grafico_risco", label: "Nível de Risco", w: 3, h: 9 },
    { id: "geo_map", label: "Mapa de Ataques", w: 6, h: 13 },
    { id: "top_paises", label: "Top Países", w: 3, h: 13 },
    { id: "top_incidentes", label: "Top Incidentes", w: 3, h: 18 },
    { id: "ia_humans", label: "IA x Humans", w: 6, h: 14 },
    { id: "top_firewalls", label: "Top Firewalls", w: 3, h: 14 },
    { id: "top_agentes", label: "Top Hosts", w: 6, h: 13 },
    { id: "top_agentes_cis", label: "Auditoria CIS - Top Servidores", w: 6, h: 13 },
    { id: "top_alertas_firewall", label: "Alertas de Firewall", w: 3, h: 9 },
    { id: "severidade_card", label: "Nível de Alertas", w: 12, h: 6 },
    { id: "controle_incidentes", label: "Controle de Incidentes", w: 6, h: 12 },

    //Detecção de Vulnerabildiades
    { id: "vulnerabilidade_severidade", label: "Alertas de Vulnerabilidades", w: 12, h: 5 },
    { id: "top_vulnerabilidades", label: "Top 5 Vulnerabilidades", w: 3, h: 7 },
    { id: "top_5_os", label: "Top 5 (OS)", w: 3, h: 7 },
    { id: "top_5_agentes", label: "Top 5 Agentes", w: 3, h: 7 },
    { id: "top_5_pacotes", label: "Top 5 Pacotes", w: 3, h: 7 },
    { id: "top_score_vulnerabilidades", label: "Pontuações de vulnerabilidade mais comuns", w: 4, h: 11 },
    { id: "top_os_grafico", label: "Vulnerabilidades por Sistema Operacional", w: 4, h: 11 },
    { id: "ano_vulnerabilidade", label: "Vulnerabilidades por Ano", w: 4, h: 11 },
  ];
  