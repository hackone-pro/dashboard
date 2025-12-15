// src/componentes/dashboard/WidgetConfig.ts

export interface WidgetConfig {
  id: string;
  label: string;

  // tamanho inicial
  w: number;
  h: number;

  // limites
  minW?: number;
  minH?: number;
}

export const widgetsConfig: WidgetConfig[] = [
  //RiskLevel
  { id: "grafico_risco", label: "Nível de Risco", w: 3, h: 9, minW: 3, minH: 9},
  { id: "geo_map", label: "Mapa de Ataques", w: 6, h: 13, minW: 6, minH: 13 },
  { id: "top_paises", label: "Top Países", w: 3, h: 13, minW: 3, minH: 13 },
  { id: "top_incidentes", label: "Top Incidentes", w: 3, h: 18, minW: 3, minH: 16 },
  { id: "ia_humans", label: "IA x Humans", w: 6, h: 14, minW: 6, minH: 14 },
  { id: "top_firewalls", label: "Top Firewalls", w: 3, h: 14, minW: 3, minH: 14 },
  { id: "top_agentes", label: "Top Hosts", w: 6, h: 13, minW: 6, minH: 13 },
  { id: "top_agentes_cis", label: "Auditoria CIS - Top Servidores", w: 6, h: 13, minW: 6, minH: 13 },
  { id: "top_alertas_firewall", label: "Alertas de Firewall", w: 3, h: 9, minW: 3, minH: 9 },
  { id: "severidade_card", label: "Nível de Alertas", w: 12, h: 6, minW: 12, minH: 6 },
  { id: "controle_incidentes", label: "Controle de Incidentes", w: 6, h: 12, minW: 6, minH: 12 },

  //Detecção de Vulnerabildiades
  { id: "vulnerabilidade_severidade", label: "Alertas de Vulnerabilidades", w: 12, h: 5, minW: 12, minH: 5 },
  { id: "top_vulnerabilidades", label: "Top 5 Vulnerabilidades", w: 3, h: 7, minW: 3, minH: 7 },
  { id: "top_5_os", label: "Top 5 (OS)", w: 3, h: 7, minW: 3, minH: 7 },
  { id: "top_5_agentes", label: "Top 5 Agentes", w: 3, h: 7, minW: 3, minH: 7 },
  { id: "top_5_pacotes", label: "Top 5 Pacotes", w: 3, h: 7, minW: 3, minH: 7 },
  { id: "top_score_vulnerabilidades", label: "Pontuações de vulnerabilidade mais comuns", w: 4, h: 11, minW: 4, minH: 11 },
  { id: "top_os_grafico", label: "Vulnerabilidades por Sistema Operacional", w: 4, h: 11, minW: 4, minH: 11 },
  { id: "ano_vulnerabilidade", label: "Vulnerabilidades por Ano", w: 4, h: 11, minW: 4, minH: 11 },
];
