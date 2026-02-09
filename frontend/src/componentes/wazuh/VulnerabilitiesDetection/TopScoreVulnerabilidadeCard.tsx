// src/components/wazuh/TopScoreVulnerabilidadeCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import {
  getTopScoresVulnerabilidades,
  TopScoreItem,
} from "../../../services/wazuh/vulntopscores.service";
import GraficoBarHorizontal from "../../../componentes/graficos/GraficoBarraHorizontal";
import { useTenant } from "../../../context/TenantContext";
import { GripVertical } from "lucide-react";

export type TopScoreVulnerabilidadeCardRef = {
  carregar: () => void;
};

interface Props {
  isWidget?: boolean;
  agent?: string | null;
}

const TopScoreVulnerabilidadeCard = forwardRef<TopScoreVulnerabilidadeCardRef, Props>(
  ({ isWidget = false, agent }, ref) => {
    const { tenantAtivo } = useTenant();
    const [topScores, setTopScores] = useState<TopScoreItem[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const carregar = async () => {
      if (!tenantAtivo) return;

      setCarregando(true);
      try {
        const lista = await getTopScoresVulnerabilidades(
          5,
          "todos",
          agent ?? undefined
        );
        setTopScores(lista);
        setErro(null);
      } catch (e: any) {
        setErro(e?.message || "Falha ao carregar distribuição CVSS");
      } finally {
        setCarregando(false);
      }
    };

    useEffect(() => {
      carregar();
    }, [tenantAtivo, agent]);

    useImperativeHandle(ref, () => ({ carregar }));

    // ======================================================
    // LOADING
    // ======================================================
    if (carregando) {
      return (
        <div
          className={`rounded-xl shadow-md flex flex-col justify-start relative h-full cards
            ${isWidget ? "p-6" : "p-4"}
          `}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="h-4 w-52 bg-[#ffffff14] rounded animate-pulse" />
          </div>

          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 w-12 bg-[#ffffff14] rounded animate-pulse" />
                <div className="flex-1 h-3 bg-[#ffffff14] rounded animate-pulse" />
                <div className="h-3 w-10 bg-[#ffffff14] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // ======================================================
    // ERRO
    // ======================================================
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

    // ======================================================
    // SEM DADOS
    // ======================================================
    if (!topScores.length) {
      return (
        <div
          className={`rounded-xl shadow-md flex flex-col justify-center items-center relative h-full cards
            ${isWidget ? "p-6" : "p-4"}
          `}
        >
          <span className="text-xs text-gray-400">Sem dados de vulnerabilidades</span>
        </div>
      );
    }

    // ======================================================
    // CONTEÚDO NORMAL
    // ======================================================
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

            <h3 className="text-sm font-medium text-white">
              Pontuações de vulnerabilidade mais comuns
            </h3>
          </div>
        </div>

        <GraficoBarHorizontal
          categorias={topScores.map((s) => s.score)}
          valores={topScores.map((s) => s.total)}
          cor="#632BD3"
          tituloY="Pontuação base de vulnerabilidade"
        />
      </div>
    );
  }
);

export default TopScoreVulnerabilidadeCard;