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

  /* ============================
     FILTROS GLOBAIS
  ============================ */
  const [dias, setDias] = useState<string>("1"); // 24h
  const [diasFirewall, setDiasFirewall] = useState<string | null>(null);
  const [diasAgentes, setDiasAgentes] = useState<string | null>(null);
  const [diasSeveridade, setDiasSeveridade] = useState<string | null>(null);
  const [diasCis, setDiasCis] = useState<string | null>(null);
  const [diasIris, setDiasIris] = useState<string | null>(null);

  /* ============================
     PERÍODO CUSTOMIZADO
  ============================ */
  const [periodo, setPeriodo] = useState<{
    from: string;
    to: string;
  } | null>(null);

  // 🔒 trava selects quando relatório está ativo
  const filtrosTravados = !!periodo;

  /* ============================
     RESET CALENDÁRIO
  ============================ */
  const [resetFiltroKey, setResetFiltroKey] = useState<number>(0);

  /* ============================
     DADOS
  ============================ */
  const [loadingSeveridade, setLoadingSeveridade] = useState<boolean>(true);

  const [severidades, setSeveridades] = useState<Severidades>({
    baixo: 0,
    medio: 0,
    alto: 0,
    critico: 0,
    total: 0,
  });

  const [indiceRisco, setIndiceRisco] = useState<number>(0);
  const [totalIncidentes, setTotalIncidentes] = useState<number>(0);

  /* ============================
     FETCH GLOBAL
  ============================ */
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
      {/* ================= FILTROS ================= */}
      <div className="flex justify-end mt-5 mb-3 px-6">
        <DateRangePicker
          resetKey={resetFiltroKey}
          onApply={(payload) => {
            setPeriodo(payload);
          }}
        />

        <button
          onClick={() => {
            setPeriodo(null);

            // 🔁 volta tudo pra 24h
            setDias("1");
            setDiasFirewall(null);
            setDiasAgentes(null);
            setDiasSeveridade(null);
            setDiasCis(null);
            setDiasIris(null);

            setResetFiltroKey((v) => v + 1);
          }}
          className="flex items-center gap-1 text-[14px] text-purple-400 hover:text-purple-200 transition-colors ml-3"
        >
          {/* @ts-ignore */}
          <FiRotateCcw className="w-4 h-4" />
          Limpar filtros
        </button>
      </div>

      {/* ================= HEADER ================= */}
      <section>
        <div className="cards p-6 rounded-xl flex justify-between items-center mb-5 gap-4">
          <h2 className="text-white text-md font-medium">
            Nível de alertas
          </h2>

          <p className="text-white text-base font-semibold">
            {formatador.format(severidades.total)} alertas totais
          </p>
        </div>

        {/* ================= GAUGE + SEVERIDADE ================= */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">
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
          </div>

          <div className="md:col-span-4 h-full">
            <SeveridadeCard
              dados={severidades}
              periodo={periodo}
              loading={loadingSeveridade}
            />
          </div>
        </div>
      </section>

      {/* ================= CARDS ================= */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-5 items-stretch">
        <TopAgentsCard
          dias={diasAgentes || dias}
          periodo={periodo}
          onChangeFiltro={setDiasAgentes}
          disabled={filtrosTravados}
        />

        <TopAgentsCisCard
          dias={diasCis || dias}
          periodo={periodo}
          onChangeFiltro={setDiasCis}
          disabled={filtrosTravados}
        />

        <div className="flex flex-col h-full">
          <FirewallDonutCard
            dias={diasFirewall || dias}
            periodo={periodo}
            onChangeFiltro={setDiasFirewall}
            disabled={filtrosTravados}
          />

          <div className="flex-1">
            <div className="cards rounded-xl p-6 shadow-md h-full">
              <FluxoIncidentes
                token={token || ""}
                diasGlobal={dias}
                periodo={periodo}
                onChangeFiltro={setDiasIris}
                onUpdateTotais={setTotalIncidentes}
                disabled={filtrosTravados}
              />
            </div>
          </div>
        </div>
      </section>
    </LayoutModel>
  );
}
