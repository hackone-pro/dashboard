// src/components/wazuh/TopAgenteVulnerabilidadeCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { getTopAgentesVulnerabilidades, TopAgenteVulnerabilidade } from "../../../services/wazuh/agentesvulnerabilidades.service";
import { useTenant } from "../../../context/TenantContext";
import { GripVertical } from "lucide-react";

export type TopAgenteVulnerabilidadeCardRef = {
  carregar: () => void;
};

const formatPt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);

interface Props {
  isWidget?: boolean;
}

const TopAgenteVulnerabilidadeCard = forwardRef<TopAgenteVulnerabilidadeCardRef, Props>(
  ({ isWidget = false }, ref) => {

    const { tenantAtivo } = useTenant();
    const [topAgents, setTopAgents] = useState<TopAgenteVulnerabilidade[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const carregar = async () => {
      if (!tenantAtivo) return;
      setCarregando(true);

      try {
        const lista = await getTopAgentesVulnerabilidades(5, "todos");
        setTopAgents(lista);
        setErro(null);
      } catch (e: any) {
        setErro(e?.message || "Falha ao carregar Top Agentes");
      } finally {
        setCarregando(false);
      }
    };

    useEffect(() => {
      carregar();
    }, [tenantAtivo]);

    useImperativeHandle(ref, () => ({ carregar }));

    // =========================================================
    // LOADING
    // =========================================================
    if (carregando) {
      return (
        <div
          className={`rounded-xl shadow-md flex flex-col justify-start relative h-full cards
            ${isWidget ? "p-6" : "p-4"}
          `}
        >

          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">

              {isWidget && (
                <GripVertical
                  size={18}
                  className="drag-handle cursor-grab active:cursor-grabbing 
                            text-white/50 hover:text-white transition 
                            relative z-20"
                />
              )}

              <h3 className="text-sm font-medium text-white">Top 5 Agentes</h3>
            </div>

            <span className={`text-xs text-gray-400 ${isWidget ? "pr-4" : ""}`}>
              Total
            </span>
          </div>

          <ul className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex justify-between items-center">
                <span className="h-4 w-40 rounded bg-white/10 animate-pulse" />
                <span className="h-4 w-8 rounded bg-white/10 animate-pulse" />
              </li>
            ))}
          </ul>

        </div>
      );
    }

    // =========================================================
    // ERRO
    // =========================================================
    if (erro) {
      return (
        <div
          className={`rounded-xl shadow-md flex flex-col justify-center items-center relative h-full cards
            ${isWidget ? "p-6" : "p-4"}
          `}
        >
          <span className="text-xs text-red-400">{erro}</span>
        </div>
      );
    }

    // =========================================================
    // SEM DADOS
    // =========================================================
    if (!topAgents.length) {
      return (
        <div
          className={`rounded-xl shadow-md flex flex-col justify-center items-center relative h-full cards
            ${isWidget ? "p-6" : "p-4"}
          `}
        >
          <span className="text-xs text-gray-400">Sem vulnerabilidades em agentes</span>
        </div>
      );
    }

    // =========================================================
    // NORMAL
    // =========================================================
    return (
      <div
        className={`rounded-xl shadow-md flex flex-col justify-start relative h-full cards
          ${isWidget ? "p-6" : "p-4"}
        `}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">

            {isWidget && (
              <GripVertical
                size={18}
                className="drag-handle cursor-grab active:cursor-grabbing 
                           text-white/50 hover:text-white transition 
                           relative z-20"
              />
            )}

            <h3 className="text-sm font-medium text-white">Top 5 Agentes</h3>
          </div>

          <span className={`text-xs text-gray-400 ${isWidget ? "pr-4" : ""}`}>
            Total
          </span>
        </div>

        <ul className="space-y-2 py-3">
          {topAgents.slice(0, 5).map((agent) => (
            <li
              key={agent.agent}
              className="
                flex justify-between items-center text-sm text-gray-300
                border-b border-white/5 pb-1
              "
            >
              <span className="truncate font-medium text-gray-400">{agent.agent}</span>
              <span className="font-medium text-gray-400">{formatPt(agent.total)}</span>
            </li>
          ))}
        </ul>

      </div>
    );
  }
);

export default TopAgenteVulnerabilidadeCard;