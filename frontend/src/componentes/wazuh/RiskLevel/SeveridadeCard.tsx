import { useEffect, useState } from "react";
import { getSeveridadeWazuh } from "../../../services/wazuh/severidade.service";
import { useTenant } from "../../../context/TenantContext"; // 👈 novo import

type Nivel = "Crítico" | "Alto" | "Médio" | "Baixo";

interface SeveridadeCardProps {
  dias: string;
}

export default function SeveridadeCard({ dias }: SeveridadeCardProps) {
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
  const { tenantAtivo } = useTenant(); // 👈 tenant global

  useEffect(() => {
    if (!tenantAtivo) return; // só busca se houver tenant ativo

    let ativo = true;
    async function fetchData() {
      try {
        setCarregando(true);
        setErro(null);
        setAnimReady(false);

        const inicio = Date.now();
        const r = await getSeveridadeWazuh(dias);
        if (!ativo) return;

        // delay mínimo para suavizar transição
        const elapsed = Date.now() - inicio;
        const delay = Math.max(500 - elapsed, 0);

        setTimeout(() => {
          if (ativo) {
            setDados(r);
            setAnimReady(true);
          }
        }, delay);
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
  }, [dias, tenantAtivo]); // 👈 reage à troca de tenant

  const { critico, alto, medio, baixo, total } = dados;

  const getCfg = (nivel: Nivel) => {
    switch (nivel) {
      case "Crítico":
        return { corTexto: "text-[#F914AD]", corBarra: "bg-[#F914AD]", corBadge: "badge-pink" };
      case "Alto":
        return { corTexto: "text-[#A855F7]", corBarra: "bg-[#A855F7]", corBadge: "badge-high" };
      case "Médio":
        return { corTexto: "text-[#6366F1]", corBarra: "bg-[#6366F1]", corBadge: "badge-darkpink" };
      case "Baixo":
      default:
        return { corTexto: "text-[#1DD69A]", corBarra: "bg-[#1DD69A]", corBadge: "badge-green" };
    }
  };

  const itens: Array<{ nivel: Nivel; valor: number }> = [
    { nivel: "Crítico", valor: critico },
    { nivel: "Alto", valor: alto },
    { nivel: "Médio", valor: medio },
    { nivel: "Baixo", valor: baixo },
  ];

  if (carregando) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-gray-400 bg-[#0d0c22]/30 rounded-xl animate-pulse">
        Carregando severidade...
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

        const ratio = total > 0 ? item.valor / total : 0;
        const percent = ratio * 100;

        const slots = 10;
        const EASING = 1 / 3;
        const preenchidos =
          ratio > 0 ? Math.min(slots, Math.ceil(Math.pow(ratio, EASING) * slots)) : 0;

        return (
          <div key={idx} className="cards rounded-xl p-4 flex flex-col h-full relative overflow-hidden">
            {/* Overlay sutil durante troca de tenant */}
            {carregando && (
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center text-gray-300 text-xs z-20">
                Atualizando...
              </div>
            )}

            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">Gravidade</span>
              <span className={`text-xs font-semibold ${corTexto} ${corBadge} badge rounded-md py-0.5`}>
                {item.nivel}
              </span>
            </div>

            <div className="flex flex-col gap-2 mt-auto mb-2">
              <div className="flex items-center justify-between">
                <div className="text-white text-2xl font-bold">
                  {item.valor.toLocaleString("pt-BR")}
                </div>
                <div className="text-xs text-gray-400">Alertas</div>
                <div className={`text-xs font-medium ${corTexto}`}>
                  {percent > 0 && percent < 1 ? "<1%" : `${Math.round(percent)}%`}
                </div>
              </div>
            </div>

            <div className="flex gap-1">
              {Array.from({ length: slots }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-2 ${i < preenchidos ? corBarra : "bg-[#2b2b3a]"}`}
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
