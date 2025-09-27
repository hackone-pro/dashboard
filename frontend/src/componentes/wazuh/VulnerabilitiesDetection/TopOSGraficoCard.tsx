// src/components/wazuh/TopOSGraficoCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import {
  getTopOSVulnerabilidades,
  TopOSVulnerabilidade,
} from "../../../services/wazuh/topsovulnerabilidades.service";
import GraficoBarHorizontal from "../../../componentes/graficos/GraficoBarraHorizontal";

export type TopOSGraficoCardRef = {
  carregar: () => void;
};

const TopOSGraficoCard = forwardRef<TopOSGraficoCardRef>((props, ref) => {
  const [topSo, setTopSo] = useState<TopOSVulnerabilidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    setCarregando(true);
    try {
      const lista = await getTopOSVulnerabilidades(5, "todos");
      setTopSo(lista);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message || "Falha ao carregar vulnerabilidades por SO");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  useImperativeHandle(ref, () => ({
    carregar,
  }));

  if (carregando) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-center items-center relative h-full">
        <div className="h-full flex items-center justify-center text-gray-400 text-xs">
          Carregando gráfico...
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-center items-center relative h-full text-xs text-red-400">
        {erro}
      </div>
    );
  }

  if (!topSo.length) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-center items-center relative h-full text-xs text-gray-400">
        Sem vulnerabilidades de OS
      </div>
    );
  }

  return (
    <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-white">
          Vulnerabilidades por Sistema Operacional
        </h3>
      </div>

      <GraficoBarHorizontal
        categorias={topSo.map((os) => os.os)}
        valores={topSo.map((os) => os.total)}
        cor="#632BD3"
        tituloY="Tipo de sistema operacional host"
      />
    </div>
  );
});

export default TopOSGraficoCard;
