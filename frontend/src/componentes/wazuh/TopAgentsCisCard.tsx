// src/componentes/wazuh/TopAgentsCisCard.tsx
import { useEffect, useMemo, useState } from "react";
import { getTopAgentsCis, TopAgentCisItem } from "../../services/wazuh/topagentscis";

type DiasOption = "1" | "7" | "15" | "30" | "todos";

export default function TopAgentsCisCard() {
  const [dias, setDias] = useState<DiasOption>("todos");
  const [itens, setItens] = useState<TopAgentCisItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [animReady, setAnimReady] = useState(false); // para animar o width

  useEffect(() => {
    let ativo = true;
    async function fetchData() {
      try {
        setCarregando(true);
        setErro(null);
        setAnimReady(false); // reseta animação ao mudar o período
        const data = await getTopAgentsCis(dias);
        if (!ativo) return;
        setItens(data);
        // pequena defasagem para permitir transição suave
        setTimeout(() => ativo && setAnimReady(true), 50);
      } catch (e: any) {
        if (!ativo) return;
        setErro(e?.message ?? "Erro ao carregar Top Agentes CIS");
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    fetchData();
    return () => { ativo = false; };
  }, [dias]);

  // Ordena pela menor % (melhor conformidade) → já vem assim do backend, mas garantimos aqui
  const lista = useMemo(
    () => [...itens].sort((a, b) => b.score_cis_percent - a.score_cis_percent),
    [itens]
  );

  // Map de cores/estados conforme o mock:
  // Bom: <30 | Médio: 30–39 | Alto: 40–75 | Crítico: >=76
  const getClassesPorScore = (p: number) => {
    if (p < 30) {
      return {
        bar: "bg-[#1DD69A1A]",
        text: "text-[#1DD69A]",
        border: "border-[#1DD69A33]",
      };
    }
    if (p < 40) {
      return {
        bar: "bg-[#6F58E61A]",
        text: "text-[#6366F1]",
        border: "border-[#6F58E633]",
      };
    }
    if (p <= 75) {
      return {
        bar: "bg-[#6700FF1A]",
        text: "text-[#A855F7]",
        border: "border-[#6700FF33]",
      };
    }
    return {
      bar: "bg-[#FB35B91A]",
      text: "text-[#F914AD]",
      border: "border-[#FB35B933]",
    };
  };

  return (
    <div className="cards rounded-xl p-6 shadow-md h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold text-sm">
            Auditoria CIS - Top Servidores
          </h3>
        </div>

        <select
          className="bg-[#0d0c22] text-white text-xs px-2 py-1 rounded-md border border-[#cacaca31]"
          value={dias}
          onChange={(e) => setDias(e.target.value as DiasOption)}
        >
          <option value="1">24 horas</option>
          <option value="7">7 dias</option>
          <option value="15">15 dias</option>
          <option value="30">30 dias</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {/* Legenda */}
      <div className="flex gap-4 text-xs text-gray-400 mb-6">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#1DD69A]" />Baixo
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#6366F1]" />Médio
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#A855F7]" />Alto
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#F914AD]" />Crítico
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2 mb-3">
          {erro}
        </div>
      )}

      {/* Loading */}
      {carregando ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="w-full h-8 rounded-md bg-[#ffffff0a] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {lista.length === 0 ? (
            <span className="text-xs text-gray-400 text-center py-4">
              Sem dados para o período selecionado.
            </span>
          ) : (
            lista.map((item, i) => {
              const p = Math.max(0, Math.min(100, Math.round(item.score_cis_percent)));
              const widthPercent = p; // como no seu mock
              const { bar, text, border } = getClassesPorScore(p);

              return (
                <div
                  key={`${item.agent_name}-${i}`}
                  className={`w-full h-8 rounded-md border ${border} relative overflow-hidden`}
                >
                  {/* Barra preenchida (animação de width) */}
                  <div
                    className={`h-full ${bar}`}
                    style={{
                      width: animReady ? `${widthPercent}%` : "0%",
                      transition: "width 600ms ease",
                    }}
                  />

                  {/* Overlay: nome + percent */}
                  <div className="absolute inset-0 flex items-center justify-between px-3 text-sm text-white">
                    <span className="text-gray-400 truncate pr-2">{item.agent_name}</span>
                    <span className={`${text}`}>{p}%</span>
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
