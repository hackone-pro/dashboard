import { useEffect, useState } from "react";
import {
  getAnoVulnerabilidades,
  AnoVulnerabilidade,
} from "../../services/wazuh/anovulnerabilidades.service";
import GraficoStackedBarChart from "../../componentes/graficos/GraficoStackedBarChart";

export default function AnoVulnerabilidadeCard() {
  const [anoVulns, setAnoVulns] = useState<AnoVulnerabilidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const lista = await getAnoVulnerabilidades("todos");
      setAnoVulns(lista);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "Falha ao carregar vulnerabilidades por ano");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-white">Vulnerabilidades por Ano</h3>
      </div>

      {err && <div className="text-xs text-red-400 mb-2">{err}</div>}

      {loading ? (
        <div className="h-32 flex items-center justify-center text-gray-400 text-xs">
          Carregando gráfico...
        </div>
      ) : anoVulns.length > 0 ? (
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
      ) : (
        <div className="text-xs text-center text-gray-400 py-4">
          Sem dados de vulnerabilidades por ano
        </div>
      )}
    </div>
  );
}
