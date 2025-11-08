// src/components/wazuh/FirewallDonutCard.tsx
import { useEffect, useMemo, useState } from "react";
import { getTopFirewalls, TopFirewallItem } from "../../../services/wazuh/topfirewall.service";
import GraficoDonut from "../../graficos/GraficoDonut";
import { useTenant } from "../../../context/TenantContext";

interface FirewallDonutCardProps {
  dias: string;
  onChangeFiltro?: (valor: string | null) => void;
}

export default function FirewallDonutCard({ dias, onChangeFiltro }: FirewallDonutCardProps) {
  const { tenantAtivo } = useTenant();
  const [filtroLocal, setFiltroLocal] = useState<string | null>(null);
  const diasEfetivo = filtroLocal || dias;

  const [dados, setDados] = useState<TopFirewallItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [idxSelecionado, setIdxSelecionado] = useState<number | null>(null);
  const [animReady, setAnimReady] = useState(false);

  useEffect(() => {
    if (!tenantAtivo) return;

    let ativo = true;
    async function fetch() {
      try {
        setCarregando(true);
        setErro(null);
        setAnimReady(false);

        const inicio = Date.now();
        const res = await getTopFirewalls(diasEfetivo);
        if (!ativo) return;

        const elapsed = Date.now() - inicio;
        const delay = Math.max(500 - elapsed, 0);

        setTimeout(() => {
          if (ativo) {
            setDados(res);
            setAnimReady(true);
          }
        }, delay);
      } catch (e: any) {
        if (!ativo) return;
        setErro(e?.message ?? "Erro ao carregar dados de firewall");
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    fetch();
    return () => {
      ativo = false;
    };
  }, [diasEfetivo, tenantAtivo]);

  const { baixo, medio, alto, critico, total } = useMemo(() => {
    const agg = { baixo: 0, medio: 0, alto: 0, critico: 0, total: 0 };
    for (const it of dados) {
      agg.baixo += it.severidade.baixo || 0;
      agg.medio += it.severidade.medio || 0;
      agg.alto += it.severidade.alto || 0;
      agg.critico += it.severidade.critico || 0;
      agg.total += it.total || 0;
    }
    return agg;
  }, [dados]);

  const labels = ["Crítico", "Alto", "Médio", "Baixo"];
  const series = [critico, alto, medio, baixo];
  const cores = ["#F914AD", "#A855F7", "#6366F1", "#1DD69A"];

  // 🦴 Skeleton animado — mesmo padrão visual dos outros cards
  if (carregando) {
    return (
      <div className="cards rounded-xl p-6 shadow-md h-full flex flex-col justify-between relative overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 w-36 bg-[#ffffff12] rounded animate-pulse" />
          <div className="h-6 w-24 bg-[#ffffff12] rounded animate-pulse" />
        </div>

        <div className="flex justify-center items-center my-6">
          <div className="w-40 h-40 rounded-full border-4 border-[#ffffff12] animate-pulse" />
        </div>

        <div className="flex gap-3 flex-wrap mt-4 text-[10px] justify-center">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-3 h-3 bg-[#ffffff12] rounded animate-pulse" />
              <div className="h-3 w-10 bg-[#ffffff12] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="cards rounded-xl p-6 shadow-md h-full flex flex-col justify-between relative overflow-hidden">
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2 mb-3">
          {erro}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 relative">
      <div className="cards rounded-xl p-6 shadow-md h-full flex flex-col justify-between relative overflow-hidden transition-all">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm text-white">Alertas de Firewall</h3>
          <select
            className="bg-[#0d0c22] text-white text-xs px-2 py-1 rounded-sm border border-[#cacaca31]"
            value={filtroLocal || dias}
            onChange={(e) => {
              const val = e.target.value;
              const novoValor = val === dias ? null : val;
              setFiltroLocal(novoValor);
              onChangeFiltro?.(novoValor);
            }}
          >
            <option value="1">24 horas</option>
            <option value="2">48 horas</option>
            <option value="7">7 dias</option>
            <option value="15">15 dias</option>
            <option value="30">30 dias</option>
            <option value="todos">Todos</option>
          </select>
        </div>

        {erro && (
          <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2 mb-3">
            {erro}
          </div>
        )}

        <div
          className="transition-opacity duration-500"
          style={{ opacity: animReady ? 1 : 0 }}
        >
          {total === 0 ? (
            <div className="text-xs text-gray-400">Nenhum dado para exibir.</div>
          ) : (
            <GraficoDonut
              labels={labels}
              series={series}
              cores={cores}
              height={220}
              descricaoTotal="Alertas de Firewall"
              idxSelecionado={idxSelecionado}
              onSelecionarIdx={setIdxSelecionado}
            />
          )}
        </div>

        <div className="flex gap-3 flex-wrap mt-4 text-[10px] text-gray-400 text-xs justify-center">
          {labels.map((lb, i) => {
            const ativo = idxSelecionado === i;
            return (
              <div
                key={i}
                className={`flex items-center gap-1 cursor-pointer transition-all ${
                  ativo ? "font-semibold text-white scale-105" : "hover:text-white/80"
                }`}
                onClick={() => setIdxSelecionado(ativo ? null : i)}
              >
                <span
                  className="w-3 h-3 rounded-xs"
                  style={{
                    background: cores[i],
                    boxShadow: ativo ? `0 0 8px ${cores[i]}` : "none",
                  }}
                />
                {lb}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
