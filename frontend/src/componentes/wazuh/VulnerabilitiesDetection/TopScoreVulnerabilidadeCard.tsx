// src/components/wazuh/TopScoreVulnerabilidadeCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import {
  getTopScoresVulnerabilidades,
  TopScoreItem,
} from "../../../services/wazuh/vulntopscores.service";
import GraficoBarHorizontal from "../../../componentes/graficos/GraficoBarraHorizontal";
import { useTenant } from "../../../context/TenantContext"; // 👈 tenant global

export type TopScoreVulnerabilidadeCardRef = {
  carregar: () => void;
};

const TopScoreVulnerabilidadeCard = forwardRef<TopScoreVulnerabilidadeCardRef>((props, ref) => {
  const { tenantAtivo } = useTenant(); // 👈 obtém tenant ativo global
  const [topScores, setTopScores] = useState<TopScoreItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    if (!tenantAtivo) return; // 🔹 evita execução sem tenant
    setCarregando(true);
    try {
      // 🔹 tenant é tratado internamente no service
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
  }, [tenantAtivo]); // 👈 recarrega ao trocar tenant

  useImperativeHandle(ref, () => ({
    carregar,
  }));

  // 🔹 Skeleton (carregando)
  if (carregando) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 w-52 bg-[#ffffff14] rounded animate-pulse" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-12 bg-[#ffffff14] rounded animate-pulse" />
              <div className="flex-1 h-3 bg-[#ffffff14] rounded animate-pulse" />
              <div className="h-3 w-10 bg-[#ffffff14] rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 🔹 Erro
  if (erro) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-center items-center relative h-full text-xs text-red-400">
        {erro}
      </div>
    );
  }

  // 🔹 Sem dados
  if (!topScores.length) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-center items-center relative h-full text-xs text-gray-400">
        Sem dados de vulnerabilidades
      </div>
    );
  }

  // 🔹 Dados carregados
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
