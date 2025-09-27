// src/components/wazuh/TopOSVulnerabilidadeCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { getTopOSVulnerabilidades, TopOSVulnerabilidade } from "../../../services/wazuh/topsovulnerabilidades.service";

export type TopOSVulnerabilidadeCardRef = {
  carregar: () => void;
};

const formatPt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);

const TopOSVulnerabilidadeCard = forwardRef<TopOSVulnerabilidadeCardRef>((props, ref) => {
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
      setErro(e?.message || "Falha ao carregar Top OS");
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

  // 👉 se está carregando, mostra skeleton
  if (carregando) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-white">Top 5 (OS)</h3>
          <span className="text-xs text-gray-400">Total</span>
        </div>

        <ul className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex justify-between items-center">
              <span className="h-4 w-40 rounded bg-white/10 animate-pulse" />
              <span className="h-4 w-8 rounded bg-white/10 animate-pulse" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // 👉 se deu erro
  if (erro) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-center items-center relative h-full text-xs text-red-400">
        {erro}
      </div>
    );
  }

  // 👉 se não tem dados
  if (!topSo.length) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-center items-center relative h-full text-xs text-gray-400">
        Sem vulnerabilidades de OS
      </div>
    );
  }

  // 👉 se tem dados
  return (
    <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-white">Top 5 (OS)</h3>
        <span className="text-xs text-gray-400">Total</span>
      </div>

      <ul className="space-y-2 py-3">
        {topSo.slice(0, 5).map((os) => (
          <li
            key={os.os}
            className="flex justify-between items-center text-sm text-gray-300 hover:text-white transition-colors border-b border-white/5 pb-1"
          >
            <span className="truncate font-medium text-gray-400">{os.os}</span>
            <span className="font-medium text-gray-400">{formatPt(os.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});

export default TopOSVulnerabilidadeCard;