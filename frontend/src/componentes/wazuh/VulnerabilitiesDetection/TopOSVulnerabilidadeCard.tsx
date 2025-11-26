// src/components/wazuh/TopOSVulnerabilidadeCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { getTopOSVulnerabilidades, TopOSVulnerabilidade } from "../../../services/wazuh/topsovulnerabilidades.service";
import { useTenant } from "../../../context/TenantContext";
import { GripVertical } from "lucide-react";

export type TopOSVulnerabilidadeCardRef = {
  carregar: () => void;
};

const formatPt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);

interface Props {
  isWidget?: boolean;
}

const TopOSVulnerabilidadeCard = forwardRef<TopOSVulnerabilidadeCardRef, Props>(
  ({ isWidget = false }, ref) => {

    const { tenantAtivo } = useTenant();
    const [topSo, setTopSo] = useState<TopOSVulnerabilidade[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const carregar = async () => {
      if (!tenantAtivo) return;
      setCarregando(true);

      try {
        const lista = await getTopOSVulnerabilidades(5, "todos");
        setTopSo(lista);
        setErro(null);
      } catch (e: any) {
        setErro(e?.message || "Falha ao carregar Top OS");
      } finally {
        setCarregando(false);
      }
    };

    useEffect(() => {
      carregar();
    }, [tenantAtivo]);

    useImperativeHandle(ref, () => ({ carregar }));

    // =========================================================
    //  LOADING
    // =========================================================
    if (carregando) {
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

              <h3 className="text-sm font-medium text-white">Top 5 (OS)</h3>
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
    //  ERRO
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
    //  SEM DADOS
    // =========================================================
    if (!topSo.length) {
      return (
        <div
          className={`rounded-xl shadow-md flex flex-col justify-center items-center relative h-full cards
            ${isWidget ? "p-6" : "p-4"}
          `}
        >
          <span className="text-xs text-gray-400">Sem vulnerabilidades de OS</span>
        </div>
      );
    }

    // =========================================================
    //  NORMAL
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

            <h3 className="text-sm font-medium text-white">Top 5 (OS)</h3>
          </div>

          <span className={`text-xs text-gray-400 ${isWidget ? "pr-4" : ""}`}>
            Total
          </span>
        </div>

        <ul className="space-y-2 py-3">
          {topSo.slice(0, 5).map((os) => (
            <li
              key={os.os}
              className="
                flex justify-between items-center text-sm text-gray-300
                border-b border-white/5 pb-1
              "
            >
              <span className="truncate font-medium text-gray-400">{os.os}</span>
              <span className="font-medium text-gray-400">{formatPt(os.total)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
);

export default TopOSVulnerabilidadeCard;
