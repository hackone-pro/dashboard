import { useEffect, useState } from "react";
import LayoutModel from "../componentes/LayoutModel";
import GraficoGauge from "../componentes/graficos/GraficoGauge";
import SeveridadeCard from "../componentes/wazuh/RiskLevel/SeveridadeCard";
import TopAgentsCard from "../componentes/wazuh/RiskLevel/TopAgentsCard";
import TopAgentsCisCard from "../componentes/wazuh/RiskLevel/TopAgentsCisCard";
import FirewallDonutCard from "../componentes/wazuh/RiskLevel/FirewallDonutCard";
import FluxoIncidentes from "../componentes/iris/FluxoIncidentes";
import DateRangePicker from "../componentes/DataRangePicker";

import { getToken } from "../utils/auth";
import {
  RiskLevelResposta,
  Severidades,
} from "../services/wazuh/risklevel.service";
import { useTenant } from "../context/TenantContext";

import { FiRotateCcw } from "react-icons/fi";

export default function RiskLevel() {
  const token = getToken();
  const { tenantAtivo } = useTenant();
  const formatador = new Intl.NumberFormat("pt-BR");

  // 🔹 Filtros
  const [dias, setDias] = useState<string>("1");
  const [diasFirewall, setDiasFirewall] = useState<string | null>(null);
  const [diasAgentes, setDiasAgentes] = useState<string | null>(null);
  const [diasSeveridade, setDiasSeveridade] = useState<string | null>(null);
  const [diasCis, setDiasCis] = useState<string | null>(null);
  const [diasIris, setDiasIris] = useState<string | null>(null);

  const [periodo, setPeriodo] = useState<{
    from: string;
    to: string;
  } | null>(null);

  // 🔹 Loading da severidade (controla skeleton)
  const [loadingSeveridade, setLoadingSeveridade] = useState<boolean>(true);

  // 🔹 Dados globais (FONTE ÚNICA)
  const [severidades, setSeveridades] = useState<Severidades>({
    baixo: 0,
    medio: 0,
    alto: 0,
    critico: 0,
    total: 0,
  });

  const [indiceRisco, setIndiceRisco] = useState<number>(0);
  const [totalIncidentes, setTotalIncidentes] = useState<number>(0);

  // 🔹 Fetch GLOBAL (RiskLevel é o dono do estado)
  useEffect(() => {
    if (!tenantAtivo) return;

    async function carregar() {
      try {
        setLoadingSeveridade(true);

        const queryParams = new URLSearchParams({
          ...(periodo ? { from: periodo.from, to: periodo.to } : { dias }),
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

        if (!res.ok) {
          throw new Error("Falha ao buscar dados de RiskLevel");
        }

        const dados: RiskLevelResposta = await res.json();

        setSeveridades(dados.severidades);
        setIndiceRisco(dados.indiceRisco);
      } catch (err) {
        console.error("Erro ao carregar RiskLevel:", err);
      } finally {
        setLoadingSeveridade(false);
      }
    }

    carregar();
  }, [
    tenantAtivo,
    dias,
    periodo,
    diasFirewall,
    diasAgentes,
    diasSeveridade,
    diasCis,
    diasIris,
    token,
  ]);

  return (
    <LayoutModel titulo="Risk Level">
      {/* 🔹 Filtros */}
      <div className="flex justify-end mt-5 mb-3 px-6">
        <DateRangePicker
          onApply={(payload) => {
            setPeriodo(payload);
          }}
        />

        <button
          onClick={() => {
            setPeriodo(null);
            setDias("1");
            setDiasFirewall(null);
            setDiasAgentes(null);
            setDiasSeveridade(null);
            setDiasCis(null);
            setDiasIris(null);
          }}
          className="flex items-center gap-1 text-[14px] text-purple-400 hover:text-purple-200 transition-colors ml-3"
        >
          <FiRotateCcw className="w-4 h-4" />
          Limpar filtros
        </button>
      </div>

      {/* 🔹 Header */}
      <section>
        <div className="cards p-6 rounded-xl flex justify-between items-center mb-5 gap-4">
          <h2 className="text-white text-md font-medium">
            Nível de alertas
          </h2>

          <p className="text-white text-base font-semibold">
            {formatador.format(
              severidades.total + totalIncidentes
            )}{" "}
            alertas totais
          </p>
        </div>

        {/* 🔹 Gauge + Severidade */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">
          {/* Gauge */}
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

          {/* Severidade */}
          <div className="md:col-span-4 h-full">
            <SeveridadeCard
              dados={severidades}
              periodo={periodo}
              loading={loadingSeveridade}
            />
          </div>
        </div>
      </section>

      {/* 🔹 Cards inferiores */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-5 items-stretch">
        <TopAgentsCard
          dias={diasAgentes || dias}
          periodo={periodo}
          onChangeFiltro={setDiasAgentes}
        />

        <TopAgentsCisCard
          dias={diasCis || dias}
          periodo={periodo}
          onChangeFiltro={setDiasCis}
        />


        <div className="flex flex-col h-full">
          <FirewallDonutCard
            dias={diasFirewall || dias}
            periodo={periodo}
            onChangeFiltro={setDiasFirewall}
          />

          <div className="flex-1">
            <div className="cards rounded-xl p-6 shadow-md h-full">
              <FluxoIncidentes
                token={token || ""}
                diasGlobal={dias}
                periodo={periodo}
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
