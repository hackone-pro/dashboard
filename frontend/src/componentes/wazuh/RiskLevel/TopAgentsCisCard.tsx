// src/components/wazuh/TopAgentsCisCard.tsx
import { useEffect, useMemo, useState } from "react";
import {
  getTopAgentsCis,
  TopAgentCisItem,
} from "../../../services/wazuh/topagentscis";
import { useTenant } from "../../../context/TenantContext";
import { GripVertical } from "lucide-react";

export interface TopAgentCisSummary {
  nome: string;
  scoreCis: number;
}

interface TopAgentsCisCardProps {
  dias: string;
  periodo?: { from: string; to: string } | null;
  isWidget?: boolean;
  onDadosCarregados?: (agentes: TopAgentCisSummary[]) => void;
}

export default function TopAgentsCisCard({
  dias,
  periodo,
  isWidget = false,
  onDadosCarregados,
}: TopAgentsCisCardProps) {
  const { tenantAtivo } = useTenant();

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

        const data = await getTopAgentsCis(
          periodo ? undefined : dias,
          periodo ?? undefined
        );

        if (!ativo) return;

        const elapsed = Date.now() - inicio;
        const delay = Math.max(500 - elapsed, 0);

        setTimeout(() => {
          if (ativo) {
            setItens(data);
            setAnimReady(true);
            onDadosCarregados?.(
              data.slice(0, 10).map((a) => ({ nome: a.agent_name, scoreCis: a.score_cis_percent }))
            );
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
  }, [dias, periodo, tenantAtivo]);

  const lista = useMemo(
    () =>
      [...itens]
        .sort((a, b) => b.score_cis_percent - a.score_cis_percent)
        .slice(0, 15),
    [itens]
  );

  const getClassesPorScore = (p: number) => {
    if (p < 30)
      return {
        bar: "bg-[#FB35B91A]",
        text: "text-[#F914AD]",
        border: "border-[#FB35B933]",
      };
    if (p < 40)
      return {
        bar: "bg-[#6700FF1A]",
        text: "text-[#A855F7]",
        border: "border-[#6700FF33]",
      };
    if (p <= 75)
      return {
        bar: "bg-[#6F58E61A]",
        text: "text-[#6366F1]",
        border: "border-[#6F58E633]",
      };
    return {
      bar: "bg-[#1DD69A1A]",
      text: "text-[#1DD69A]",
      border: "border-[#1DD69A33]",
    };
  };

  return (
    <div className="cards rounded-xl p-6 shadow-md h-full flex flex-col relative">
      {carregando && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-xl z-10" />
      )}

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4 relative z-20">
        <div className="flex items-center gap-2">
          {isWidget && (
            <GripVertical
              size={18}
              className="drag-handle cursor-grab active:cursor-grabbing text-white/50 hover:text-white transition"
            />
          )}
          <h3 className="text-white font-semibold text-sm">
            Auditoria CIS - Top Servidores
          </h3>
        </div>
      </div>

      {erro && (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2 mb-3 relative z-20">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="flex flex-col gap-3 relative z-20">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="w-full h-8 rounded-md bg-[#ffffff0a] animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3 relative z-20">
          {lista.length === 0 ? (
            <span className="text-xs text-gray-400 text-center py-4">
              Sem dados para o período selecionado.
            </span>
          ) : (
            lista.map((item, i) => {
              const p = Math.max(
                0,
                Math.min(100, Math.round(item.score_cis_percent))
              );
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
                    <span className="text-gray-400 truncate pr-2">
                      {item.agent_name}
                    </span>
                    <span className={text}>{p}%</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}