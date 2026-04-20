// src/components/wazuh/DistribuicaoAcoesCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect, useMemo } from "react";
import { getOvertimeEventos, OvertimeEventos } from "../../services/wazuh/overtimeeventos.service";
import GraficoDonutSimples from "../graficos/GraficoDonutSimples";
import { useTenant } from "../../context/TenantContext";

export type DistribuicaoAcoesCardRef = {
  carregar: (opts?: {
    from?: string;
    to?: string;
    dias?: number;
  }) => void;
};

interface DistribuicaoAcoesCardProps {
  onDadosCarregados?: (items: { label: string; value: number }[]) => void;
}

const DistribuicaoAcoesCard = forwardRef<DistribuicaoAcoesCardRef, DistribuicaoAcoesCardProps>(({ onDadosCarregados }, ref) => {
  const { tenantAtivo } = useTenant();
  const [data, setData] = useState<OvertimeEventos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const CORES_POR_ACAO: Record<string, string> = {
    Adicionado: "#1DD69A",
    Modificado: "#6A55DC",
    Deletado: "#EC4899",
  };

  const carregar = async (opts?: {
    from?: string;
    to?: string;
    dias?: number;
  }) => {
    if (!tenantAtivo) return;

    try {
      setCarregando(true);
      setErro(null);

      const res = await getOvertimeEventos(
        opts?.from && opts?.to
          ? { from: opts.from, to: opts.to }
          : { dias: opts?.dias ?? 1 }
      );

      setData(res);
      const top5computed = res.datasets
        .map((ds) => ({ label: ds.name, value: ds.data.reduce((acc, n) => acc + (n || 0), 0) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      onDadosCarregados?.(top5computed);
    } catch (err: any) {
      setErro(err.message ?? "Erro ao carregar dados");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar({ dias: 1 }); // últimas 24h
  }, [tenantAtivo]);

  useImperativeHandle(ref, () => ({
    carregar,
  }));
  

  const top5 = useMemo(() => {
    if (!data) return [];
    const totais = data.datasets.map((ds) => ({
      label: ds.name,
      value: ds.data.reduce((acc, n) => acc + (n || 0), 0),
    }));
    return totais.sort((a, b) => b.value - a.value).slice(0, 5);
  }, [data]);

  const labels = top5.map((r) => r.label || "Desconhecido");

  const series = top5.map((r) =>
    Number.isFinite(r.value) ? r.value : 0
  );

  const cores = top5.map(
    (r) => CORES_POR_ACAO[r.label] ?? "#64748B" // fallback cinza
  );


  if (erro) {
    return (
      <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2">
        {erro}
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="flex items-center">
        <div className="w-[220px] h-[220px] rounded-full bg-[#ffffff0a] animate-pulse" />
        <div className="flex flex-col gap-2 ml-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-xs bg-[#ffffff14] animate-pulse" />
              <div className="h-3 w-24 bg-[#ffffff14] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!series.length || series.every((v) => v === 0)) {
    return (
      <div className="flex items-center justify-center w-full h-52 text-xs text-gray-400">
        Nenhum dado para exibir.
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <div>
        <GraficoDonutSimples
          labels={labels}
          series={series}
          cores={cores}
          height={220}
        />
      </div>

      <div className="flex flex-col gap-2 text-xs text-gray-400 ml-6">
        {labels.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-xs"
              style={{ backgroundColor: cores[i % cores.length] }}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
});

export default DistribuicaoAcoesCard;