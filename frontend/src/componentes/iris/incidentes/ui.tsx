// src/componentes/incidentes/ui.tsx
//
// Componentes auxiliares compartilhados da feature de Incidentes.
// Todos são presentacionais — sem estado, sem fetch, sem side effects.

import { FaSort } from "react-icons/fa";

/* =========================================
 * SortableHeader
 * Cabeçalho de coluna clicável com ícone de ordenação.
 * ======================================= */
interface SortableHeaderProps {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}

export function SortableHeader({ label, active, dir, onClick }: SortableHeaderProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-1 hover:text-white transition-colors w-full"
      title={active ? `Ordenado por ${label} (${dir})` : `Ordenar por ${label}`}
    >
      <span>{label}</span>
      {/* @ts-ignore */}
      <FaSort
        className={[
          "text-[12px] transition-transform",
          active ? "opacity-100" : "opacity-60",
          active && dir === "desc" ? "rotate-180" : "rotate-0",
        ].join(" ")}
      />
    </button>
  );
}

/* =========================================
 * Secao
 * Bloco de seção com título e marcador visual,
 * usado no accordion de detalhes do incidente.
 * ======================================= */
interface SecaoProps {
  titulo: string;
  children: React.ReactNode;
}

export function Secao({ titulo, children }: SecaoProps) {
  return (
    <div>
      <h4 className="text-sm text-white font-semibold mb-2 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
        {titulo}
      </h4>
      <div className="pl-0 space-y-1">{children}</div>
    </div>
  );
}

/* =========================================
 * Linha
 * Par label/valor para exibição de propriedades
 * no accordion de detalhes.
 * ======================================= */
interface LinhaProps {
  label: string;
  valor?: string;
}

export function Linha({ label, valor }: LinhaProps) {
  return (
    <p className="text-sm text-gray-300">
      <span className="text-gray-400">{label} </span>
      <span className="text-gray-200">{valor || "—"}</span>
    </p>
  );
}

/* =========================================
 * ListaSkeleton
 * Placeholder animado enquanto os incidentes carregam.
 * ======================================= */
export function ListaSkeleton() {
  return (
    <div className="p-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-12 px-5 py-4 items-center border-t border-[#ffffff12]"
        >
          <div className="col-span-3 h-4 w-28 bg-[#ffffff0a] rounded animate-pulse" />
          <div className="col-span-2 h-4 w-16 bg-[#ffffff0a] rounded animate-pulse" />
          <div className="col-span-3 h-4 w-40 bg-[#ffffff0a] rounded animate-pulse" />
          <div className="col-span-2 h-5 w-16 bg-[#ffffff0a] rounded animate-pulse" />
          <div className="col-span-1 h-4 w-16 bg-[#ffffff0a] rounded animate-pulse" />
          <div className="col-span-1 h-7 w-24 bg-[#ffffff0a] rounded animate-pulse ml-auto" />
        </div>
      ))}
    </div>
  );
}

/* =========================================
 * GraficoSkeleton
 * Placeholder animado para cada card de donut
 * enquanto os dados carregam.
 * ======================================= */
export function GraficoSkeleton() {
  return (
    <div className="cards p-5 rounded-2xl animate-pulse">
      <div className="h-4 w-40 bg-[#ffffff12] rounded mb-4" />
      <div className="flex justify-center items-center">
        <div className="w-28 h-28 rounded-full bg-[#ffffff0a]" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-32 bg-[#ffffff12] rounded" />
        <div className="h-3 w-24 bg-[#ffffff12] rounded" />
        <div className="h-3 w-28 bg-[#ffffff12] rounded" />
      </div>
    </div>
  );
}