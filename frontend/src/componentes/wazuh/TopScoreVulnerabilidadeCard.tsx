import { useEffect, useState } from "react";
import {
  getTopScoresVulnerabilidades,
  TopScoreItem,
} from "../../services/wazuh/vulntopscores.service";
import GraficoBarHorizontal from "../../componentes/graficos/GraficoBarraHorizontal";

export default function TopScoreVulnerabilidadeCard() {
  const [topScores, setTopScores] = useState<TopScoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const lista = await getTopScoresVulnerabilidades(5, "todos");
      setTopScores(lista);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "Falha ao carregar distribuição CVSS");
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
        <h3 className="text-sm font-medium text-white">
          Pontuações de vulnerabilidade mais comuns
        </h3>
      </div>

      {err && <div className="text-xs text-red-400 mb-2">{err}</div>}

      {loading ? (
        <div className="h-32 flex items-center justify-center text-gray-400 text-xs">
          Carregando gráfico...
        </div>
      ) : topScores.length > 0 ? (
        <GraficoBarHorizontal
          categorias={topScores.map((s) => s.score)}
          valores={topScores.map((s) => s.total)}
          cor="#632BD3" // roxo padrão
          tituloY="Pontuação base de vulnerabilidade"
        />
      ) : (
        <div className="text-xs text-center text-gray-400 py-4">
          Sem dados de vulnerabilidades
        </div>
      )}
    </div>
  );
}
