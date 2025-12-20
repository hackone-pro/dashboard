import { useEffect, useState } from "react";
import LayoutModel from "../componentes/LayoutModel";
import GraficoGauge from "../componentes/graficos/GraficoGauge";
import SeveridadeCard from "../componentes/wazuh/RiskLevel/SeveridadeCard";
import TopAgentsCard from "../componentes/wazuh/RiskLevel/TopAgentsCard";
import TopAgentsCisCard from "../componentes/wazuh/RiskLevel/TopAgentsCisCard";
import FirewallDonutCard from "../componentes/wazuh/RiskLevel/FirewallDonutCard";
import FluxoIncidentes from "../componentes/iris/FluxoIncidentes";
import { getToken } from "../utils/auth";
import { RiskLevelResposta } from "../services/wazuh/risklevel.service";
import { useTenant } from "../context/TenantContext";

export default function RiskLevel() {
  const token = getToken();
  const { tenantAtivo } = useTenant(); // 👈 tenant só refaz o Gauge
  const formatador = new Intl.NumberFormat("pt-BR");

  // Filtros
  const [dias, setDias] = useState<string>("1");
  const [diasFirewall, setDiasFirewall] = useState<string | null>(null);
  const [diasAgentes, setDiasAgentes] = useState<string | null>(null);
  const [diasSeveridade, setDiasSeveridade] = useState<string | null>(null);
  const [diasCis, setDiasCis] = useState<string | null>(null);
  const [diasIris, setDiasIris] = useState<string | null>(null);

  // Totais
  const [totalAlertas, setTotalAlertas] = useState<number>(0);
  const [indiceRisco, setIndiceRisco] = useState<number>(0);
  const [totalIncidentes, setTotalIncidentes] = useState<number>(0);

  // Atualiza SOMENTE o Gauge
  useEffect(() => {
    if (!tenantAtivo) return;

    async function carregar() {
      try {
        const queryParams = new URLSearchParams({
          dias,
          ...(diasFirewall ? { firewall: diasFirewall } : {}),
          ...(diasAgentes ? { agentes: diasAgentes } : {}),
          ...(diasSeveridade ? { severidade: diasSeveridade } : {}),
          ...(diasCis ? { cis: diasCis } : {}),
          ...(diasIris ? { iris: diasIris } : {}),
        }).toString();

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/acesso/wazuh/riskLevel?${queryParams}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) throw new Error("Falha ao buscar dados de risco");

        const dados: RiskLevelResposta = await res.json();
        setTotalAlertas(dados.severidades.total);
        setIndiceRisco(dados.indiceRisco);
      } catch (err) {
        console.error("❌ Erro ao carregar RiskLevel:", err);
      }
    }

    carregar();
  }, [
    tenantAtivo, // 👈 dispara recarregamento do Gauge
    dias,
    diasFirewall,
    diasAgentes,
    diasSeveridade,
    diasCis,
    diasIris,
  ]);

  return (
    <LayoutModel titulo="Risk Level">
      {/* Bloco principal com Gauge + Severidade */}
      <section>

        {/* HEADER (total + select) */}
        <div className="cards p-6 rounded-xl flex justify-between items-center mb-5 gap-4">

          {/* ESQUERDA: título */}
          <h2 className="text-white text-md font-medium">
            Nível de alertas
          </h2>

          {/* DIREITA: total + select */}
          <div className="flex items-center gap-4">
            <p className="text-white text-base font-semibold">
              {formatador.format(totalAlertas + totalIncidentes)} alertas totais
            </p>

            <select
              value={dias}
              onChange={(e) => setDias(e.target.value)}
              className="text-white text-sm px-3 py-1 rounded-md 
                 border border-[#3B2A70] outline-none bg-[#1a1a2e]"
            >
              <option value="1">24 horas</option>
              <option value="2">48 horas</option>
              <option value="7">7 dias</option>
              <option value="15">15 dias</option>
              <option value="30">30 dias</option>
              <option value="todos">Todos</option>
            </select>
          </div>

        </div>


        {/* GRID DE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">

          {/* CARD DO GAUGE */}
          <div className="cards rounded-xl p-4 h-full flex flex-col justify-between">
            <div className="relative flex justify-center">
              <GraficoGauge valor={Math.round(indiceRisco)} />

              <img
                src="/assets/img/icon-risk.png"
                alt="Risco"
                className="absolute z-20 w-6 h-6 top-1/2 left-1/2 
                   -translate-x-1/2 -translate-y-[95%]
                   pointer-events-none"
              />
            </div>

            <div className="flex justify-center gap-3 text-[10px] text-gray-400 mt-4 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-[#1DD69A]" /> Baixo
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-[#6366F1]" /> Médio
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-[#A855F7]" /> Alto
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-[#F914AD]" /> Crítico
              </span>
            </div>
          </div>

          {/* CARD DE SEVERIDADE */}
          <div className="md:col-span-4 h-full">
            <SeveridadeCard dias={diasSeveridade || dias} />
          </div>

        </div>
      </section>

      {/* Bloco inferior com os outros cards */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-5 items-stretch">
        <TopAgentsCard dias={diasAgentes || dias} onChangeFiltro={setDiasAgentes} />
        <TopAgentsCisCard dias={diasCis || dias} onChangeFiltro={setDiasCis} />

        <div className="flex flex-col h-full">
          <FirewallDonutCard dias={diasFirewall || dias} onChangeFiltro={setDiasFirewall} />
          <div className="flex-1">
            <div className="cards rounded-xl p-6 shadow-md h-full">
              <FluxoIncidentes
                token={token || ""}
                diasGlobal={dias}
                onChangeFiltro={setDiasIris}
                onUpdateTotais={setTotalIncidentes}
              />
            </div>
          </div>
        </div>
      </section>
    </LayoutModel>
  );
}