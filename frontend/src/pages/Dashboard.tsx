import { useState, useEffect, useMemo, JSX } from "react";
import { useNavigate } from "react-router-dom";

import { WidthProvider } from "react-grid-layout";
import GridLayoutBase from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { GripVertical, Trash2 } from "lucide-react";
import { FaPlus } from "react-icons/fa6";


import LayoutModel from "../componentes/LayoutModel";
import GeoHitsMap from "../componentes/graficos/GeoHitsMap";
import GraficoGauge from "../componentes/graficos/GraficoGauge";
import { getSeveridadeWazuh } from "../services/wazuh/severidade.service";
import { getToken } from "../utils/auth";
import { saveDashboardLayout } from "../services/dashboard/dashboardLayout.service";

import TopIncidentesCard from "../componentes/iris/TopIncidents";
import IaHumans from "../componentes/iris/IaHumans";
import TopFirewallCard from "../componentes/wazuh/TopFirewallCard";
import TopCountriesTable from "../componentes/wazuh/threatmap/TopCountriesTable";
import WidgetMenu from "../componentes/dashboard/WidgetMenu";

import { useTenant } from "../context/TenantContext";
import { getDashboardLayout, WidgetLayout, resetUserDashboardLayout } from "../services/dashboard/dashboardLayout.service";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

import Swal from "sweetalert2";

const GridLayout = WidthProvider(GridLayoutBase);

