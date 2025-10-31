// src/components/wazuh/TopAgentsCisCard.tsx
import { useEffect, useMemo, useState } from "react";
import { getTopAgentsCis, TopAgentCisItem } from "../../../services/wazuh/topagentscis";
import { useTenant } from "../../../context/TenantContext";

interface TopAgentsCisCardProps {
  dias: string;
  onChangeFiltro?: (valor: string | null) => void;
}

export default function TopAgentsCisCard({ dias, onChangeFiltro }: TopAgentsCisCardProps) {
  const { tenantAtivo } = useTenant();
  const [filtroLocal, setFiltroLocal] = useState<string | null>(null);
  const diasEfetivo = filtroLocal || dias;

  const [itens, setItens] = useState<TopAgentCisItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [animReady, setAnimReady] = useState(false);

  useEffect(() => {
    if (!tenantAtivo) return;

    let ativo = true;
    async function fetchData() {
      try {
        setCarregando(true);
        setErro(null);
        setAnimReady(false);

        const inicio = Date.now();
        const data = await getTopAgentsCis(diasEfetivo);
        if (!ativo) return;

        const elapsed = Date.now() - inicio;
        const delay = Math.max(500 - elapsed, 0);

        setTimeout(() => {
          if (ativo) {
            setItens(data);
            setAnimReady(true);
          }
        }, delay);
      } catch (e: any) {
        if (!ativo) return;
        setErro(e?.message ?? "Erro ao carregar Top Agentes CIS");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    fetchData();
    return () => {
      ativo = false;
    };
  }, [diasEfetivo, tenantAtivo]);

  const lista = useMemo(
    () => [...itens].sort((a, b) => b.score_cis_percent - a.score_cis_percent),
    [itens]
  );

  const getClassesPorScore = (p: number) => {
    if (p < 30) {
      return { bar: "bg-[#1DD69A1A]", text: "text-[#1DD69A]", border: "border-[#1DD69A33]" };
    }
    if (p < 40) {
      return { bar: "bg-[#6F58E61A]", text: "text-[#6366F1]", border: "border-[#6F58E633]" };
    }
    if (p <= 75) {
      return { bar: "bg-[#6700FF1A]", text: "text-[#A855F7]", border: "border-[#6700FF33]" };
    }
    return { bar: "bg-[#FB35B91A]", text: "text-[#F914AD]", border: "border-[#FB35B933]" };
  };

  // 🦴 Skeleton loading padronizado
  if (carregando) {
    return (
      <div className="cards rounded-xl p-6 shadow-md h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 w-48 bg-[#ffffff12] rounded animate-pulse" />
          <div className="h-6 w-24 bg-[#ffffff12] rounded animate-pulse" />
        </div>

        <div className="flex gap-4 text-[10px] text-xs mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-3 h-3 bg-[#ffffff12] rounded animate-pulse" />
              <div className="h-3 w-10 bg-[#ffffff12] rounded animate-pulse" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-full h-8 rounded-md border border-[#ffffff1a] bg-[#ffffff08] animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="cards rounded-xl p-6 shadow-md h-full flex flex-col">
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2">
          {erro}
        </div>
      </div>
    );
  }

  return (
    <div className="cards rounded-xl p-6 shadow-md h-full flex flex-col relative overflow-hidden">
      {/* Header com seletor interno */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold text-sm">Auditoria CIS - Top Servidores</h3>
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

      {/* Legenda */}
      <div className="flex gap-4 text-[10px] text-xs text-gray-400 mb-6">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-xs bg-[#1DD69A]" />Baixo
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-xs bg-[#6366F1]" />Médio
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-xs bg-[#A855F7]" />Alto
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-xs bg-[#F914AD]" />Crítico
        </div>
      </div>

      {erro && (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2 mb-3">
          {erro}
        </div>
      )}

      {/* Conteúdo principal */}
      <div
        className="flex flex-col gap-3 transition-opacity duration-500"
        style={{ opacity: animReady ? 1 : 0 }}
      >
        {lista.length === 0 ? (
          <span className="text-xs text-gray-400 text-center py-4">
            Sem dados para o período selecionado.
          </span>
        ) : (
          lista.map((item, i) => {
            const p = Math.max(0, Math.min(100, Math.round(item.score_cis_percent)));
            const { bar, text, border } = getClassesPorScore(p);

            return (
              <div
                key={`${item.agent_name}-${i}`}
                className={`w-full h-8 rounded-md border ${border} relative overflow-hidden`}
              >
                <div
                  className={`h-full ${bar}`}
                  style={{
                    width: animReady ? `${p}%` : "0%",
                    transition: "width 600ms ease",
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-sm text-white">
                  <span className="text-gray-400 truncate pr-2">{item.agent_name}</span>
                  <span className={`${text}`}>{p}%</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
