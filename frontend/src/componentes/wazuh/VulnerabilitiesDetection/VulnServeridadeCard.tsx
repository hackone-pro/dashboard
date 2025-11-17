// src/components/wazuh/VulnSeveridadeCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { getVulnSeveridades, VulnSeveridades } from "../../../services/wazuh/vulnseveridades.service";
import { FaSyncAlt } from "react-icons/fa";
import { useTenant } from "../../../context/TenantContext";
import { GripVertical } from "lucide-react";

export type VulnSeveridadeCardRef = {
  carregar: () => void;
  getTotal: () => number;
};

interface Props {
  onAtualizar?: () => void;
  isWidget?: boolean;
}

const formatPt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);

const VulnSeveridadeCard = forwardRef<VulnSeveridadeCardRef, Props>(
  ({ onAtualizar, isWidget = false }, ref) => {
    const { tenantAtivo } = useTenant();
    const [data, setData] = useState<VulnSeveridades | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    const carregar = async () => {
      if (!tenantAtivo) return;
      setLoading(true);

      try {
        const res = await getVulnSeveridades();
        setData(res);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message || "Falha ao carregar severidades");
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      carregar();
    }, [tenantAtivo]);

    useImperativeHandle(ref, () => ({
      carregar,
      getTotal: () => data?.total ?? 0,
    }));

    return (
      <div
        className={`
          rounded-xl shadow-md flex flex-col
          ${isWidget ? "p-6" : "p-4"} ${isWidget ? "bg-transparent" : "cards"}
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {isWidget && (
              <GripVertical
                size={18}
                className="
                  drag-handle cursor-grab text-white/50
                  hover:text-white active:cursor-grabbing transition
                "
              />
            )}

            <h3 className="text-white text-sm font-semibold">
              Alertas de Vulnerabilidades
            </h3>
          </div>

          <button
            onClick={onAtualizar || carregar}
            className={`
              flex items-center gap-2 text-xs
              border border-[#282239] cards
              hover:bg-gray-700 text-gray-300 px-3 py-1
              rounded-md transition ${isWidget ? "hidden" : ""}
              `}
          >
            {/* @ts-ignore */}
            <FaSyncAlt className="w-3 h-3" />
            Atualizar
          </button>
        </div>

        {err && (
          <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-lg px-3 py-2 mb-4">
            {err}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">

          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-4 border border-white/5 animate-pulse"
              >
                <div className="h-8 w-24 mb-2 bg-white/10 rounded" />
                <div className="h-4 w-40 bg-white/10 rounded" />
              </div>
            ))
          ) : (
            <>
              <div className="rounded-xl p-4 border border-white/5 text-center">
                <div className="text-3xl font-semibold text-pink-400">
                  {formatPt(data?.critical ?? 0)}
                </div>
                <div className="text-xs text-gray-300 mt-1">Crítico</div>
              </div>

              <div className="rounded-xl p-4 border border-white/5 text-center">
                <div className="text-3xl font-semibold text-violet-400">
                  {formatPt(data?.high ?? 0)}
                </div>
                <div className="text-xs text-gray-300 mt-1">Alto</div>
              </div>

              <div className="rounded-xl p-4 border border-white/5 text-center">
                <div className="text-3xl font-semibold text-indigo-400">
                  {formatPt(data?.medium ?? 0)}
                </div>
                <div className="text-xs text-gray-300 mt-1">Médio</div>
              </div>

              <div className="rounded-xl p-4 border border-white/5 text-center">
                <div className="text-3xl font-semibold text-emerald-400">
                  {formatPt(data?.low ?? 0)}
                </div>
                <div className="text-xs text-gray-300 mt-1">Baixo</div>
              </div>

              <div className="rounded-xl p-4 border border-white/5 text-center">
                <div className="text-3xl font-semibold text-slate-300">
                  {formatPt(data?.pending ?? 0)}
                </div>
                <div className="text-xs text-gray-300 mt-1">Pendentes</div>
              </div>
            </>
          )}

        </div>
      </div>
    );
  }
);

export default VulnSeveridadeCard;