export default function Dashboard() {
  const token = getToken();
  const navigate = useNavigate();

  const [indiceRisco, setIndiceRisco] = useState(0);
  const [totalAtaques, setTotalAtaques] = useState(0);
  const [layout, setLayout] = useState<WidgetLayout[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  const { tenantAtivo, loading } = useTenant();
  const fmt = useMemo(() => new Intl.NumberFormat("pt-BR"), []);
  const [resettingLayout, setResettingLayout] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Layout padrão
  const layoutPadrao = [
    { i: "grafico_risco", x: 0, y: 0, w: 3, h: 9 },
    { i: "geo_map", x: 3, y: 0, w: 6, h: 13 },
    { i: "top_paises", x: 9, y: 0, w: 3, h: 13 },
    { i: "top_incidentes", x: 0, y: 10, w: 3, h: 18 },
    { i: "ia_humans", x: 3, y: 12, w: 6, h: 14 },
    { i: "top_firewalls", x: 9, y: 12, w: 3, h: 14 },
  ];

  // 🔹 Carrega layout (garante que loading sempre finalize)
  useEffect(() => {
    let ativo = true;

    async function carregarLayout() {
      try {
        const data = await getDashboardLayout().catch(() => null);

        if (data?.layout && data.layout.length > 0) {
          // 🔸 Caso tenha layout salvo → usa ele normalmente
          if (ativo) setLayout(data.layout);
        } else {
          // 🟩 Caso não tenha layout → usa o padrão com medidas fixas
          const layoutPadraoFixo: WidgetLayout[] = [
            { i: "grafico_risco", x: 0, y: 0, w: 3, h: 12 },
            { i: "geo_map", x: 3, y: 0, w: 6, h: 14 },
            { i: "top_paises", x: 9, y: 0, w: 3, h: 14 },
            { i: "top_incidentes", x: 0, y: 12, w: 3, h: 12 },
            { i: "ia_humans", x: 3, y: 14, w: 6, h: 12 },
            { i: "top_firewalls", x: 9, y: 14, w: 3, h: 12 },
          ];
          if (ativo) setLayout(layoutPadraoFixo);
        }
      } catch (err) {
        console.error("❌ Erro ao carregar layout:", err);
        if (ativo) setLayout(layoutPadrao);
      } finally {
        // 🔸 Libera o loading mesmo se der erro
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

  // 🔹 Busca índice de risco
  useEffect(() => {
    if (!tenantAtivo) return;

    let ativo = true;
    const carregarDados = async () => {
      try {
        const dados = await getSeveridadeWazuh();
        const { baixo, medio, alto, critico, total } = dados;

        const risco =
          total > 0
            ? ((baixo * 0.2 + medio * 0.6 + alto * 0.87 + critico * 1.0) / total) *
            100
            : 0;
        if (ativo) setIndiceRisco(risco);
      } catch {
        if (ativo) setIndiceRisco(0);
      }
    };

    carregarDados();
    return () => {
      ativo = false;
    };
  }, [tenantAtivo]);

  // ------------------------------
  // 🔹 Função de debounce genérica
  // ------------------------------
  function debounce<T extends (...args: any[]) => void>(fn: T, delay = 1000) {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  // ------------------------------
  // 🔹 Lógica de salvamento automática (silenciosa)
  // ------------------------------
  const salvarLayoutDebounced = useMemo(
    () =>
      debounce(async (newLayout: WidgetLayout[]) => {
        try {
          await saveDashboardLayout(newLayout);
        } catch (err) {
          console.error("❌ Erro ao salvar layout:", err);
        }
      }, 1000),
    []
  );

  function removerWidget(id: string) {
    const novoLayout = layout.filter((item) => item.i !== id);
    setLayout(novoLayout);
    saveDashboardLayout(novoLayout); // opcional: salva no banco
  }

  const handleAddWidget = (id: string) => {
    // evita duplicar widgets
    if (layout.some((item) => item.i === id)) {
      setSidebarOpen(false);
      return;
    }

    // cria um novo widget básico
    const novoWidget: WidgetLayout = {
      i: id,
      x: 0,
      y: Infinity, // posiciona abaixo dos outros
      w: 3,
      h: 10,
    };

    const novoLayout = [...layout, novoWidget];
    setLayout(novoLayout);
    saveDashboardLayout(novoLayout);
    setSidebarOpen(false);
  };

  // 🔹 Widgets
  const widgetMap: Record<string, JSX.Element> = {
    grafico_risco: (
      <div className="cards relative overflow-hidden risk-light-effect h-[340px] p-6 rounded-2xl flex flex-col gap-4">
        <div className="flex justify-between items-center text-sm text-white px-1">
          {/* 🔹 Handle de drag (6 pontinhos estilo AWS) */}
          <div className="flex items-center gap-2 drag-handle cursor-grab active:cursor-grabbing select-none">
            <GripVertical size={18} className="text-white/50 hover:text-white transition" />
            <span className="font-medium">Nível de Risco</span>
          </div>
        </div>

        {/* 🔹 Conteúdo principal do card */}
        <div className="flex justify-center flex-grow relative mt-2">
          <GraficoGauge valor={Math.round(indiceRisco)} />
          <img
            src="/assets/img/icon-risk.png"
            alt="Risco"
            className="absolute z-20 w-6 h-6 top-1/2 left-1/2 -translate-x-1/2 -translate-y-[72%]"
          />
        </div>
        <div className="flex items-center justify-between text-[10px] mt-2 text-gray-400 w-full">
          <div className="flex gap-3 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#1DD69A] rounded-xs"></span> Baixo
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#6366F1] rounded-xs"></span> Médio
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#A855F7] rounded-xs"></span> Alto
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-[#F914AD] rounded-xs"></span> Crítico
            </span>
          </div>
          <button
            onClick={() => navigate("/risk-level")}
            className="px-2 py-1 btn hover:bg-purple-600 text-white rounded-md transition-all"
          >
            Acessar →
          </button>
        </div>
      </div>
    ),

    geo_map: (
      <div className="cards inverse p-2 md:p-5 rounded-2xl shadow-lg h-full">
        <div className="flex items-center justify-between gap-2 cursor-default select-none mb-5">

          {/* Grupo do ícone + título */}
          <div className="flex items-center gap-2">
            {/* Ícone com drag-handle */}
            <GripVertical
              size={18}
              className="drag-handle cursor-grab active:cursor-grabbing text-white/50 hover:text-white transition"
            />
            <h3 className="text-sm text-white text-left">Mapa de Ataque</h3>
          </div>

          {/* Botão à direita — agora clicável */}
          <button
            onClick={() => navigate("/threat-map")}
            className="px-2 py-1 mr-10 text-[11px] text-white rounded-md transition-all btn hover:bg-purple-600"
          >
            Ver mapa completo →
          </button>
        </div>

        <GeoHitsMap />
      </div>
    ),

    top_incidentes: <TopIncidentesCard token={token || ""} />,
    top_firewalls: <TopFirewallCard />,
    top_paises: (
      <div className="p-6 h-full drag-handle cursor-grab active:cursor-grabbing select-none">
        {/* Cabeçalho com ícone + título lado a lado */}
        <div className="flex items-center gap-2 mb-4">
          <GripVertical size={18} className="text-white/50 hover:text-white transition" />
          <h3 className="text-sm text-white">Top 10 países de origem</h3>
        </div>

        {/* Conteúdo abaixo */}
        <TopCountriesTable dias="todos" limit={10} onTotalChange={setTotalAtaques} />
      </div>

    ),
    ia_humans: (
      <div className="cards p-4 rounded-2xl shadow-lg h-full flex flex-col">
        <IaHumans token={token || ""} />
      </div>
    ),

    widget_teste: (
      <div className="cards p-6 rounded-2xl shadow-lg h-full flex items-center justify-center text-white text-sm">
        <p>Widget de teste adicionado dinamicamente ✅</p>
      </div>
    ),
  };

  // 🔹 Render
  return (
    <LayoutModel titulo="Home">
      <div className="flex justify-end mb-4">
        <button
          onClick={async () => {
            const result = await Swal.fire({
              title: "Restaurar layout padrão?",
              text: "Isso substituirá o layout atual pelos widgets padrão.",
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
                setResettingLayout(true); // 🔹 mostra overlay

                await resetUserDashboardLayout();

                // 🔹 Atualiza o layout diretamente (sem reload)
                const data = await getDashboardLayout();
                if (data?.layout && data.layout.length > 0) {
                  setLayout(data.layout);
                }

                // 🔹 Fecha o overlay após pequena transição
                setTimeout(() => {
                  setResettingLayout(false);
                }, 600);
              } catch (err) {
                console.error("Erro ao restaurar layout padrão:", err);
                setResettingLayout(false);

                Swal.fire({
                  icon: "error",
                  title: "Erro!",
                  text: "Não foi possível restaurar o layout padrão.",
                  confirmButtonColor: "#7e22ce",
                  background: "#1f1f2b",
                  color: "#fff",
                });
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
      <div className="relative">
        {/* 🔹 GRID sempre renderiza, mesmo se estiver carregando */}
        <DragDropContext
          onDragEnd={(result: DropResult) => {
            if (!result.destination) return;

            const { source, destination, draggableId } = result;

            // 🔹 Quando o item vem do menu lateral e é solto na dashboard
            if (source.droppableId === "widgetsMenu" && destination.droppableId === "dashboard") {
              handleAddWidget(draggableId);
            }
          }}
        >
          {/* Tudo o que já existe na sua dashboard: o GridLayout e o painel lateral */}
          <Droppable droppableId="dashboard">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                <GridLayout
                  className={`layout ${loadingDashboard || loading}`}
                  cols={12}
                  rowHeight={30}
                  width={1600}
                  layout={layout}
                  compactType="vertical"
                  preventCollision={false}
                  isDraggable
                  isResizable
                  autoSize
                  draggableHandle=".drag-handle"
                  onLayoutChange={(newLayout) => {
                    setLayout(newLayout as WidgetLayout[]);
                    salvarLayoutDebounced(newLayout as WidgetLayout[]);
                  }}
                >
                  {layout.map((item) => (
                    <div
                      key={item.i}
                      className="rounded-2xl overflow-hidden relative group"
                      style={{
                        background: "rgba(30, 30, 40, 0.9)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
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
                  {provided.placeholder}
                </GridLayout>
              </div>
            )}
          </Droppable>

          {/* painel lateral de widgets */}
          <div
            className={`fixed top-0 right-0 h-full w-[320px] bg-[#1D1929] shadow-2xl border-l border-[#2a2540] transform transition-transform duration-300 z-[9998]
    ${sidebarOpen ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#2a2540]">
              <h2 className="text-white text-sm font-semibold">Adicionar widget</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 text-gray-300">
              <p className="text-xs text-gray-400 mb-2">Widgets disponíveis:</p>

              <Droppable droppableId="widgetsMenu">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {[
                      { id: "grafico_risco", label: "Nível de Risco" },
                      { id: "geo_map", label: "Mapa de Ataques" },
                      { id: "top_paises", label: "Top Países" },
                      { id: "ia_humans", label: "IA Humans" },
                      { id: "top_incidentes", label: "Top Incidentes" },
                      { id: "top_firewalls", label: "Top Firewalls" },
                      { id: "widget_teste", label: "Widget Teste" },
                    ].map((w, index) => (
                      <Draggable key={w.id} draggableId={w.id} index={index}>
                        {(provided) => (
                          <button
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className="w-full text-left px-3 py-2 rounded-md bg-[#2a2540] hover:bg-[#3b3360] text-sm transition-all mb-2"
                          >
                            {w.label}
                          </button>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

          </div>
        </DragDropContext>


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
