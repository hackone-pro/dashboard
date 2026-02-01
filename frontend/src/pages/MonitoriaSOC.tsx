import { useRef, useEffect, useState } from "react";
import { useTenant } from "../context/TenantContext";
import LayoutModel from "../componentes/LayoutModel";
import GraficoVolume from "../componentes/graficos/GraficoVolume";

// Cards
import FirewallCard, { FirewallCardRef } from "../componentes/wazuh/Monitoria/FirewallCard";
import ServidoresCard, { ServidoresCardRef } from "../componentes/wazuh/Monitoria/ServidoresCard";
import EdrCard, { EdrCardRef } from "../componentes/wazuh/Monitoria/EdrCard";

// Services
import { getStorageState, getStorageInternal } from "../services/storage/storage.service";
import { getStorageTimeline, StorageTimelineResponse } from "../services/storage/timeline.service";
import { getToken } from "../utils/auth";

export default function MonitoriaSOC() {
  const { tenantAtivo } = useTenant();

  const firewallRef = useRef<FirewallCardRef>(null);
  const servidoresRef = useRef<ServidoresCardRef>(null);
  const edrRef = useRef<EdrCardRef>(null);

  const [storage, setStorage] = useState<any>(null);
  const [loadingStorage, setLoadingStorage] = useState(true);

  const [internal, setInternal] = useState<any>(null);
  const [loadingInternal, setLoadingInternal] = useState(true);

  const [timeline, setTimeline] = useState<StorageTimelineResponse | null>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(true);

  /* ============================
     LOADERS
  ============================ */

  const carregarStorage = async () => {
    try {
      setLoadingStorage(true);
      const token = getToken() ?? undefined;
      const dados = await getStorageState(token);
      setStorage(dados);
    } catch (err) {
      console.error("Erro ao carregar storage:", err);
    } finally {
      setLoadingStorage(false);
    }
  };

  const carregarInternal = async () => {
    try {
      setLoadingInternal(true);
      const token = getToken() ?? undefined;
      const dados = await getStorageInternal(token);
      setInternal(dados);
    } catch (err) {
      console.error("Erro ao carregar storage internal:", err);
    } finally {
      setLoadingInternal(false);
    }
  };

  const carregarTimeline = async () => {
    try {
      setLoadingTimeline(true);
      const dados = await getStorageTimeline();
      setTimeline(dados);
    } catch (err) {
      console.error("Erro ao carregar storage timeline:", err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    carregarStorage();
    carregarInternal();
    carregarTimeline();
    firewallRef.current?.carregar();
    servidoresRef.current?.carregar();
  }, [tenantAtivo]);

  /* ============================
     GRÁFICO — ÚLTIMOS 30 DIAS
  ============================ */

  const TOTAL_GB = storage?.totalCapacity ?? timeline?.totalCapacity ?? 1024;

  const totalUsado =
    storage?.used ??
    timeline?.totalUsed ??
    0;

  const totalDisponivel = Math.max(TOTAL_GB - totalUsado, 0);


  let categoriasX: string[] = [];
  let dadosUtilizados: number[] = [];
  let dadosTotais: number[] = [];
  let yMaxVisual = 1024;

  if (timeline?.series?.length) {
    const ultimos30 = [...timeline.series]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);

    categoriasX = ultimos30.map(item =>
      item.date.split("-").reverse().join("/")
    );

    dadosUtilizados = ultimos30.map(item =>
      Number((item.used ?? 0).toFixed(4))
    );

    dadosTotais = ultimos30.map(() => TOTAL_GB);

    const maxUsado = Math.max(...dadosUtilizados, 0);
    yMaxVisual = Math.max(Math.ceil(maxUsado * 1.2), 1);
  }

  /* ============================
     DESCARTES — AJUSTADO
  ============================ */

  let descartesLista: any[] = [];

  // 🔑 AGORA deleted É ARRAY DIRETO
  if (Array.isArray(internal?.deleted)) {
    descartesLista = internal.deleted;
  }

  function normalizarData(d: string) {
    if (!d || !d.includes("/")) return d;
    const [dia, mes, ano] = d.split("/");
    return `${ano}-${mes}-${dia}`;
  }

  descartesLista = descartesLista
    .filter(item => item?.data && item.data !== "desconhecida")
    .sort((a, b) => {
      const d1 = new Date(normalizarData(a.data)).getTime();
      const d2 = new Date(normalizarData(b.data)).getTime();
      return d2 - d1;
    })
    .slice(0, 3);

  const descartesFinal = [
    descartesLista[0] ?? { volume: 0, data: "--" },
    descartesLista[1] ?? { volume: 0, data: "--" },
    descartesLista[2] ?? { volume: 0, data: "--" },
  ];

  /* ============================
     RENDER
  ============================ */

  return (
    <LayoutModel titulo="Monitoria NG-SOC">
      <section className="grid grid-cols-1 gap-6">

        <div className="cards rounded-2xl flex flex-col">
          <header className="p-6 pb-2">
            <h2 className="text-white text-lg">Volume de dados coletados</h2>

            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <span className="fundo-dashboard text-gray-400 px-3 py-2 rounded-md text-xs">
                Total: <span className="font-bold">{TOTAL_GB} GB</span>
              </span>

              <span className="text-[#6366F1] badge-darkpink px-3 py-2 rounded-md text-xs">
                Usado: <span className="font-bold">{totalUsado.toFixed(2)} GB</span>
              </span>

              <span className="text-pink-500 badge-pink px-3 py-2 rounded-md text-xs">
                Disponível: <span className="font-bold">{totalDisponivel.toFixed(2)} GB</span>
              </span>
            </div>
          </header>

          <div
            className="mt-4 mx-6 rounded-xl p-6"
            style={{
              backgroundImage: "url('/assets/img/bg-grafico.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              minHeight: "300px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {loadingTimeline ? (
              <div className="text-gray-400 text-xs">Carregando dados...</div>
            ) : (
              <GraficoVolume
                series={[
                  { name: "Volume utilizado", data: dadosUtilizados },
                ]}
                categoriasX={categoriasX}
                height={320}
                yMax={yMaxVisual}
              />
            )}
          </div>

          <div className="p-6 pt-4">
            <h3 className="text-gray-400 text-sm mb-3">Últimos Descartes</h3>

            {loadingInternal ? (
              <p className="text-gray-500 text-xs">Carregando descartes...</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {descartesFinal.map((item, idx) => (
                  <div
                    key={idx}
                    className="fundo-dashboard p-3 rounded-lg border border-white/10 text-xs text-gray-400"
                  >
                    <div className="flex justify-between">
                      <p>
                        <span className="font-bold">Descarte {idx + 1}:</span>{" "}
                        {item.data}
                      </p>
                      <p>
                        <span className="font-bold">Volume:</span>{" "}
                        {item.volume.toFixed(2)} GB
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FirewallCard ref={firewallRef} />
          <ServidoresCard ref={servidoresRef} />
          <EdrCard ref={edrRef} />
        </div>

      </section>
    </LayoutModel>
  );
}
