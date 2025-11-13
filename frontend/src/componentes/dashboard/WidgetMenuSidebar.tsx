// src/componentes/dashboard/WidgetMenuSidebar.tsx
import GraficoGauge from "../graficos/GraficoGauge";
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
      {/* 🔹 Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#2a2540]">
        <h2 className="text-white text-sm font-semibold">Adicionar widget</h2>
        <button
          onClick={() => setSidebarOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* 🔹 Lista de widgets */}
      <div className="p-4 space-y-3 text-gray-300">
        <p className="text-xs text-gray-400 mb-2">Arraste para adicionar:</p>

        {widgetsConfig.map((w) => {
          const jaAdicionado = Array.isArray(layout) && layout.some((item) => item.i === w.id);
          const isGauge = w.id === "grafico_risco";

          return (
            <div
              key={w.id}
              draggable={!jaAdicionado}
              onDragStart={(e) => {
                if (jaAdicionado) return;

                e.dataTransfer.setData("text/plain", w.id);
                setSidebarOpen(false);
                setDraggingFromSidebar(true);

                // 🧩 Cria um preview customizado
                const preview = document.createElement("div");
                preview.style.width = "260px";
                preview.style.height = "180px";
                preview.style.background = "rgba(60, 50, 90, 0.95)";
                preview.style.border = "1px solid rgba(255,255,255,0.15)";
                preview.style.borderRadius = "12px";
                preview.style.display = "flex";
                preview.style.alignItems = "center";
                preview.style.justifyContent = "center";
                preview.style.color = "white";
                preview.style.fontSize = "14px";
                preview.style.fontWeight = "500";
                preview.style.boxShadow = "0 0 25px rgba(128,0,255,0.3)";
                preview.style.position = "absolute";
                preview.style.top = "-9999px";
                preview.innerHTML = `
                  <div style="text-align:center;">
                    <div style="font-size:13px; opacity:0.8;">Adicionando widget:</div>
                    <div style="margin-top:4px;">${w.label}</div>
                  </div>
                `;
                document.body.appendChild(preview);
                e.dataTransfer.setDragImage(preview, 130, 90);
                setTimeout(() => preview.remove(), 0);
              }}
              onDragEnd={() => setDraggingFromSidebar(false)}
              className={`relative cursor-${jaAdicionado ? "not-allowed" : "grab"} 
                ${jaAdicionado ? "opacity-40" : "hover:bg-[#3b3360] active:cursor-grabbing"} 
                w-full text-left px-3 py-2 rounded-md bg-[#2a2540] text-sm transition-all mb-3 select-none`}
            >
              <div className="flex items-center justify-between">
                <span>{w.label}</span>
                {jaAdicionado && (
                  <span className="text-[10px] text-gray-500">(já adicionado)</span>
                )}
              </div>

              {/* 🟢 Mostra o preview visual do gauge */}
              {/* {isGauge && !jaAdicionado && (
                <div className="flex justify-center mt-2">
                  <div className="w-[90px] h-[90px] scale-90 opacity-90 pointer-events-none">
                    <GraficoGauge valor={Math.round(indiceRisco)} />
                  </div>
                </div>
              )} */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
