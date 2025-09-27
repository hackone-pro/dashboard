// src/components/wazuh/VulnSeveridadeCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { getVulnSeveridades, VulnSeveridades } from "../../../services/wazuh/vulnseveridades.service";
import { FaSyncAlt } from "react-icons/fa";

export type VulnSeveridadeCardRef = {
  carregar: () => void;
  getTotal: () => number; // 👈 expõe o total para o pai
};

type Props = {
  onAtualizar?: () => void;
};

const formatPt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);

const VulnSeveridadeCard = forwardRef<VulnSeveridadeCardRef, Props>(({ onAtualizar }, ref) => {
  const [data, setData] = useState<VulnSeveridades | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const carregar = async () => {
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
  }, []);

  useImperativeHandle(ref, () => ({
    carregar,
    getTotal: () => data?.total ?? 0,
  }));

  return (
    <section className="cards p-6 rounded-2xl shadow-lg">
      <div className="flex flex-wrap justify-between items-start mb-6">
        <div className="flex flex-col">
          <h3 className="text-white text-base font-semibold">
            {data?.total !== undefined && (
              <span>alertas totais: {formatPt(data.total)}</span>
            )}
          </h3>
        </div>

        <div className="flex items-end gap-3 flex-wrap">
          <button
            onClick={onAtualizar}
            className="flex items-center gap-2 text-md border border-[#1D1929] bg-[#0A0617] hover:bg-gray-700 text-gray-400 px-3 py-1 rounded-md transition"
          >
            {/* @ts-ignore */}
            <FaSyncAlt className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {err && (
        <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2 mb-4">
          {err}
        </div>
      )}

      {/* Grid com 5 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-4 h-full border border-white/5 animate-pulse"
            >
              <div className="h-8 w-24 mb-2 rounded bg-white/10" />
              <div className="h-4 w-40 rounded bg-white/10" />
            </div>
          ))
        ) : (
          <>
            <div className="rounded-xl p-4 h-full border border-white/5 text-center">
              <div className="text-3xl font-semibold leading-tight text-pink-400">
                {formatPt(data?.critical ?? 0)}
              </div>
              <div className="text-sm text-gray-300 mt-1">Severidade Crítica</div>
            </div>

            <div className="rounded-xl p-4 h-full border border-white/5 text-center">
              <div className="text-3xl font-semibold leading-tight text-violet-400">
                {formatPt(data?.high ?? 0)}
              </div>
              <div className="text-sm text-gray-300 mt-1">Severidade Alta</div>
            </div>

            <div className="rounded-xl p-4 h-full border border-white/5 text-center">
              <div className="text-3xl font-semibold leading-tight text-indigo-400">
                {formatPt(data?.medium ?? 0)}
              </div>
              <div className="text-sm text-gray-300 mt-1">Severidade Média</div>
            </div>

            <div className="rounded-xl p-4 h-full border border-white/5 text-center">
              <div className="text-3xl font-semibold leading-tight text-emerald-400">
                {formatPt(data?.low ?? 0)}
              </div>
              <div className="text-sm text-gray-300 mt-1">Severidade Baixa</div>
            </div>

            <div className="rounded-xl p-4 h-full border border-white/5 text-center">
              <div className="text-3xl font-semibold leading-tight text-slate-300">
                {formatPt(data?.pending ?? 0)}
              </div>
              <div className="text-sm text-gray-300 mt-1">Pendentes (Avaliação)</div>
            </div>
          </>
        )}
      </div>
    </section>
  );
});

export default VulnSeveridadeCard;
