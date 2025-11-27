// src/components/wazuh/SeveridadeCard.tsx
import { useEffect, useState } from "react";
import { getRiskLevel } from "../../../services/wazuh/risklevel.service";
import { useTenant } from "../../../context/TenantContext";
import { GripVertical } from "lucide-react";

type Nivel = "Crítico" | "Alto" | "Médio" | "Baixo";

interface SeveridadeCardProps {
  dias: string;
  isWidget?: boolean; // 👈 novo
}

export default function SeveridadeCard({ dias, isWidget = false }: SeveridadeCardProps) {
  const { tenantAtivo } = useTenant();
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

  // Buscar dados
  useEffect(() => {
    if (!tenantAtivo) return;
    let ativo = true;

    async function fetchData() {
      try {
        setCarregando(true);
        setErro(null);
        setAnimReady(false);

        const inicio = Date.now();
        const r = await getRiskLevel(dias);
        if (!ativo) return;

        const elapsed = Date.now() - inicio;
        const delay = Math.max(500 - elapsed, 0);

        setTimeout(() => {
          if (ativo) {
            setDados(r.severidades);
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
    return () => { ativo = false };
  }, [dias, tenantAtivo]);

  const { critico, alto, medio, baixo, total } = dados;

  // Config de cor por severidade
  const getCfg = (nivel: Nivel) => {
    switch (nivel) {
      case "Crítico":
        return { corTexto: "text-[#F914AD]", corBarra: "bg-[#F914AD]" };
      case "Alto":
        return { corTexto: "text-[#A855F7]", corBarra: "bg-[#A855F7]" };
      case "Médio":
        return { corTexto: "text-[#6366F1]", corBarra: "bg-[#6366F1]" };
      case "Baixo":
      default:
        return { corTexto: "text-[#1DD69A]", corBarra: "bg-[#1DD69A]" };
    }
  };

  const itens: Array<{ nivel: Nivel; valor: number }> = [
    { nivel: "Crítico", valor: critico },
    { nivel: "Alto", valor: alto },
    { nivel: "Médio", valor: medio },
    { nivel: "Baixo", valor: baixo },
  ];

  // LOADING skeleton
  if (carregando) {
    return (
      <div className="cards rounded-xl p-6 shadow-md h-full flex flex-col relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch w-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="cards rounded-xl p-4 flex flex-col space-y-3">
              <div className="h-3 w-20 bg-[#ffffff12] rounded animate-pulse" />
              <div className="h-6 w-16 bg-[#ffffff12] rounded animate-pulse" />
              <div className="h-3 w-full bg-[#ffffff12] rounded animate-pulse" />
              <div className="flex gap-1 mt-auto">
                {Array.from({ length: 10 }).map((_, j) => (
                  <div key={j} className="w-1.5 h-2 bg-[#ffffff12] rounded animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ERRO
  if (erro) {
    return (
      <div className="cards rounded-xl p-6 shadow-md text-xs text-red-400 bg-red-950/30 border border-red-900">
        {erro}
      </div>
    );
  }

  // ✔ CARD FINAL (igual aos outros widgets)
  return (
    <div className="cards rounded-xl p-6 shadow-md h-full flex flex-col relative">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {isWidget && (
            <>
              <GripVertical
                size={18}
                className="drag-handle cursor-grab active:cursor-grabbing text-white/50 hover:text-white transition"
              />

              <h3 className="text-sm text-white font-semibold">
                Nível de Alertas
              </h3>
            </>
          )}
        </div>
      </div>


      {/* GRID DOS 4 BLOCOS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch h-full">
        {itens.map((item, idx) => {
          const { corTexto, corBarra } = getCfg(item.nivel);
          const ratio = total > 0 ? item.valor / total : 0;
          const percent = ratio * 100;

          const slots = 10;
          const EASING = 1 / 3;
          const preenchidos =
            ratio > 0 ? Math.min(slots, Math.ceil(Math.pow(ratio, EASING) * slots)) : 0;

          return (
            <div key={idx} className="cards rounded-xl p-4 flex flex-col h-full">

              {/* Topo da caixinha */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">Gravidade</span>
                <span className={`text-xs font-semibold ${corTexto}`}>
                  {item.nivel}
                </span>
              </div>

              {/* Valores */}
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

              {/* Barrinhas */}
              <div className="flex gap-1">
                {Array.from({ length: slots }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-2 ${i < preenchidos ? corBarra : "bg-[#2b2b3a] z-20"
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

    </div>
  );
}