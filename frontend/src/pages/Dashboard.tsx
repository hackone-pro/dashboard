// src/pages/Dashboard.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import LayoutModel from "../componentes/LayoutModel";
import GeoHitsMap from "../componentes/graficos/GeoHitsMap";
import GraficoGauge from "../componentes/graficos/GraficoGauge";
import { getToken } from "../utils/auth";
import { getSeveridadeWazuh } from "../services/wazuh/severidade.service";

import TopIncidentesCard from "../componentes/iris/TopIncidents";
import IaHumans from "../componentes/iris/IaHumans";
import TopFirewallCard from "../componentes/wazuh/TopFirewallCard";
import TopCountriesTable from "../componentes/wazuh/threatmap/TopCountriesTable";

import { useTenant } from "../context/TenantContext";

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
  const fmt = useMemo(() => new Intl.NumberFormat("pt-BR"), []);
  const { tenantAtivo, loading } = useTenant();

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

  // ✅ O retorno condicional vem *depois* de todos os hooks
  return (
    <LayoutModel titulo="Home">
      {loading || !tenantAtivo ? null : (
        <section className="grid grid-cols-12 gap-3 mb-8 items-start animate-fade-in">

          {/* COLUNA 1 */}
          <div className="col-span-3 h-full">
            <div className="flex flex-col h-full">
              <div className="cards relative overflow-hidden risk-light-effect h-[340px] p-6 rounded-2xl shadow-lg flex flex-col gap-4 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
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

              <TopIncidentesCard token={token || ""} />
            </div>
          </div>

          {/* COLUNA 2 */}
          <div className="col-span-6 h-full">
            <div className="flex flex-col h-full">
              <div className="cards inverse flex-grow p-2 md:p-6 rounded-2xl shadow-lg card-dashboard mb-3">
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

              <div className="cards relative overflow-hidden glow-bottom p-6 rounded-2xl shadow-lg card-dashboard transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <IaHumans token={token || ""} />
              </div>
            </div>
          </div>

          {/* COLUNA 3 */}
          <div className="col-span-3 h-full">
            <div className="flex flex-col h-full">
              <div className="cards flex-grow p-6 rounded-2xl h-115 shadow-lg card-dashboard mb-3 transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="grid grid-cols-12 mb-5">
                  <div className="col-span-12">
                    <h3 className="text-sm text-white">Top 10 países de origem de ataque</h3>
                  </div>
                </div>
                <TopCountriesTable dias="todos" limit={10} onTotalChange={setTotalAtaques} />
              </div>

              <TopFirewallCard />
            </div>
          </div>
        </section>
      )}
    </LayoutModel>
  );
}