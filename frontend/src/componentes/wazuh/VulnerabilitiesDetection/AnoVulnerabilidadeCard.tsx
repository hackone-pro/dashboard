// src/components/wazuh/AnoVulnerabilidadeCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import {
  getAnoVulnerabilidades,
  AnoVulnerabilidade,
} from "../../../services/wazuh/anovulnerabilidades.service";
import GraficoStackedBarChart from "../../graficos/GraficoStackedBarChart";
import { useTenant } from "../../../context/TenantContext";
import { GripVertical } from "lucide-react";

export type AnoVulnerabilidadeCardRef = {
  carregar: () => void;
};

interface Props {
  isWidget?: boolean;
}

const AnoVulnerabilidadeCard = forwardRef<AnoVulnerabilidadeCardRef, Props>(
  ({ isWidget = false }, ref) => {
    const { tenantAtivo } = useTenant();

    const [anoVulns, setAnoVulns] = useState<AnoVulnerabilidade[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const carregar = async () => {
      if (!tenantAtivo) return;

      setCarregando(true);
      try {
        const lista = await getAnoVulnerabilidades("todos");
        setAnoVulns(lista);
        setErro(null);
      } catch (e: any) {
        setErro(e?.message || "Falha ao carregar vulnerabilidades por ano");
      } finally {
        setCarregando(false);
      }
    };

    useEffect(() => {
      carregar();
    }, [tenantAtivo]);

    useImperativeHandle(ref, () => ({ carregar }));

    // ======================================================
    // SKELETON
    // ======================================================
    if (carregando) {
      return (
        <div
          className={`rounded-xl shadow-md flex flex-col justify-start h-full cards
            ${isWidget ? "p-6" : "p-4"}
          `}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="h-4 w-48 bg-[#ffffff14] rounded animate-pulse" />
          </div>

          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 w-16 bg-[#ffffff14] rounded animate-pulse" />
                <div className="flex-1 h-3 bg-[#ffffff14] rounded animate-pulse" />
                <div className="h-3 w-8 bg-[#ffffff14] rounded animate-pulse" />
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
          className={`rounded-xl shadow-md flex flex-col justify-center items-center h-full cards
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
    if (!anoVulns.length) {
      return (
        <div
          className={`rounded-xl shadow-md flex flex-col justify-center items-center h-full cards
            ${isWidget ? "p-6" : "p-4"}
          `}
        >
          <span className="text-xs text-gray-400">
            Sem dados de vulnerabilidades por ano
          </span>
        </div>
      );
    }

    // ======================================================
    // CONTEÚDO NORMAL
    // ======================================================
    return (
      <div
        className={`rounded-xl shadow-md flex flex-col justify-start h-full cards
          ${isWidget ? "p-6" : "p-4"}
        `}
      >
        {/* HEADER — com drag apenas na dashboard */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            {isWidget && (
              <GripVertical
                size={18}
                className="drag-handle cursor-grab active:cursor-grabbing
                           text-white/50 hover:text-white transition"
              />
            )}

            <h3 className="text-sm font-medium text-white">
              Vulnerabilidades por Ano
            </h3>
          </div>
        </div>

        <GraficoStackedBarChart
          categorias={anoVulns.map((a) => a.ano)}
          series={[
            {
              name: "Baixo",
              data: anoVulns.map((a) => a.severity.Low || 0),
            },
            {
              name: "Médio",
              data: anoVulns.map((a) => a.severity.Medium || 0),
            },
            {
              name: "Alto",
              data: anoVulns.map((a) => a.severity.High || 0),
            },
            {
              name: "Crítico",
              data: anoVulns.map((a) => a.severity.Critical || 0),
            },
          ]}
        />
      </div>
    );
  }
);

export default AnoVulnerabilidadeCard;
