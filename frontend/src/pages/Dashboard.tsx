import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { WidthProvider } from "react-grid-layout";
import GridLayoutBase from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { FaPlus } from "react-icons/fa6";

import Swal from "sweetalert2";

import LayoutModel from "../componentes/LayoutModel";
import WidgetMenuSidebar from "../componentes/dashboard/WidgetMenuSidebar";
import { widgetsConfig } from "../componentes/dashboard/WidgetConfig";
import { getWidgetMap } from "../componentes/dashboard/WidgetMap";
import WidgetMenu from "../componentes/dashboard/WidgetMenu";

import { getDashboardLayout, saveDashboardLayout, resetUserDashboardLayout, WidgetLayout} from "../services/dashboard/dashboardLayout.service";
import { getRiskLevel } from "../services/wazuh/risklevel.service";
import { getToken } from "../utils/auth";
import { normalizarLayout, limparLayoutParaSalvar} from "../utils/dashboardLayout";

import { useTenant } from "../context/TenantContext";

const GridLayout = WidthProvider(GridLayoutBase);

// Layout padrão DEFINITIVO do FRONT
const layoutPadrao: WidgetLayout[] = [
  { i: "grafico_risco", x: 0, y: 0, w: 3, h: 9 },
  { i: "geo_map", x: 3, y: 0, w: 6, h: 13 },
  { i: "top_paises", x: 9, y: 0, w: 3, h: 13 },
  { i: "top_incidentes", x: 0, y: 10, w: 3, h: 18 },
  { i: "ia_humans", x: 3, y: 12, w: 6, h: 14 },
  { i: "top_firewalls", x: 9, y: 12, w: 3, h: 14 },
];

