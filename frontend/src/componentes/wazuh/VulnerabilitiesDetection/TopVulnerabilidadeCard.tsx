// src/components/wazuh/TopVulnerabilidadeCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { getTopVulnerabilidades, TopVulnerabilidade } from "../../../services/wazuh/topseveridades.service";
import { useTenant } from "../../../context/TenantContext";
import { GripVertical } from "lucide-react";

export type TopVulnerabilidadeCardRef = {
  carregar: () => void;
};

const formatPt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);

interface Props {
  isWidget?: boolean;
}

const TopVulnerabilidadeCard = forwardRef<TopVulnerabilidadeCardRef, Props>(
  ({ isWidget = false }, ref) => {

    const { tenantAtivo } = useTenant();
    const [topVulns, setTopVulns] = useState<TopVulnerabilidade[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const carregar = async () => {
      if (!tenantAtivo) return;

      setCarregando(true);
      try {
        const lista = await getTopVulnerabilidades("cve", 5, "todos");
        setTopVulns(lista);
        setErro(null);
      } catch (e: any) {
        setErro(e?.message || "Falha ao carregar Top vulnerabilidades");
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
          className={`rounded-xl shadow-md flex flex-col justify-start relative h-full bg-[#1D1929]
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

              <h3 className="text-sm font-medium text-white">Top 5 Vulnerabilidades</h3>
            </div>

            <span className={`text-xs text-gray-400 ${isWidget ? "pr-4" : ""}`}>
              Total
            </span>
          </div>

          <ul className="space-y-2 py-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex justify-between items-center">
                <span className="h-4 w-32 rounded bg-white/10 animate-pulse" />
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
          className={`rounded-xl shadow-md flex flex-col justify-center items-center relative h-full bg-[#1D1929]
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
    if (!topVulns.length) {
      return (
        <div
          className={`rounded-xl shadow-md flex flex-col justify-center items-center relative h-full bg-[#1D1929]
            ${isWidget ? "p-6" : "p-4"}
          `}
        >
          <span className="text-xs text-gray-400">Sem vulnerabilidades</span>
        </div>
      );
    }

    // =========================================================
    //  NORMAL
    // =========================================================
    return (
      <div
        className={`rounded-xl shadow-md flex flex-col justify-start relative h-full bg-[#1D1929]
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
              Top 5 Vulnerabilidades
            </h3>

          </div>

          <span className={`text-xs text-gray-400 ${isWidget ? "pr-4" : ""}`}>
            Total
          </span>
        </div>

        {/* LISTA */}
        <ul className="space-y-2 py-3">
          {topVulns.map((item, idx) => (
            <li
              key={idx}
              className="
                flex justify-between items-center text-sm text-gray-300
                border-b border-white/5 pb-1
              "
            >
              <span className="truncate font-medium text-gray-400">{item.key}</span>
              <span className="font-medium text-gray-400">{formatPt(item.total)}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
);

export default TopVulnerabilidadeCard;
