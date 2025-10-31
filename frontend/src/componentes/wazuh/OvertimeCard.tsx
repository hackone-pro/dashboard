// src/components/wazuh/OvertimeCard.tsx
import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { getOvertimeEventos, OvertimeEventos } from "../../services/wazuh/overtimeeventos.service";
import GraficoAreaStacked from "../graficos/GraficoAreaStacked";
import { useTenant } from "../../context/TenantContext";

export type OvertimeCardRef = {
  carregar: () => void;
};

const OvertimeCard = forwardRef<OvertimeCardRef>((props, ref) => {
  const { tenantAtivo } = useTenant();
  const [data, setData] = useState<OvertimeEventos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    if (!tenantAtivo) return;
    try {
      setCarregando(true);
      const res = await getOvertimeEventos();
      setData(res);
      setErro(null);
    } catch (err: any) {
      setErro(err.message ?? "Erro ao carregar dados");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [tenantAtivo]);

  useImperativeHandle(ref, () => ({
    carregar,
  }));

  if (carregando) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 w-44 bg-[#ffffff14] rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-10 bg-[#ffffff14] rounded animate-pulse" />
              <div className="flex-1 h-3 bg-[#ffffff14] rounded animate-pulse" />
              <div className="h-3 w-8 bg-[#ffffff14] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-1 gap-4 items-stretch">
      <div className="rounded-xl p-4 h-64 border border-white/5 flex items-center justify-center w-full">
        {erro && <span className="text-red-400">{erro}</span>}
        {!carregando && !erro && data && (
          <GraficoAreaStacked
            labels={data.labels}
            datasets={data.datasets}
            cores={["#6A55DC", "#1DD69A", "#EC4899"]}
          />
        )}
      </div>
    </div>
  );
});

export default OvertimeCard;