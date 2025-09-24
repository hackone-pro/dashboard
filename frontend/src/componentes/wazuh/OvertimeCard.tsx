// src/components/wazuh/OvertimeCard.tsx
import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { getOvertimeEventos, OvertimeEventos } from "../../services/wazuh/overtimeeventos.service";
import GraficoAreaStacked from "../graficos/GraficoAreaStacked";

export type OvertimeCardRef = {
  carregar: () => void;
};

const OvertimeCard = forwardRef<OvertimeCardRef>((props, ref) => {
  const [data, setData] = useState<OvertimeEventos | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
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

  // chama uma vez ao montar
  useEffect(() => {
    carregar();
  }, []);

  // expõe a função para o pai
  useImperativeHandle(ref, () => ({
    carregar,
  }));

  if (carregando) {
    return <div className="w-full h-52 rounded-xl bg-[#ffffff0a] animate-pulse" />;
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
