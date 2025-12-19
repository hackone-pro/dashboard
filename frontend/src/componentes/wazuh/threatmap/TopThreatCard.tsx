import { useEffect, useMemo, useState } from "react";
import { HiOutlineShieldExclamation } from "react-icons/hi2";
import GraficoDonutSimples from "../../graficos/GraficoDonutSimples";
import { useTenant } from "../../../context/TenantContext";
import { getMitreTechniquesAndTactics } from "../../../services/wazuh/mitre-techniques.service";


type TacticItem = {
  tatica: string;
  total: number;
  percentual: number;
};

export default function TopThreatCard({
  className = "",
  dias = "1",
}: {
  className?: string;
  dias?: string;
}) {
  const { tenantAtivo } = useTenant();
  const [dados, setDados] = useState<TacticItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  /* ============================================
     LOAD DATA (reativo ao tenant)
  ============================================ */
  useEffect(() => {
    if (!tenantAtivo) return;

    let ativo = true;

    async function carregar() {
      try {
        setLoading(true);
        setErro(null);

        const res = await getMitreTechniquesAndTactics(dias);
        if (!ativo) return;

        setDados(res.tactics);

      } catch (e: any) {
        if (!ativo) return;
        setErro(e?.message ?? "Erro ao carregar táticas MITRE");
      } finally {
        if (ativo) setLoading(false);
      }
    }

    carregar();
    return () => {
      ativo = false;
    };
  }, [tenantAtivo, dias]);


  /* ============================================
     DONUT DATA
  ============================================ */
  const top5 = useMemo(
    () => [...dados].sort((a, b) => b.total - a.total).slice(0, 5),
    [dados]
  );

  const labels = top5.map((d) => d.tatica || "Desconhecida");
  const series = top5.map((d) => d.total);

  const cores = ["#EC4899", "#8B5CF6", "#F59E0B", "#38BDF8", "#22C55E"];

  /* ============================================
     STATES
  ============================================ */
  if (erro) {
    return (
      <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2">
        {erro}
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className={`cards rounded-xl p-4 shadow-md backdrop-blur-md bg-[#0b061a]/90 border border-[#ffffff12] ${className}`}
      >
        <div className="flex items-center gap-2 mb-4">
          {/* @ts-ignore */}
          <HiOutlineShieldExclamation className="text-purple-400" size={22} />
          <div className="h-3 w-32 bg-[#ffffff14] rounded animate-pulse" />
        </div>

        <div className="flex items-center gap-4">
          <div className="w-[96px] h-[96px] rounded-full bg-[#ffffff0a] animate-pulse" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm bg-[#ffffff14] animate-pulse" />
                <div className="h-3 w-24 bg-[#ffffff14] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="text-xs text-gray-400">
        Nenhum dado para exibir.
      </div>
    );
  }

  /* ============================================
     RENDER
  ============================================ */
  return (
    <div
      className={`cards rounded-xl p-4 shadow-md backdrop-blur-md bg-[#0b061a]/90 border border-[#ffffff12] ${className}`}
    >
      {/* HEADER */}
      <div className="flex items-center gap-2 mb-4">
        {/* @ts-ignore */}
        <HiOutlineShieldExclamation className="text-purple-400" size={22} />
        <h4 className="text-sm text-white">
          Top Ameaças por Tática
        </h4>
      </div>

      <div className="flex w-full items-start gap-4">
        {/* COLUNA ESQUERDA — DONUT */}
        <div className="w-[120px] shrink-0">
          <GraficoDonutSimples
            labels={labels}
            series={series}
            cores={cores}
            height={120}
          />
        </div>

        {/* COLUNA DIREITA — TEXTO */}
        <div className="flex flex-col gap-3 text-xs text-gray-400 flex-1 min-w-0">
          {top5.map((d, i) => (
            <div key={d.tatica} className="flex gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-xs mt-1 shrink-0"
                style={{ backgroundColor: cores[i % cores.length] }}
              />

              <div className="flex flex-col leading-tight min-w-0 overflow-hidden">
                <span className="truncate text-gray-300">
                  {d.tatica}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>



    </div>
  );
}