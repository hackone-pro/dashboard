// src/components/wazuh/TopScoreVulnerabilidadeCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import {
  getTopScoresVulnerabilidades,
  TopScoreItem,
} from "../../../services/wazuh/vulntopscores.service";
import GraficoBarHorizontal from "../../../componentes/graficos/GraficoBarraHorizontal";

export type TopScoreVulnerabilidadeCardRef = {
  carregar: () => void;
};

const TopScoreVulnerabilidadeCard = forwardRef<TopScoreVulnerabilidadeCardRef>((props, ref) => {
  const [topScores, setTopScores] = useState<TopScoreItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    setCarregando(true);
    try {
      const lista = await getTopScoresVulnerabilidades(5, "todos");
      setTopScores(lista);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message || "Falha ao carregar distribuição CVSS");
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
        <div className="text-gray-400 animate-pulse text-xs">
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

  if (!topScores.length) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-center items-center relative h-full text-xs text-gray-400">
        Sem dados de vulnerabilidades
      </div>
    );
  }

  return (
    <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-white">
          Pontuações de vulnerabilidade mais comuns
        </h3>
      </div>

      <GraficoBarHorizontal
        categorias={topScores.map((s) => s.score)}
        valores={topScores.map((s) => s.total)}
        cor="#632BD3"
        tituloY="Pontuação base de vulnerabilidade"
      />
    </div>
  );
});

export default TopScoreVulnerabilidadeCard;
