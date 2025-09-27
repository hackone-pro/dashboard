// src/components/wazuh/AnoVulnerabilidadeCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import {
  getAnoVulnerabilidades,
  AnoVulnerabilidade,
} from "../../../services/wazuh/anovulnerabilidades.service";
import GraficoStackedBarChart from "../../graficos/GraficoStackedBarChart";

export type AnoVulnerabilidadeCardRef = {
  carregar: () => void;
};

const AnoVulnerabilidadeCard = forwardRef<AnoVulnerabilidadeCardRef>((props, ref) => {
  const [anoVulns, setAnoVulns] = useState<AnoVulnerabilidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
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
  }, []);

  useImperativeHandle(ref, () => ({
    carregar,
  }));

  if (carregando) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-center items-center relative h-full">
        <div className="h-32 flex items-center justify-center text-gray-400 text-xs">
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

  if (!anoVulns.length) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-center items-center relative h-full text-xs text-gray-400">
        Sem dados de vulnerabilidades por ano
      </div>
    );
  }

  return (
    <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-white">Vulnerabilidades por Ano</h3>
      </div>

      <GraficoStackedBarChart
        categorias={anoVulns.map((a) => a.ano)} // eixo X
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
});

export default AnoVulnerabilidadeCard;
