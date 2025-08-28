// src/components/wazuh/SeveridadeCard.tsx
import { useEffect, useState } from "react";
import { getSeveridadeWazuh } from "../../services/wazuh/severidade.service";

type Nivel = "Crítico" | "Alto" | "Médio" | "Baixo";

export default function SeveridadeCard() {
  const [dados, setDados] = useState({
    critico: 0,
    alto: 0,
    medio: 0,
    baixo: 0,
    total: 0,
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [animReady, setAnimReady] = useState(false);

  useEffect(() => {
    let ativo = true;
    async function fetchData() {
      try {
        setCarregando(true);
        setErro(null);
        setAnimReady(false);

        const r = await getSeveridadeWazuh();
        if (!ativo) return;
        setDados(r);

        // delay pequeno p/ animar width/opacity
        setTimeout(() => ativo && setAnimReady(true), 50);
      } catch (e: any) {
        if (!ativo) return;
        setErro(e?.message ?? "Erro ao carregar severidade");
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    fetchData();
    return () => {
      ativo = false;
    };
  }, []);

  const { critico, alto, medio, baixo, total } = dados;

  const getCfg = (nivel: Nivel) => {
    switch (nivel) {
      case "Crítico":
        return { corTexto: "text-pink-500", corBarra: "bg-pink-500", corBadge: "badge-pink" };
      case "Alto":
        return { corTexto: "text-purple-400", corBarra: "bg-[#7E27FE]", corBadge: "badge-high" };
      case "Médio":
        return { corTexto: "text-blue-400", corBarra: "bg-blue-400", corBadge: "badge-darkpink" };
      case "Baixo":
      default:
        return { corTexto: "text-emerald-400", corBarra: "bg-emerald-400", corBadge: "badge-green" };
    }
  };

  const itens: Array<{ nivel: Nivel; valor: number }> = [
    { nivel: "Crítico", valor: critico },
    { nivel: "Alto", valor: alto },
    { nivel: "Médio", valor: medio },
    { nivel: "Baixo", valor: baixo },
  ];

  // skeleton no mesmo padrão dos outros cards
  if (carregando) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="cards rounded-xl p-4 h-full">
            <div className="flex justify-between items-center mb-3">
              <div className="h-3 w-16 bg-[#ffffff0a] rounded animate-pulse" />
              <div className="h-5 w-14 bg-[#ffffff0a] rounded animate-pulse" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="h-7 w-20 bg-[#ffffff0a] rounded animate-pulse" />
              <div className="h-3 w-14 bg-[#ffffff0a] rounded animate-pulse" />
              <div className="h-3 w-10 bg-[#ffffff0a] rounded animate-pulse" />
            </div>
            <div className="w-full h-2 rounded bg-[#ffffff0a] animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (erro) {
    return (
      <div className="cards rounded-xl p-4 text-xs text-red-400 bg-red-950/30 border border-red-900">
        {erro}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch h-full">
      {itens.map((item, idx) => {
        const { corTexto, corBarra, corBadge } = getCfg(item.nivel);

        // proporção deste nível no total (mantém o % exibido)
        const ratio = total > 0 ? item.valor / total : 0;
        const percent = ratio * 100;

        // total de “barrinhas”
        const slots = 10;

        // easing para “encher” visualmente níveis com participação pequena
        // 1/2 (raiz) = mais sutil | 1/3 (raiz cúbica) = mais barrinhas
        const EASING = 1 / 3;

        // calcula quantas barrinhas pintar (0..10)
        const preenchidos = ratio > 0
          ? Math.min(slots, Math.ceil(Math.pow(ratio, EASING) * slots))
          : 0;

        return (
          <div key={idx} className="cards rounded-xl p-4 flex flex-col  h-full">
            {/* header do card */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Gravidade</span>
              <span className={`text-xs font-semibold ${corTexto} ${corBadge} badge rounded-md py-0.5`}>
                {item.nivel}
              </span>
            </div>

            {/* métrica + porcentagem */}
            <div className={`flex flex-col gap-2 mt-auto ${total ? "mb-2" : "mb-1"}`}>
              <div className="flex items-center justify-between">
                <div className="text-white text-2xl font-bold ">
                  {item.valor.toLocaleString("pt-BR")}
                </div>
                <div className="text-xs text-gray-400 flex items-center justify-between">Alertas</div>
                <div className={`text-xs font-medium ${corTexto}`}>
                  {Math.round(percent)}%
                </div>
              </div>
            </div>

            {/* barras proporcionais com animação */}
            <div className="flex gap-1">
              {Array.from({ length: slots }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-2 ${i < preenchidos ? corBarra : "bg-[#2b2b3a]"
                    }`}
                  style={{
                    transition: "background-color 300ms ease, opacity 300ms ease",
                    opacity: animReady ? 1 : 0,
                    transitionDelay: `${i * 30}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}