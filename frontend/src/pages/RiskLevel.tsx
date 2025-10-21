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

export default function RiskLevel() {
  const token = getToken();
  const formatador = new Intl.NumberFormat("pt-BR");

  // 🔹 Filtros globais e individuais
  const [dias, setDias] = useState<string>("1");
  const [diasFirewall, setDiasFirewall] = useState<string | null>(null);
  const [diasAgentes, setDiasAgentes] = useState<string | null>(null);
  const [diasSeveridade, setDiasSeveridade] = useState<string | null>(null);
  const [diasCis, setDiasCis] = useState<string | null>(null);

  const [totalAlertas, setTotalAlertas] = useState<number>(0);
  const [indiceRisco, setIndiceRisco] = useState<number>(0);
  const [carregando, setCarregando] = useState<boolean>(true);

  // 🔹 Atualiza o Gauge com base em todos os filtros combinados
  useEffect(() => {
    async function carregar() {
      try {
        setCarregando(true);

        const queryParams = new URLSearchParams({
          dias,
          ...(diasFirewall ? { firewall: diasFirewall } : {}),
          ...(diasAgentes ? { agentes: diasAgentes } : {}),
          ...(diasSeveridade ? { severidade: diasSeveridade } : {}),
          ...(diasCis ? { cis: diasCis } : {}),
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
        console.error("Erro ao carregar RiskLevel:", err);
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [dias, diasFirewall, diasAgentes, diasSeveridade, diasCis]); // 👈 adiciona o CIS aqui

  return (
    <LayoutModel titulo="Risk Level">
      {/* Bloco principal com Gauge + Severidade */}
      <section className="cards p-6 rounded-2xl shadow-lg">
        <div className="flex flex-wrap justify-between items-start mb-6">
          <div className="flex flex-col">
            <h2 className="text-white text-md font-medium">Nível de alertas</h2>
            {/* <span className="text-xs text-gray-400 mt-1">
              Filtros ativos: Global {dias}d
              {diasFirewall && ` • Firewall ${diasFirewall}d`}
              {diasAgentes && ` • Hosts ${diasAgentes}d`}
              {diasCis && ` • CIS ${diasCis}d`}
              {diasSeveridade && ` • Severidades ${diasSeveridade}d`}
            </span> */}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-white text-base font-semibold">
              {formatador.format(totalAlertas)} alertas totais
            </h3>

            {/* 🔹 Select global */}
            <select
              value={dias}
              onChange={(e) => setDias(e.target.value)}
              className="cards text-white text-sm px-3 py-1 rounded-md border border-[#3B2A70] outline-none bg-[#1a1a2e]"
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

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
          {/* Gauge */}
          <div className="cards rounded-xl p-4 flex flex-col justify-center relative h-full">
            <GraficoGauge valor={Math.round(indiceRisco)} />

            <img
              src="/assets/img/icon-risk.png"
              alt="Risco"
              className="absolute z-20 w-6 h-6 top-1/3 left-1/2 -translate-x-1/2 -translate-y-[72%] pointer-events-none"
            />

            <div className="flex gap-3 text-xs text-gray-400 mt-4 text-[10px] justify-center">
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
          </div>

          {/* Severidade */}
          <div className="md:col-span-4 h-full">
            <SeveridadeCard dias={diasSeveridade || dias} />
          </div>
        </div>
      </section>

      {/* Bloco inferior com outros cards */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8 items-stretch">
        {/* Coluna 1 - Top Hosts */}
        <TopAgentsCard
          dias={diasAgentes || dias}
          onChangeFiltro={setDiasAgentes}
        />

        {/* Coluna 2 - Top CIS */}
        <TopAgentsCisCard
          dias={diasCis || dias}
          onChangeFiltro={setDiasCis}
        />

        {/* Coluna 3 - Firewall + FluxoIncidentes */}
        <div className="flex flex-col h-full">
          <FirewallDonutCard
            dias={diasFirewall || dias}
            onChangeFiltro={setDiasFirewall}
          />

          <div className="flex-1">
            <div className="cards rounded-xl p-6 shadow-md h-full">
              <FluxoIncidentes token={token || ""} />
            </div>
          </div>
        </div>
      </section>
    </LayoutModel>
  );
}
