import { useState, useEffect } from "react";
import LayoutModel from "../componentes/LayoutModel";
import { LuBuilding2, LuMessageSquareText, LuSettings } from "react-icons/lu";
import { TbAntennaBars5, TbAdjustmentsHorizontal } from "react-icons/tb";
import { GoShieldCheck, GoDatabase } from "react-icons/go";
import GraficoDonutSimples from "../componentes/graficos/GraficoDonutSimples";


import { getAdminSummary } from "../services/multi-tenant/summary.service";
import Slider from "../componentes/Swiper";
import { useScreenContext } from "../context/ScreenContext";

export default function MultiTenantManager() {

    const [tenantsSelecionados, setTenantsSelecionados] = useState<string[]>([]);
    const [dadosTenants, setDadosTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const { setScreenData } = useScreenContext();

    useEffect(() => {
        if (loading) return;
        setScreenData("multi-tenant-manager", {
            totalTenants: dadosTenants.length,
            tenantsSelecionados,
            resumo: dadosTenants.map(t => ({
                nome: t.nome,
                risco: t.risco,
                incidentesCritico: t.incidentes_critico,
                incidentesAlto: t.incidentes_alto,
                ativos: t.ativos,
            })),
        });
    }, [loading, dadosTenants, tenantsSelecionados]);

    const METRICAS_DEFAULT = {
        risco: true,
        critico: true,
        alto: true,
        ativos: true,
        volume: false,
        logs: false,
    };

    const [metricasVisiveis, setMetricasVisiveis] = useState(METRICAS_DEFAULT);

    const toggleTenant = (tenant: string) => {
        setTenantsSelecionados(prev =>
            prev.includes(tenant)
                ? prev.filter(t => t !== tenant)
                : [...prev, tenant]
        );
    };

    const tenantsFiltrados = dadosTenants.filter(t =>
        tenantsSelecionados.includes(t.nome)
    );

    function salvarMetricas() {
        localStorage.setItem(
            "multiTenant_metricas",
            JSON.stringify(metricasVisiveis)
        );
        setModalAberto(false);
    }

    const gerarGrid = () => {
        return `
            1.5fr
            ${metricasVisiveis.risco ? "1fr" : ""}
            ${metricasVisiveis.critico ? "1fr" : ""}
            ${metricasVisiveis.alto ? "1fr" : ""}
            ${metricasVisiveis.ativos ? "1fr" : ""}
            ${metricasVisiveis.volume ? "1fr" : ""}
            ${metricasVisiveis.logs ? "1fr" : ""}
        `;
    };

    const C_GREEN = "#1DD69A";
    const C_BLUE = "#6366F1";
    const C_PURP = "#A855F7";
    const C_PINK = "#F914AD";

    function corPorValor(valor: number) {
        if (valor <= 25) return C_GREEN;
        if (valor <= 50) return C_BLUE;
        if (valor <= 75) return C_PURP;
        return C_PINK;
    }

    function labelPorValor(valor: number) {
        if (valor <= 25) return "Risco Baixo";
        if (valor <= 50) return "Risco Médio";
        if (valor <= 75) return "Risco Alto";
        return "Risco Crítico";
    }

    useEffect(() => {
        async function carregarSummary() {
            try {
                setLoading(true);
                const summary = await getAdminSummary();

                const formatado = summary.map(t => ({
                    tenantId: t.tenantId,
                    nome: t.organizacao,
                    risco: t.risco,
                    incidentes_critico: t.incidentes_critico,
                    incidentes_alto: t.incidentes_alto,
                    ativos: t.ativos,
                    volume: t.volume_gb,
                    logs: t.logs,
                }));

                setDadosTenants(formatado);

            } catch (err) {
                console.error("Erro ao buscar summary:", err);
            } finally {
                setLoading(false);
            }
        }

        carregarSummary();
    }, []);

    useEffect(() => {
        const salvo = localStorage.getItem("multiTenant_metricas");
        if (salvo) setMetricasVisiveis(JSON.parse(salvo));
    }, []);



    return (
        <LayoutModel titulo="Gestão Multi-Tenant">
            <div className="space-y-6">

                {/* SECTION TENANTS */}
                <section
                    className="relative border border-[#2A1F40] rounded-2xl p-6 overflow-hidden min-w-0"
                    style={{
                        background:
                            "linear-gradient(82deg, rgba(22,17,37,1) 0%, rgba(34,14,84,1) 17%, rgba(39,6,117,1) 31%, rgba(48,8,140,1) 42%, rgba(39,13,103,1) 52%, rgba(22,17,37,1) 100%)"
                    }}
                >
                    <h3 className="text-white text-sm mb-6">
                        Selecione os Tenants para Visualizar
                    </h3>

                    {loading ? (
                        <div className="text-gray-400 text-sm py-6 text-center">
                            Carregando tenants...
                        </div>
                    ) : (
                        <Slider slidesPerView={4.2} spaceBetween={20}>
                            {dadosTenants.map((tenant) => (
                                <div
                                    key={tenant.tenantId ?? tenant.nome}
                                    onClick={() => toggleTenant(tenant.nome)}
                                    className={`relative cursor-pointer bg-[#0D081D] rounded-xl p-5 overflow-hidden transition-all border`}
                                    style={(() => {
                                        const risco = Math.round(Number(tenant?.risco ?? 0));
                                        const cor = corPorValor(risco);
                                        const selecionado = tenantsSelecionados.includes(tenant.nome);

                                        return {
                                            borderColor: selecionado ? cor : "#2A1F40",
                                            boxShadow: selecionado ? `0 0 20px ${cor}40` : undefined
                                        };
                                    })()}
                                    onMouseEnter={(e) => {
                                        if (!tenantsSelecionados.includes(tenant.nome)) {
                                            const risco = Math.round(Number(tenant?.risco ?? 0));
                                            const cor = corPorValor(risco);
                                            e.currentTarget.style.borderColor = cor;
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!tenantsSelecionados.includes(tenant.nome)) {
                                            e.currentTarget.style.borderColor = "#2A1F40";
                                        }
                                    }}
                                >
                                    <div className="absolute inset-0 bg-purple-600/10 blur-2xl opacity-40" />

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#161125] border border-[#2A1F40] rounded-lg flex items-center justify-center text-purple-400">
                                                    {/* @ts-ignore */}
                                                    <LuBuilding2 className="text-[#744CD8] text-lg" />
                                                </div>
                                                <h4 className="text-white font-medium">
                                                    {tenant.nome}
                                                </h4>
                                            </div>

                                            <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all
                                                    ${tenantsSelecionados.includes(tenant.nome)
                                                        ? "bg-purple-600 text-white"
                                                        : "border border-[#3B2A70] text-transparent"
                                                    }`}
                                            >
                                                ✓
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            {(() => {
                                                const risco = Math.round(Number(tenant?.risco ?? 0));
                                                const cor = corPorValor(risco);
                                                const label = labelPorValor(risco);

                                                return (
                                                    <div className="flex items-center justify-between">
                                                        {/* BADGE À ESQUERDA */}
                                                        <div
                                                            className="px-3 py-1 rounded-full text-xs font-medium"
                                                            style={{
                                                                backgroundColor: `${cor}20`,
                                                                color: cor,
                                                                border: `1px solid ${cor}40`
                                                            }}
                                                        >
                                                            {risco}% {label}
                                                        </div>
                                                        {/* DONUT À DIREITA */}
                                                        <div className="relative w-[65px] h-[65px]">
                                                            <GraficoDonutSimples
                                                                labels={["Risco", "Restante"]}
                                                                series={[risco, 100 - risco]}
                                                                cores={[cor, "#1D1929"]}
                                                                height={65}
                                                            />
                                                            <div
                                                                className="absolute inset-0 flex items-center justify-center text-xs font-semibold"
                                                                style={{ color: cor }}
                                                            >
                                                                {risco}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className="mt-6 h-12 relative"></div>
                                    </div>

                                    {/* ONDA DECORATIVA */}
                                    {(() => {
                                        const risco = Math.round(Number(tenant?.risco ?? 0));
                                        const cor = corPorValor(risco);
                                        const gradientId = `waveGradient-${tenant.tenantId}`;

                                        return (
                                            <div className="absolute bottom-0 left-0 w-full pointer-events-none">
                                                <svg
                                                    viewBox="0 0 500 120"
                                                    preserveAspectRatio="none"
                                                    className="w-full h-20"
                                                >
                                                    <defs>
                                                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                                                            <stop offset="0%" stopColor={cor} stopOpacity="0.6" />
                                                            <stop offset="50%" stopColor={cor} stopOpacity="0.4" />
                                                            <stop offset="100%" stopColor={cor} stopOpacity="0.2" />
                                                        </linearGradient>
                                                    </defs>

                                                    <path
                                                        d="M0,60 C150,120 350,0 500,60 L500,120 L0,120 Z"
                                                        fill={`url(#${gradientId})`}
                                                    />

                                                    {/* LINHA SUPERIOR */}
                                                    <path
                                                        d="M0,60 C150,120 350,0 500,60"
                                                        fill="none"
                                                        stroke={cor}
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        style={{
                                                            filter: `drop-shadow(0px 0px 4px ${cor})`
                                                        }}
                                                    />
                                                </svg>
                                            </div>
                                        );
                                    })()}
                                </div>
                            ))}

                        </Slider>
                    )}
                    <div className="flex items-center justify-between text-[10px] mt-5 text-gray-400 w-full">
                        <div className="flex gap-3 flex-wrap">
                            <span className="flex items-center gap-1 text-xs text-white">
                                Legenda nível de risco:
                            </span>
                            <span className="flex items-center gap-1 text-xs">
                                <span className="w-3 h-3 bg-[#1DD69A] rounded-xs"></span> Baixo
                            </span>
                            <span className="flex items-center gap-1 text-xs">
                                <span className="w-3 h-3 bg-[#6366F1] rounded-xs"></span> Médio
                            </span>
                            <span className="flex items-center gap-1 text-xs">
                                <span className="w-3 h-3 bg-[#A855F7] rounded-xs"></span> Alto
                            </span>
                            <span className="flex items-center gap-1 text-xs">
                                <span className="w-3 h-3 bg-[#F914AD] rounded-xs"></span> Crítico
                            </span>
                        </div>
                    </div>
                </section>

                {/* BOTÃO */}
                <div className="flex justify-end items-center gap-4 p-2">
                    <button
                        onClick={() => setModalAberto(true)}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 transition px-4 py-2 rounded-md text-xs text-white"
                    >
                        {/* @ts-ignore */}
                        <TbAdjustmentsHorizontal className="text-sm" />
                        Customizar Métricas
                    </button>
                </div>

                {/* TABELA */}
                <div className="cards rounded-2xl overflow-hidden border border-[#1D1929]">

                    {/* HEADER */}
                    <div
                        className="grid px-5 py-5 bg-[#0A0617] text-xs text-gray-300"
                        style={{ gridTemplateColumns: gerarGrid() }}
                    >
                        <div className="border-[#1D1929] border-r-2">
                            <div className="flex items-center justify-center gap-1">Tenant</div>
                        </div>

                        {metricasVisiveis.risco && (
                            <div className="border-[#1D1929] border-r-2">
                                <div className="flex items-center justify-center gap-1">
                                    Índice de Risco
                                    {/* @ts-ignore */}
                                    <TbAntennaBars5 className="text-[#744CD8] text-lg" />
                                </div>
                            </div>
                        )}

                        {metricasVisiveis.critico && (
                            <div className="border-[#1D1929] border-r-2">
                                <div className="flex items-center justify-center gap-1">
                                    Incidentes
                                    <span className="text-pink-500 badge-pink badge rounded-md py-0.5 px-2">
                                        Crítico
                                    </span>
                                </div>
                            </div>
                        )}

                        {metricasVisiveis.alto && (
                            <div className="border-[#1D1929] border-r-2">
                                <div className="flex items-center justify-center gap-1">
                                    Incidentes
                                    <span className="text-[#A855F7] badge-high badge rounded-md py-0.5 px-3">
                                        Alto
                                    </span>
                                </div>
                            </div>
                        )}

                        {metricasVisiveis.ativos && (
                            <div className="border-[#1D1929] border-r-2">
                                <div className="flex items-center justify-center gap-1">
                                    Total de Ativos
                                    {/* @ts-ignore */}
                                    <GoShieldCheck className="text-[#744CD8] text-lg" />
                                </div>
                            </div>
                        )}

                        {metricasVisiveis.volume && (
                            <div className="border-[#1D1929] border-r-2">
                                <div className="flex items-center justify-center gap-1">
                                    Volume (GB)
                                    {/* @ts-ignore */}
                                    <GoDatabase className="text-[#744CD8] text-lg" />
                                </div>
                            </div>
                        )}

                        {metricasVisiveis.logs && (
                            <div>
                                <div className="flex items-center justify-center gap-1">
                                    Firewalls sem logs (2h)
                                    {/* @ts-ignore */}
                                    <LuMessageSquareText className="text-[#744CD8] text-lg" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* LINHAS */}
                    <div className="divide-y divide-[#ffffff12]">

                        {tenantsSelecionados.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                Nenhuma organização selecionada.
                            </div>
                        ) : (
                            tenantsFiltrados.map((tenant) => (
                                <div
                                    key={tenant.nome}
                                    className="grid px-5 py-4 items-center hover:bg-[#ffffff07] transition-colors"
                                    style={{ gridTemplateColumns: gerarGrid() }}
                                >
                                    <div className="text-center text-sm text-white flex items-center justify-center gap-2">
                                        {/* @ts-ignore */}
                                        <LuBuilding2 className="text-[#744CD8] text-lg" />
                                        {tenant.nome}
                                    </div>

                                    {metricasVisiveis.risco && (
                                        <div className="flex items-center justify-center">
                                            <div className="relative w-[60px] h-[60px]">

                                                {(() => {
                                                    const risco = Math.round(Number(tenant?.risco ?? 0));
                                                    const cor = corPorValor(risco);

                                                    return (
                                                        <>
                                                            <GraficoDonutSimples
                                                                labels={["Risco", "Restante"]}
                                                                series={[risco, 100 - risco]}
                                                                cores={[cor, "#1D1929"]}
                                                                height={60}
                                                            />

                                                            <div
                                                                className="absolute inset-0 flex items-center justify-center text-xs font-semibold"
                                                                style={{ color: cor }}
                                                            >
                                                                {risco}%
                                                            </div>
                                                        </>
                                                    );
                                                })()}

                                            </div>
                                        </div>
                                    )}

                                    {metricasVisiveis.critico && (
                                        <div className="text-center text-white text-[15px]">
                                            {tenant.incidentes_critico}
                                        </div>
                                    )}

                                    {metricasVisiveis.alto && (
                                        <div className="text-center text-white text-[15px]">
                                            {tenant.incidentes_alto}
                                        </div>
                                    )}

                                    {metricasVisiveis.ativos && (
                                        <div className="text-center text-white text-[15px]">
                                            {tenant.ativos}
                                        </div>
                                    )}

                                    {metricasVisiveis.volume && (
                                        <div className="text-center text-white text-[15px]">
                                            {tenant.volume} GB
                                        </div>
                                    )}

                                    {metricasVisiveis.logs && (
                                        <div className="text-center text-white text-[15px]">
                                            {tenant.logs}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}

                    </div>
                </div>
            </div>

            {/* MODAL */}
            {modalAberto && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="w-[420px] bg-[#161125] border border-[#2A1F40] rounded-2xl p-6 space-y-4">

                        <div>
                            <h3 className="text-white text-sm font-semibold">
                                Customizar Métricas
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">
                                Selecione as métricas que deseja visualizar na tabela
                            </p>
                        </div>

                        <div className="space-y-3">
                            {[
                                { key: "risco", label: "Nível de Risco" },
                                { key: "critico", label: "Incidentes Abertos (Críticos)" },
                                { key: "alto", label: "Incidentes Abertos (Altos)" },
                                { key: "ativos", label: "Total de Ativos" },
                                { key: "volume", label: "Volume de Logs (GB)" },
                                { key: "logs", label: "Sem receber logs (2h)" },
                            ].map((item) => (
                                <label
                                    key={item.key}
                                    className="flex items-center justify-between bg-[#0D081D] px-4 py-3 rounded-lg border border-[#2A1F40] cursor-pointer hover:border-purple-500 transition"
                                >
                                    <span className="text-sm text-white">
                                        {item.label}
                                    </span>

                                    <input
                                        type="checkbox"
                                        checked={metricasVisiveis[item.key as keyof typeof metricasVisiveis]}
                                        onChange={() =>
                                            setMetricasVisiveis(prev => ({
                                                ...prev,
                                                [item.key]: !prev[item.key as keyof typeof prev]
                                            }))
                                        }
                                        className="accent-purple-600"
                                    />
                                </label>
                            ))}
                        </div>

                        <div className="flex justify-between items-center pt-4">
                            <button
                                onClick={() => setMetricasVisiveis(METRICAS_DEFAULT)}
                                className="text-xs text-gray-400 hover:text-white"
                            >
                                Resetar
                            </button>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setModalAberto(false)}
                                    className="text-xs text-gray-400 hover:text-white"
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={salvarMetricas}
                                    className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md text-xs text-white"
                                >
                                    Salvar Visualização
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}

        </LayoutModel>
    );
}