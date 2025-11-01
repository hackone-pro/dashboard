// src/pages/Dashboard.tsx
import { useState, useEffect, useMemo, JSX } from "react";
import { useNavigate } from "react-router-dom";

import { WidthProvider, Layout } from "react-grid-layout";
import GridLayoutBase from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import LayoutModel from "../componentes/LayoutModel";
import GeoHitsMap from "../componentes/graficos/GeoHitsMap";
import GraficoGauge from "../componentes/graficos/GraficoGauge";
import { getSeveridadeWazuh } from "../services/wazuh/severidade.service";
import { getToken } from "../utils/auth";

import TopIncidentesCard from "../componentes/iris/TopIncidents";
import IaHumans from "../componentes/iris/IaHumans";
import TopFirewallCard from "../componentes/wazuh/TopFirewallCard";
import TopCountriesTable from "../componentes/wazuh/threatmap/TopCountriesTable";

import { useTenant } from "../context/TenantContext";
import {
  getDashboardLayout,
  saveDashboardLayout,
  resetDashboardLayout,
  WidgetLayout,
} from "../services/dashboard/dashboardLayout.service";


function getNivelExposicao(percentual: number) {
  if (percentual < 40) return { label: "Baixo", badge: "badge-green" };
  if (percentual < 73.5) return { label: "Médio", badge: "badge-darkpink" };
  if (percentual < 93.5) return { label: "Alto", badge: "badge-high" };
  return { label: "Crítico", badge: "badge-pink" };
}

export default function Dashboard() {
  const token = getToken();
  const navigate = useNavigate();
  const [indiceRisco, setIndiceRisco] = useState(0);
  const [totalAtaques, setTotalAtaques] = useState(0);
  const [layout, setLayout] = useState<WidgetLayout[]>([]); // layout dinâmico
  const [loadingLayout, setLoadingLayout] = useState(true);
  const GridLayout = WidthProvider(GridLayoutBase);

  const fmt = useMemo(() => new Intl.NumberFormat("pt-BR"), []);
  const { tenantAtivo, loading } = useTenant();

  useEffect(() => {
    async function carregarLayout() {
      try {
        const data = await getDashboardLayout();
        setLayout(data.layout || []);
      } catch (err) {
        console.error("Erro ao carregar layout da dashboard:", err);
      } finally {
        setLoadingLayout(false);
      }
    }
    carregarLayout();
  }, []);

  // ✅ Hook sempre executa
  useEffect(() => {
    if (!tenantAtivo) return;

    let ativo = true;
    const carregarDados = async () => {
      try {
        const inicio = Date.now();
        const dados = await getSeveridadeWazuh();
        const { baixo, medio, alto, critico, total } = dados;

        const risco =
          total > 0
            ? ((baixo * 0.2 + medio * 0.6 + alto * 0.87 + critico * 1.0) / total) * 100
            : 0;

        const elapsed = Date.now() - inicio;
        const delay = Math.max(600 - elapsed, 0);
        setTimeout(() => {
          if (ativo) setIndiceRisco(risco);
        }, delay);
      } catch (err) {
        console.error("Erro ao carregar severidades:", err);
        if (ativo) setIndiceRisco(0);
      }
    };

    carregarDados();
    return () => {
      ativo = false;
    };
  }, [tenantAtivo]);

  const widgetMap: Record<string, JSX.Element> = {
    grafico_risco: (
      <div className="cards custom relative overflow-hidden risk-light-effect h-[340px] p-6 rounded-2xl shadow-lg flex flex-col gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
        <div className="flex justify-between items-center relative z-[9999]">
          <div className="flex items-center gap-1 text-sm text-white relative group">
            <span>Nível de Risco</span>
          </div>
        </div>

        <div className="grid grid-cols-12 items-center gap-3 relative">
          <div className="col-span-12 flex justify-center relative">
            <GraficoGauge valor={Number.isFinite(indiceRisco) ? Math.round(indiceRisco) : 0} />
            <img
              src="/assets/img/icon-risk.png"
              alt="Risco"
              className="absolute z-20 w-6 h-6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-[72%] pointer-events-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] mt-2 text-gray-400 w-full">
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#1DD69A] rounded-xs"></span> Baixo
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#6366F1] rounded-xs"></span> Médio
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#A855F7] rounded-xs"></span> Alto
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#F914AD] rounded-xs"></span> Crítico
            </div>
          </div>
          <button
            onClick={() => navigate("/risk-level")}
            className="px-2 py-1 card btn hover:bg-purple-600 text-white rounded-md transition-all duration-300"
          >
            Acessar →
          </button>
        </div>
      </div>
    ),
    geo_map: (
      <div className="cards custom inverse flex-grow p-2 md:p-6 rounded-2xl shadow-lg card-dashboard mb-3">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-sm text-white">Mapa de Ataque</h3>
          <button
            onClick={() => navigate("/threat-map")}
            className="px-2 py-1 btn card text-[11px] text-white rounded-md transition-all duration-300"
          >
            Ver mapa completo →
          </button>
        </div>
        <GeoHitsMap />
      </div>
    ),
    top_incidentes: <TopIncidentesCard token={token || ""} />,
    top_firewalls: <TopFirewallCard />,
    top_paises: (
      <div className="cards custom p-6 rounded-2xl shadow-lg mb-3">
        <h3 className="text-sm text-white mb-4">Top 10 países de origem de ataque</h3>
        <TopCountriesTable dias="todos" limit={10} onTotalChange={setTotalAtaques} />
      </div>
    ),
    ia_humans: (
      <div className="cards custom relative overflow-hidden glow-bottom rounded-2xl shadow-lg card-dashboard transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        <IaHumans token={token || ""} />
      </div>
    ),
  };


  // ✅ O retorno condicional vem *depois* de todos os hooks
  return (
    <LayoutModel titulo="Home">
      {loading || loadingLayout ? (
        <div className="flex items-center justify-center h-[80vh] text-gray-400 animate-fade-in">
          <p>Carregando dashboard...</p>
        </div>
      ) : (
        <GridLayout
          className="layout"
          cols={12}                     // 12 colunas fixas (padrão AWS)
          rowHeight={100}               // altura base de cada linha
          width={1600}                  // define a largura total da grade
          layout={layout}
          margin={[20, 20]}             // espaçamento entre blocos
          compactType="vertical"        // empilha automaticamente
          preventCollision={false}      // permite arrastar livremente
          isDraggable={true}
          isResizable={true}
          autoSize={true}
          onLayoutChange={(newLayout) => setLayout(newLayout as WidgetLayout[])}
        >
          {layout.map((item) => (
            <div
              key={item.i}
              className="transition-all duration-300 rounded-2xl overflow-hidden"
              style={{
                background: "rgba(30, 30, 40, 0.9)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {widgetMap[item.i] || (
                <div className="text-gray-400 text-sm text-center p-4">
                  Widget desconhecido: <strong>{item.i}</strong>
                </div>
              )}
            </div>
          ))}
        </GridLayout>

      )}
    </LayoutModel>
  );
}