export default function Dashboard() {
  const token = getToken();
  const navigate = useNavigate();
  const { tenantAtivo, loading } = useTenant();

  const [indiceRisco, setIndiceRisco] = useState(0);
  const [totalAtaques, setTotalAtaques] = useState(0);
  const [layout, setLayout] = useState<WidgetLayout[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [resettingLayout, setResettingLayout] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [draggingFromSidebar, setDraggingFromSidebar] = useState(false);

  // 🔹 Carrega layout (do banco ou padrão do FRONT)
  useEffect(() => {
    let ativo = true;

    async function carregarLayout() {
      try {
        const data = await getDashboardLayout();
          if (!data || !Array.isArray(data.layout) || data.layout.length === 0) {
          if (ativo) setLayout(normalizarLayout(layoutPadrao));
        } else {
          if (ativo) setLayout(normalizarLayout(data.layout));
        }
  
      } catch (err) {
        console.error("Erro ao carregar layout:", err);
        if (ativo) setLayout(normalizarLayout(layoutPadrao));
      } finally {
        setTimeout(() => {
          if (ativo) setLoadingDashboard(false);
        }, 300);
      }
    }

    carregarLayout();
    return () => {
      ativo = false;
    };
  }, []);

  // 🔹 Busca índice de risco (24h padrão)
  useEffect(() => {
    if (!tenantAtivo) return;

    let ativo = true;

    const carregarDados = async () => {
      try {
        const dados = await getRiskLevel("1"); // 24h
        if (ativo) setIndiceRisco(dados.indiceRisco);
      } catch {
        if (ativo) setIndiceRisco(0);
      }
    };

    carregarDados();

    return () => {
      ativo = false;
    };
  }, [tenantAtivo]);

  // 🔹 Debounce
  function debounce<T extends (...args: any[]) => void>(fn: T, delay = 1000) {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  // 🔹 Salvamento automático com debounce
  const salvarLayoutDebounced = useMemo(
    () =>
      debounce(async (newLayout: WidgetLayout[]) => {
        try {
          await saveDashboardLayout(newLayout);
        } catch (err) {
          console.error("Erro ao salvar layout:", err);
        }
      }, 1000),
    []
  );

  // 🔹 Remove widget
  async function removerWidget(id: string) {
    try {
      const novoLayout = layout.filter((item) => item.i !== id);
      setLayout(novoLayout);
      await saveDashboardLayout(novoLayout);
    } catch (err) {
      console.error("Erro ao remover widget:", err);
      Swal.fire({
        icon: "error",
        title: "Erro ao atualizar layout",
        text: "Ocorreu um problema ao salvar a remoção no servidor.",
        confirmButtonColor: "#7e22ce",
        background: "#1f1f2b",
        color: "#fff",
      });
    }
  }

  const widgetMap = getWidgetMap(navigate, token || "", indiceRisco, setTotalAtaques);
  

  return (
    <LayoutModel titulo="Home">

      {/* Botões */}
      <div className="flex justify-end mb-4">
        <button
          onClick={async () => {
            const result = await Swal.fire({
              title: "Restaurar layout padrão?",
              text: "Isso substituirá o layout atual.",
              icon: "warning",
              showCancelButton: true,
              confirmButtonColor: "#7e22ce",
              cancelButtonColor: "#6b7280",
              confirmButtonText: "Sim, restaurar",
              cancelButtonText: "Cancelar",
              background: "#1f1f2b",
              color: "#fff",
            });

            if (result.isConfirmed) {
              try {
                setResettingLayout(true);
                await resetUserDashboardLayout();
                setLayout(layoutPadrao);
              } catch (err) {
                Swal.fire({
                  icon: "error",
                  title: "Erro!",
                  text: "Não foi possível restaurar o layout.",
                  confirmButtonColor: "#7e22ce",
                  background: "#1f1f2b",
                  color: "#fff",
                });
              } finally {
                setTimeout(() => setResettingLayout(false), 600);
              }
            }
          }}
          className="px-3 py-2 hover:bg-purple-700 border border-purple-700 text-white rounded-md text-sm shadow-sm mr-3"
        >
          Redefinir para layout padrão
        </button>

        <button
          onClick={() => setSidebarOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-purple-700 hover:bg-purple-800 border border-purple-700 text-white rounded-md text-sm shadow-sm mr-3"
        >
          {/* @ts-ignore */}
          <FaPlus />
          <span>Adicionar widgets</span>
        </button>
      </div>

      {/* Grid */}
      <div className="relative">
        <GridLayout
          className={`layout react-grid-layout ${loadingDashboard || loading}`}
          cols={12}
          rowHeight={30}
          width={1600}
          layout={layout}
          compactType="vertical"
          preventCollision={false}
          isDraggable
          isResizable
          autoSize
          isDroppable
          draggableHandle=".drag-handle"
          maxRows={200}
          onDrop={(layout, layoutItem, event) => {
            const e = event as DragEvent;
            const id = e.dataTransfer?.getData("text/plain");
            if (!id) return;
            if (layout.some((item) => item.i === id)) return;
          
            const cleaned = layout.filter(
              (item) => item.i !== "__dropping-elem__"
            );
          
            const config = widgetsConfig.find((w) => w.id === id);
          
            // layout base (SEM regras de UI)
            const novoLayoutBase: WidgetLayout[] = [
              ...cleaned,
              {
                i: id,
                x: layoutItem?.x ?? 0,
                y: layoutItem?.y ?? Infinity,
                w: config?.w ?? 3,
                h: config?.h ?? 10,
              },
            ];
          
            // aplica regras de UI (minW / minH)
            const novoLayout = normalizarLayout(novoLayoutBase);
          
            //renderiza no frontend
            setLayout(novoLayout);
          
            // salva no backend (layout LIMPO)
            saveDashboardLayout(limparLayoutParaSalvar(novoLayout));
            setDraggingFromSidebar(false);
          }}
          
          onLayoutChange={(newLayout) => {
            // remove regras de UI antes de salvar
            const layoutLimpo = limparLayoutParaSalvar(
              newLayout as WidgetLayout[]
            );
          
            // reaplica regras de UI para renderizar
            const layoutNormalizado = normalizarLayout(layoutLimpo);
          
            // renderiza
            setLayout(layoutNormalizado);
          
            // salva no backend (sem minW/minH)
            salvarLayoutDebounced(layoutLimpo);
          }}
          
          
        >
          {layout.map((item) => (
            <div key={item.i} className="rounded-2xl overflow-hidden relative group">
              <div className="absolute top-3.5 right-2 z-20">
                <WidgetMenu onRemove={() => removerWidget(item.i)} />
              </div>
              {widgetMap[item.i] || (
                <div className="text-gray-400 text-sm text-center p-4">
                  Widget desconhecido: <strong>{item.i}</strong>
                </div>
              )}
            </div>
          ))}
        </GridLayout>

        {draggingFromSidebar && (
          <div className="absolute inset-0 z-[9997] border-4 border-dashed border-purple-600/60 rounded-2xl bg-purple-900/10 pointer-events-none transition-all duration-300">
            <div className="flex items-center justify-center h-full text-purple-300 text-sm font-medium">
              Solte o widget aqui
            </div>
          </div>
        )}

        {/* Sidebar */}
        <WidgetMenuSidebar
          layout={layout}
          indiceRisco={indiceRisco}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          setDraggingFromSidebar={setDraggingFromSidebar}
        />

        {/* Overlay de reset */}
        {resettingLayout && (
          <div className="fixed inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] z-[9999] text-gray-300">
            <svg
              className="animate-spin text-purple-400 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              width="50"
              height="50"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
            <p>Restaurando dashboard padrão...</p>
          </div>
        )}
      </div>
    </LayoutModel>
  );
}