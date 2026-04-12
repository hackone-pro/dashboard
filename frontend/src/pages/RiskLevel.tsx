import { useEffect, useState } from "react";
import LayoutModel from "../componentes/LayoutModel";
import GraficoGauge from "../componentes/graficos/GraficoGauge";
import SeveridadeCard from "../componentes/wazuh/RiskLevel/SeveridadeCard";
import TopAgentsCard from "../componentes/wazuh/RiskLevel/TopAgentsCard";
import TopAgentsCisCard from "../componentes/wazuh/RiskLevel/TopAgentsCisCard";
import FirewallDonutCard from "../componentes/wazuh/RiskLevel/FirewallDonutCard";
import FluxoIncidentes from "../componentes/iris/FluxoIncidentes";
import DateRangePicker, { DateRangePayload } from "../componentes/DataRangePicker";

import { getToken } from "../utils/auth";
import {
  RiskLevelResposta,
  Severidades,
} from "../services/wazuh/risklevel.service";
import { useTenant } from "../context/TenantContext";
import { useScreenContext } from "../context/ScreenContext";

import { FiRotateCcw } from "react-icons/fi";

export default function RiskLevel() {
  const token = getToken();
  const { tenantAtivo } = useTenant();
  const { setScreenData } = useScreenContext();
  const formatador = new Intl.NumberFormat("pt-BR");

  /* ============================
     FILTROS GLOBAIS
     
     - dias: janela canônica ("1", "7", "15", "30")
       Usado pelo riskLevel e pelos cards quando não
       há range customizado.
     
     - periodo: range customizado do calendário { from, to }
       Quando preenchido, os cards usam from/to.
       O riskLevel usa o baseline de "1" como fallback.
  ============================ */
  const [dias, setDias] = useState<string>("1");
  const [periodo, setPeriodo] = useState<{ from: string; to: string } | null>(null);

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

  // ─── Screen context para o chat ──────────────────────────────────────────────
  useEffect(() => {
    setScreenData("risk-level", {
      periodo: periodo ? `${periodo.from} a ${periodo.to}` : `${dias}d`,
      indiceRisco,
      totalIncidentes,
      severidades,
    });
  }, [indiceRisco, totalIncidentes, severidades, dias, periodo]);

  /* ============================
     HANDLER DO FILTRO
     
     Períodos rápidos (24h, 7d, 15d, 30d):
       → seta dias, limpa periodo
       → riskLevel usa baseline correto da janela
     
     Range customizado do calendário:
       → seta periodo, mantém dias="1" para o riskLevel
       → cards usam from/to para exibição
  ============================ */
  function handleFiltro(payload: DateRangePayload) {
    if (payload.dias) {
      // Período rápido — janela canônica
      setDias(payload.dias);
      setPeriodo(null);
    } else {
      // Range customizado — cards usam from/to,
      // riskLevel usa baseline de "1" (fallback)
      setPeriodo({ from: payload.from!, to: payload.to! });
      setDias("1");
    }
  }

  /* ============================
     FETCH GLOBAL
  ============================ */
  useEffect(() => {
    if (!tenantAtivo) return;

    async function carregar() {
      try {
        setLoadingSeveridade(true);

        // Monta os query params:
        // - Período rápido → dias=7 (sem from/to)
        // - Range customizado → from/to (riskLevel usa fallback "1" internamente)
        const queryParams = new URLSearchParams(
          periodo
            ? { from: periodo.from, to: periodo.to }
            : { dias }
        ).toString();

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
  }, [tenantAtivo, dias, periodo, token]);

  return (
    <LayoutModel titulo="Risk Level">
      {/* ================= FILTROS ================= */}
      <div className="flex justify-end mt-5 mb-3 px-6">
        <DateRangePicker
          resetKey={resetFiltroKey}
          onApply={handleFiltro}
        />

        <button
          onClick={() => {
            setDias("1");
            setPeriodo(null);
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
              loading={loadingSeveridade}
            />
          </div>
        </div>
      </section>

      {/* ================= CARDS ================= */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-5 items-stretch">
        <TopAgentsCard
          dias={dias}
          periodo={periodo}
        />

        <TopAgentsCisCard
          dias={dias}
          periodo={periodo}
        />

        <div className="flex flex-col h-full">
          <FirewallDonutCard
            dias={dias}
            periodo={periodo}
          />

          <div className="flex-1">
            <div className="cards rounded-xl p-6 shadow-md h-full">
              <FluxoIncidentes
                token={token || ""}
                diasGlobal={dias}
                periodo={periodo}
                onUpdateTotais={setTotalIncidentes}
              />
            </div>
          </div>
        </div>
      </section>
    </LayoutModel>
  );
}