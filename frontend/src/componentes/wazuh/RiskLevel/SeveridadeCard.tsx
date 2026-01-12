import { GripVertical } from "lucide-react";

type Nivel = "Crítico" | "Alto" | "Médio" | "Baixo";

interface SeveridadeCardProps {
  dados: {
    baixo: number;
    medio: number;
    alto: number;
    critico: number;
    total: number;
  };
  loading?: boolean;
  periodo?: { from: string; to: string } | null;
  isWidget?: boolean;
}

export default function SeveridadeCard({
  dados,
  loading = false,
  isWidget = false,
}: SeveridadeCardProps) {
  const { critico, alto, medio, baixo, total } = dados;

  // 🎨 Configuração visual
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

  // 🔹 SKELETON
  if (loading) {
    return (
      <div className="cards rounded-xl p-6 shadow-md h-full flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="cards rounded-xl p-4 flex flex-col space-y-3 animate-pulse"
            >
              <div className="h-3 w-24 bg-[#ffffff12] rounded" />
              <div className="h-7 w-16 bg-[#ffffff12] rounded" />
              <div className="h-3 w-full bg-[#ffffff12] rounded" />
              <div className="flex gap-1 mt-auto">
                {Array.from({ length: 10 }).map((_, j) => (
                  <div
                    key={j}
                    className="w-1.5 h-2 bg-[#ffffff12] rounded"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 🔹 CARD FINAL
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

      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch h-full">
        {itens.map((item, idx) => {
          const { corTexto, corBarra } = getCfg(item.nivel);
          const ratio = total > 0 ? item.valor / total : 0;
          const percent = ratio * 100;

          const slots = 10;
          const EASING = 1 / 3;
          const preenchidos =
            ratio > 0
              ? Math.min(slots, Math.ceil(Math.pow(ratio, EASING) * slots))
              : 0;

          return (
            <div
              key={idx}
              className="cards rounded-xl p-4 flex flex-col h-full"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">Gravidade</span>
                <span className={`text-xs font-semibold ${corTexto}`}>
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
                    {percent > 0 && percent < 1
                      ? "<1%"
                      : `${Math.round(percent)}%`}
                  </div>
                </div>
              </div>

              <div className="flex gap-1">
                {Array.from({ length: slots }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-2 ${
                      i < preenchidos ? corBarra : "bg-[#2b2b3a]"
                    }`}
                    style={{
                      transition: "background-color 300ms ease",
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
