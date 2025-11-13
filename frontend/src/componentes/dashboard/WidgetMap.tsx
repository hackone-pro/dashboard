import { GripVertical } from "lucide-react";
import GraficoGauge from "../graficos/GraficoGauge";
import GeoHitsMap from "../graficos/GeoHitsMap";
import TopIncidentesCard from "../iris/TopIncidents";
import IaHumans from "../iris/IaHumans";
import TopFirewallCard from "../wazuh/TopFirewallCard";
import TopCountriesTable from "../wazuh/threatmap/TopCountriesTable";
import TopAgentsCard from "../wazuh/RiskLevel/TopAgentsCard"; 
import { JSX } from "react";

export function getWidgetMap(
  navigate: (path: string) => void,
  token: string,
  indiceRisco: number,
  setTotalAtaques: (total: number) => void
): Record<string, JSX.Element> {
  return {
    // ✅ Nível de Risco (mantido completo com legenda e botão)
    grafico_risco: (
      <div className="cards relative overflow-hidden risk-light-effect h-[340px] p-6 rounded-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center text-sm text-white px-1">
          {/* 🔹 Handle de drag (6 pontinhos estilo AWS) */}
          <div className="flex items-center gap-2 drag-handle cursor-grab active:cursor-grabbing select-none">
            <GripVertical size={18} className="text-white/50 hover:text-white transition" />
            <span className="font-medium">Nível de Risco</span>
          </div>
        </div>

        {/* 🔹 Conteúdo principal do card */}
        <div className="flex justify-center flex-grow relative mt-2">
          <GraficoGauge valor={Math.round(indiceRisco)} />
          <img
            src="/assets/img/icon-risk.png"
            alt="Risco"
            className="absolute z-20 w-6 h-6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-[72%]"
          />
        </div>

        {/* 🔹 Legenda e botão */}
        <div className="flex items-center justify-between text-[10px] mt-2 text-gray-400 w-full">
          <div className="flex gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#1DD69A] rounded-xs"></span> Baixo
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#6366F1] rounded-xs"></span> Médio
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#A855F7] rounded-xs"></span> Alto
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#F914AD] rounded-xs"></span> Crítico
            </span>
          </div>
          <button
            onClick={() => navigate("/risk-level")}
            className="px-2 py-1 btn hover:bg-purple-600 text-white rounded-md transition-all"
          >
            Acessar →
          </button>
        </div>
      </div>
    ),

    // 🌍 Mapa de Ataques
    geo_map: (
      <div className="cards inverse p-2 md:p-5 rounded-2xl shadow-lg h-full">
        <div className="flex items-center justify-between gap-2 cursor-default select-none mb-5">
          <div className="flex items-center gap-2">
            <GripVertical
              size={18}
              className="drag-handle cursor-grab active:cursor-grabbing text-white/50 hover:text-white transition"
            />
            <h3 className="text-sm text-white text-left">Mapa de Ataque</h3>
          </div>

          <button
            onClick={() => navigate("/threat-map")}
            className="px-2 py-1 mr-10 text-[11px] text-white rounded-md transition-all btn hover:bg-purple-600"
          >
            Ver mapa completo →
          </button>
        </div>

        <GeoHitsMap />
      </div>
    ),

    // 🔝 Top Incidentes
    top_incidentes: <TopIncidentesCard token={token || ""} />,

    // 🔥 Top Firewalls
    top_firewalls: <TopFirewallCard />,

    // 🌎 Top Países de Origem
    top_paises: (
      <div className="p-6 h-full drag-handle cursor-grab active:cursor-grabbing select-none">
        <div className="flex items-center gap-2 mb-4">
          <GripVertical size={18} className="text-white/50 hover:text-white transition" />
          <h3 className="text-sm text-white">Top 10 países de origem</h3>
        </div>
        <TopCountriesTable dias="todos" limit={10} onTotalChange={setTotalAtaques} />
      </div>
    ),

    // 🤖 IA Humans
    ia_humans: (
      <div className="cards p-4 rounded-2xl shadow-lg h-full flex flex-col">
        <IaHumans token={token || ""} />
      </div>
    ),

    top_agentes: (
      <TopAgentsCard dias="1" isWidget={true}  />   // 24h por padrão, pode mudar
    ),
  };
}
