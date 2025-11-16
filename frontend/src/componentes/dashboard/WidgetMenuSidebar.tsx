// src/componentes/dashboard/WidgetMenuSidebar.tsx
import { widgetsConfig } from "./WidgetConfig";

interface WidgetMenuSidebarProps {
  layout: any[];
  indiceRisco: number;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  setDraggingFromSidebar: (v: boolean) => void;
}

export default function WidgetMenuSidebar({
  layout = [],
  indiceRisco,
  sidebarOpen,
  setSidebarOpen,
  setDraggingFromSidebar,
}: WidgetMenuSidebarProps) {
  return (
    <div
      className={`fixed top-0 right-0 h-full w-[320px] bg-[#1D1929] shadow-2xl border-l border-[#2a2540]
        transform transition-transform duration-300 z-[9998]
        ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}
    >
      {/* Header fixo */}
      <div className="flex items-center justify-between p-4 border-b border-[#2a2540]">
        <h2 className="text-white text-sm font-semibold">Adicionar widget</h2>
        <button
          onClick={() => setSidebarOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Lista com scroll */}
      <div
        className="p-4 space-y-3 text-gray-300 overflow-y-auto custom-scroll"
        style={{ height: "calc(100% - 56px)" }}
      >
        <p className="text-xs text-gray-400 mb-2">Arraste para adicionar:</p>

        {widgetsConfig.map((w) => {
          const jaAdicionado =
            Array.isArray(layout) && layout.some((item) => item.i === w.id);

          if (jaAdicionado) return null;

          return (
            <div
              key={w.id}
              draggable={!jaAdicionado}
              onDragStart={(e) => {
                if (jaAdicionado) return;

                e.dataTransfer.setData("text/plain", w.id);

                setSidebarOpen(false);
                setDraggingFromSidebar(true);
              }}
              onDragEnd={() => setDraggingFromSidebar(false)}
              className={`relative cursor-${jaAdicionado ? "not-allowed" : "grab"}
                ${
                  jaAdicionado
                    ? "opacity-40"
                    : "hover:bg-[#3b3360] active:cursor-grabbing"
                }
                w-full text-left px-3 py-2 rounded-md bg-[#2a2540] text-sm
                transition-all mb-3 select-none`}
            >
              <div className="flex items-center justify-between">
                <span>{w.label}</span>

                {jaAdicionado && (
                  <span className="text-[10px] text-gray-500">(já adicionado)</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
