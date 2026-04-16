import { useEffect, useState } from "react";
import LayoutModel from "../componentes/LayoutModel";
import { IoIosLock } from "react-icons/io";

import LLMConfigPanel from "../componentes/chat/LLMConfigPanel";
import {
    ProviderType,
    LLMPurpose,
    LLMConfigResponse,
    getLLMConfig,
    PROVIDERS,
} from "../services/azure-api/llm.service";
import SourceConfigModal from "../componentes/integrations/SourceConfigModal";
import { getSourceInstances } from "../services/integrations/source.service";
import { useAuth } from "../context/AuthContext";
import { useScreenContext } from "../context/ScreenContext";

/* =======================
   TIPOS
======================= */
type AbaIntegracao =
    | "NG-SOC"
    | "Firewall"
    | "Monitoria"
    | "Defesa de Endpoints (EDR/XDR)"
    | "Proteção de Dados"
    | "CSIRT"
    | "Vulnerabilidades"
    | "IAM";

const abasLiberadas: AbaIntegracao[] = [
    "NG-SOC",
    "Firewall",
    "Monitoria",
    "Defesa de Endpoints (EDR/XDR)",
];

// ─── Mapeamento IA → ProviderType ─────────────────────────────────────────────
const IA_PROVIDERS: { img: string; label: string; value: ProviderType }[] = [
    { img: "/assets/img/openai.png", label: "OpenAI", value: 0 },
    { img: "/assets/img/deepseek.png", label: "DeepSeek", value: 2 },
    { img: "/assets/img/gemini.png", label: "Gemini", value: 4 },
    { img: "/assets/img/copilot.png", label: "Azure Foundry", value: 1 },
];

export default function Integrations() {
    const [abaAtiva, setAbaAtiva] = useState<AbaIntegracao>("NG-SOC");

    // ── Estado do painel de IA ─────────────────────────────────────────────────
    const [painelIA, setPainelIA] = useState<{
        aberto: boolean;
        provider: ProviderType;
    }>({ aberto: false, provider: 0 });

    // ── Estado da config LLM por finalidade ───────────────────────────────────
    const [llmConfig, setLlmConfig] = useState<LLMConfigResponse>({
        chat: null,
        analysis: null,
    });
    const [iaTab, setIaTab] = useState<LLMPurpose>("chat");

    // ── Dialog de confirmacao ─────────────────────────────────────────────────
    const [confirmDialog, setConfirmDialog] = useState<{
        aberto: boolean;
        providerNovo: ProviderType;
        providerAtualLabel: string;
        providerNovoLabel: string;
    } | null>(null);

    // ── Carregar config LLM ao montar ─────────────────────────────────────────
    useEffect(() => {
        getLLMConfig()
            .then(setLlmConfig)
            .catch(() => setLlmConfig({ chat: null, analysis: null }));
    }, []);

    function abrirPainelIA(provider: ProviderType) {
        const configAtual = llmConfig[iaTab];
        // Sem config ativa ou clicou no mesmo provedor → abre direto
        if (!configAtual || configAtual.providerType === provider) {
            setPainelIA({ aberto: true, provider });
            return;
        }
        // Tem config ativa e clicou em outro → dialog de confirmacao
        const atualLabel = PROVIDERS.find((p) => p.value === configAtual.providerType)?.label ?? "";
        const novoLabel = PROVIDERS.find((p) => p.value === provider)?.label ?? "";
        setConfirmDialog({
            aberto: true,
            providerNovo: provider,
            providerAtualLabel: atualLabel,
            providerNovoLabel: novoLabel,
        });
    }

    function fecharPainelIA() {
        setPainelIA((prev) => ({ ...prev, aberto: false }));
    }

    function handleLLMSaved() {
        // Recarrega config do backend para ter id e dados atualizados
        getLLMConfig()
            .then(setLlmConfig)
            .catch(() => {});
    }

    return (
        <LayoutModel titulo="Integrações">

            {/* ================= HEADER ================= */}
            <section
                className="relative p-8 rounded-2xl mb-8 overflow-hidden"
                style={{
                    background:
                        "linear-gradient(90deg, rgba(77, 46, 148, 1) 0%, rgba(52, 11, 139, 1) 39%, rgba(85, 9, 138, 1) 76%, rgba(27, 14, 54, 1) 100%)",
                }}
            >
                <div className="absolute right-[-140px] top-1/2 -translate-y-1/2 opacity-80 pointer-events-none">
                    <img src="/assets/img/circle_integration.webp" className="w-[460px] md:w-[560px] lg:w-[640px]" />
                </div>
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-white text-3xl font-semibold mb-3">
                        Integrações que conectam todo o seu ecossistema de segurança
                    </h1>
                    <p className="text-gray-300 text-sm leading-relaxed">
                        Integrações nativas com as principais soluções de segurança para
                        centralizar eventos, automatizar respostas e operar o SOC em tempo real.
                    </p>
                </div>
            </section>

            {/* ================= ABAS ================= */}
            <section className="flex flex-wrap gap-3 mb-10">
                {([
                    "NG-SOC", "Firewall", "Monitoria",
                    "Defesa de Endpoints (EDR/XDR)", "Proteção de Dados",
                    "CSIRT", "Vulnerabilidades", "IAM",
                ] as AbaIntegracao[]).map((aba) => {
                    const isAtiva = aba === abaAtiva;
                    const isLiberada = abasLiberadas.includes(aba);
                    return (
                        <button
                            key={aba}
                            onClick={() => isLiberada && setAbaAtiva(aba)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all
                                ${isAtiva
                                    ? "bg-[#1b1b2b] hover:bg-[#744CD8] text-white"
                                    : isLiberada
                                        ? "bg-[#1b1b2b] text-gray-300 hover:bg-[#744CD8]"
                                        : "bg-[#1b1b2b] text-gray-300 cursor-default"
                                }`}
                        >
                            {/* @ts-ignore */}
                            <IoIosLock className="w-4 h-4 text-white" />
                            <span>{aba}</span>
                        </button>
                    );
                })}
            </section>

            {/* ================= CONTEÚDO ================= */}
            <section className="flex flex-col gap-12">
                {abaAtiva === "NG-SOC" && (
                    <NgSocContent
                        onConfigIA={abrirPainelIA}
                        iaTab={iaTab}
                        setIaTab={setIaTab}
                        llmConfig={llmConfig}
                    />
                )}
                {abaAtiva === "Firewall" && <FirewallContent />}
                {abaAtiva === "Monitoria" && <MonitoriaContent />}
                {abaAtiva === "Defesa de Endpoints (EDR/XDR)" && <EndpointsContent />}
            </section>

            {/* ================= PAINEL IA ================= */}
            {painelIA.aberto && (
                <LLMConfigPanel
                    providerInicial={painelIA.provider}
                    purpose={iaTab}
                    configId={llmConfig[iaTab]?.id ?? null}
                    onClose={fecharPainelIA}
                    onSaved={handleLLMSaved}
                />
            )}

            {/* ================= DIALOG CONFIRMACAO ================= */}
            {confirmDialog?.aberto && (
                <>
                    <div
                        className="fixed inset-0 bg-black/60 z-40"
                        onClick={() => setConfirmDialog(null)}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div className="bg-[#1a1a2e] border border-[#2d2d44] rounded-xl p-6 max-w-sm text-center shadow-2xl">
                            <p className="text-2xl mb-3">⚠️</p>
                            <h3 className="text-white text-sm font-medium mb-2">
                                Substituir provedor?
                            </h3>
                            <p className="text-gray-400 text-xs leading-relaxed mb-5">
                                Voce ja tem{" "}
                                <span className="text-white font-medium">
                                    {confirmDialog.providerAtualLabel}
                                </span>{" "}
                                configurado para{" "}
                                <span className="text-purple-400 font-medium">
                                    {iaTab === "chat" ? "Chat" : "Analitico"}
                                </span>
                                . Deseja substituir por{" "}
                                <span className="text-white font-medium">
                                    {confirmDialog.providerNovoLabel}
                                </span>
                                ?
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setConfirmDialog(null)}
                                    className="px-5 py-2 rounded-lg border border-[#2d2d44] text-gray-400 text-xs hover:bg-white/5 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        setPainelIA({ aberto: true, provider: confirmDialog.providerNovo });
                                        setConfirmDialog(null);
                                    }}
                                    className="px-5 py-2 rounded-lg bg-[#7c3aed] text-white text-xs font-medium hover:bg-[#6d28d9] transition"
                                >
                                    Continuar
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

        </LayoutModel>
    );
}

/* =====================================================
   NG-SOC — cards de IA clicáveis
===================================================== */

function NgSocContent({
    onConfigIA,
    iaTab,
    setIaTab,
    llmConfig,
}: {
    onConfigIA: (provider: ProviderType) => void;
    iaTab: LLMPurpose;
    setIaTab: (tab: LLMPurpose) => void;
    llmConfig: LLMConfigResponse;
}) {
    const { user } = useAuth();
    const isAdmin = user?.user_role?.slug === "admin";
    const [modalOpen, setModalOpen] = useState(false);
    const [modalProduct, setModalProduct] = useState({ product: "", vendor: "" });
    const [activeCountMap, setActiveCountMap] = useState<Record<string, number>>({});
    const { setScreenData } = useScreenContext();

    useEffect(() => {
        async function loadCounts() {
            try {
                const wazuhInstances = await getSourceInstances("Wazuh");
                setActiveCountMap((prev) => ({
                    ...prev,
                    Wazuh: wazuhInstances.filter((i) => i.active).length,
                }));
            } catch {
                // silent
            }
        }
        loadCounts();
    }, []);

    useEffect(() => {
        const totalAtivos = Object.values(activeCountMap).reduce((acc, n) => acc + n, 0);
        setScreenData("integrations-ngsoc", {
            activeTab: "NG-SOC",
            sections: ["SIEM", "SOAR", "DFIR", "Inteligencia Artificial"],
            activeIntegrations: activeCountMap,
            totalAtivos,
            llmChat: llmConfig.chat
                ? { provider: PROVIDERS.find((p) => p.value === llmConfig.chat!.providerType)?.label ?? null, model: llmConfig.chat.model }
                : null,
            llmAnalysis: llmConfig.analysis
                ? { provider: PROVIDERS.find((p) => p.value === llmConfig.analysis!.providerType)?.label ?? null, model: llmConfig.analysis.model }
                : null,
        });
    }, [activeCountMap, llmConfig]);

    function openModal(product: string, vendor: string) {
        if (!isAdmin) return;
        setModalProduct({ product, vendor });
        setModalOpen(true);
    }

    async function handleModalClose() {
        setModalOpen(false);
        try {
            const wazuhInstances = await getSourceInstances("Wazuh");
            setActiveCountMap((prev) => ({
                ...prev,
                Wazuh: wazuhInstances.filter((i) => i.active).length,
            }));
        } catch {
            // silent
        }
    }

    return (
        <section className="flex flex-col gap-5">

            {/* SIEM — inalterado */}
            <div>
                <h2 className="text-white text-2xl mb-5">NG-SOC</h2>
                <h3 className="text-white text-xl mb-3">SIEM</h3>
                <div className="grid grid-cols-1 md:grid-cols-3">
                    <div
                        onClick={isAdmin ? () => openModal("Wazuh", "Wazuh") : undefined}
                        className={`bg-[#0F0B1C] h-[140px] rounded-l-lg flex items-center justify-center border border-[#2B2736] relative ${isAdmin ? "cursor-pointer hover:border-purple-600/50 transition-colors" : ""}`}
                    >
                        <img src="/assets/img/wazuh.png" />
                        {(activeCountMap["Wazuh"] ?? 0) > 0 && (
                            <div className="absolute top-2 right-2 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                <span className="text-[10px] text-gray-400">{activeCountMap["Wazuh"]} ativa{activeCountMap["Wazuh"] !== 1 ? "s" : ""}</span>
                            </div>
                        )}
                    </div>
                    <div className="bg-[#0F0B1C] h-[140px] flex items-center justify-center border-y border-[#2B2736]">
                        <img src="/assets/img/fortsiem.png" />
                    </div>
                    <div className="bg-[#0F0B1C] h-[140px] rounded-r-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/splunk.png" />
                    </div>
                </div>
            </div>

            {/* SOAR — inalterado */}
            <div>
                <h3 className="text-white text-xl mb-3">SOAR</h3>
                <div className="grid grid-cols-1 md:grid-cols-3">
                    <div className="bg-[#0F0B1C] h-[140px] rounded-l-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/fortsoar.png" />
                    </div>
                    <div className="bg-[#0F0B1C] h-[140px] flex items-center justify-center border-y border-[#2B2736]">
                        <img src="/assets/img/n8n.png" />
                    </div>
                    <div className="bg-[#0F0B1C] h-[140px] rounded-r-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/shuffle.png" />
                    </div>
                </div>
            </div>

            {/* DFIR — inalterado */}
            <div>
                <h3 className="text-white text-xl mb-3">DFIR</h3>
                <div className="grid grid-cols-1 md:grid-cols-3">
                    <div className="bg-[#0F0B1C] h-[140px] rounded-l-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/iris.png" />
                    </div>
                    <div className="bg-[#0F0B1C] h-[140px] flex items-center justify-center border-y border-[#2B2736]">
                        <img src="/assets/img/service_now.png" />
                    </div>
                    <div className="bg-[#0F0B1C] h-[140px] rounded-r-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/fresh-desk.png" />
                    </div>
                </div>
            </div>

            {/* IA — tabs + cards clicáveis */}
            <div>
                <div className="flex items-center gap-4 mb-3">
                    <h3 className="text-white text-xl">Inteligencia Artificial</h3>
                    <div className="flex gap-1 bg-[#1a1a2e] rounded-lg p-1">
                        <button
                            onClick={() => setIaTab("chat")}
                            className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${
                                iaTab === "chat"
                                    ? "bg-[#7c3aed] text-white"
                                    : "text-gray-500 hover:text-gray-300"
                            }`}
                        >
                            Chat
                        </button>
                        <button
                            onClick={() => setIaTab("analysis")}
                            className={`px-4 py-1.5 rounded-md text-xs font-medium transition ${
                                iaTab === "analysis"
                                    ? "bg-[#7c3aed] text-white"
                                    : "text-gray-500 hover:text-gray-300"
                            }`}
                        >
                            Analitico
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
                    {IA_PROVIDERS.map((ia, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === IA_PROVIDERS.length - 1;
                        const configAtual = llmConfig[iaTab];
                        const isAtivo = configAtual?.providerType === ia.value;

                        return (
                            <button
                                key={ia.value}
                                onClick={() => onConfigIA(ia.value)}
                                className={`
                                    group bg-[#0F0B1C] h-[140px] flex flex-col items-center justify-center
                                    transition-all duration-200
                                    hover:bg-[#4B06DD]/10 hover:border-[#4B06DD]/50
                                    relative overflow-hidden
                                    ${isFirst ? "rounded-l-lg" : ""}
                                    ${isLast ? "rounded-r-lg" : ""}
                                    ${isAtivo
                                        ? "border-2 border-[#7c3aed]"
                                        : "border border-[#2B2736]"
                                    }
                                `}
                            >
                                {/* Badge ATIVO */}
                                {isAtivo && (
                                    <span className="absolute top-2 right-2 bg-[#7c3aed] text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
                                        ATIVO
                                    </span>
                                )}

                                <img
                                    src={ia.img}
                                    className="transition-transform duration-200 group-hover:scale-105"
                                />

                                {/* Status */}
                                {isAtivo && configAtual ? (
                                    <span className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-emerald-400">
                                        ✓ {configAtual.model}
                                    </span>
                                ) : (
                                    <span className="
                                        absolute bottom-3 left-0 right-0 text-center
                                        text-[11px] text-purple-400 opacity-0
                                        group-hover:opacity-100 transition-opacity duration-200
                                    ">
                                        Configurar {ia.label}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <SourceConfigModal
                open={modalOpen}
                onClose={handleModalClose}
                product={modalProduct.product}
                vendor={modalProduct.vendor}
                allowedFetchTypes={["Push"]}
            />
        </section>
    );
}

/* =====================================================
   OUTRAS ABAS (ESQUELETO)
===================================================== */

function FirewallContent() {
    const { user } = useAuth();
    const isAdmin = user?.user_role?.slug === "admin";
    const [modalOpen, setModalOpen] = useState(false);
    const [modalProduct, setModalProduct] = useState({ product: "", vendor: "" });
    const [activeCountMap, setActiveCountMap] = useState<Record<string, number>>({});
    const { setScreenData } = useScreenContext();

    // Load active counts on mount
    useEffect(() => {
        async function loadCounts() {
            try {
                const fortigateInstances = await getSourceInstances("FortiGATE");
                const activeCount = fortigateInstances.filter((i) => i.active).length;
                setActiveCountMap((prev) => ({ ...prev, FortiGATE: activeCount }));
            } catch {
                // silent — badge just won't show
            }
        }
        loadCounts();
    }, []);

    useEffect(() => {
        const totalAtivos = Object.values(activeCountMap).reduce((acc, n) => acc + n, 0);
        setScreenData("integrations-firewall", {
            activeTab: "Firewall",
            visibleProducts: ["Azure Firewall", "FortiGATE", "CheckPoint", "Sophos", "PaloAlto", "Cisco", "SonicWall"],
            activeIntegrations: activeCountMap,
            totalAtivos,
        });
    }, [activeCountMap]);

    function openModal(product: string, vendor: string) {
        if (!isAdmin) return;
        setModalProduct({ product, vendor });
        setModalOpen(true);
    }

    async function handleModalClose() {
        setModalOpen(false);
        // Refresh counts
        try {
            const fortigateInstances = await getSourceInstances("FortiGATE");
            const activeCount = fortigateInstances.filter((i) => i.active).length;
            setActiveCountMap((prev) => ({ ...prev, FortiGATE: activeCount }));
        } catch {
            // silent
        }
    }

    function renderCard(
        imgSrc: string,
        product: string | null,
        vendor: string | null,
        extraClasses: string,
    ) {
        const clickable = isAdmin && product && vendor;
        const count = product ? activeCountMap[product] ?? 0 : 0;
        return (
            <div
                onClick={clickable ? () => openModal(product, vendor!) : undefined}
                className={`bg-[#0F0B1C] h-[140px] flex items-center justify-center border border-[#2B2736] relative ${extraClasses} ${clickable ? "cursor-pointer hover:border-purple-600/50 transition-colors" : ""}`}
            >
                <img src={imgSrc} />
                {product && count > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-[10px] text-gray-400">{count} ativa{count !== 1 ? "s" : ""}</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <section className="flex flex-col gap-5">
            <div>
                <h2 className="text-white text-2xl mb-5">FIREWALL</h2>
                <div className="grid grid-cols-1 md:grid-cols-4">
                    {renderCard("/assets/img/azure.jpg", null, null, "rounded-l-lg")}
                    {renderCard("/assets/img/fortgate.png", "FortiGATE", "Fortinet", "")}
                    {renderCard("/assets/img/checkpoint.png", null, null, "")}
                    {renderCard("/assets/img/sophos.png", null, null, "rounded-r-lg")}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 mt-3">
                    {renderCard("/assets/img/palo-alto.png", null, null, "rounded-l-lg")}
                    {renderCard("/assets/img/cisco.png", null, null, "")}
                    {renderCard("/assets/img/sonic.png", null, null, "rounded-r-lg")}
                </div>
            </div>

            <SourceConfigModal
                open={modalOpen}
                onClose={handleModalClose}
                product={modalProduct.product}
                vendor={modalProduct.vendor}
            />
        </section>
    );
}

function MonitoriaContent() {
    const { setScreenData } = useScreenContext();

    useEffect(() => {
        setScreenData("integrations-monitoria", {
            activeTab: "Monitoria",
            visibleProducts: ["Zabbix", "Nagios", "Datadog"],
            observacao: "Produtos exibidos como catálogo; configuração não disponível nesta versão.",
        });
    }, []);

    return (
        <section className="flex flex-col gap-5">

            <div>
                <h2 className="text-white text-2xl mb-5">MONITORIA</h2>
                <div className="grid grid-cols-3 md:grid-cols-3">
                    <div className="bg-[#0F0B1C] h-[140px] rounded-l-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/zabbix.png" />
                    </div>
                    <div className="bg-[#0F0B1C] h-[140px] flex items-center justify-center border-y border-[#2B2736]">
                        <img src="/assets/img/nagios.png" />
                    </div>
                    <div className="bg-[#0F0B1C] h-[140px] rounded-r-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/datadog.png" />
                    </div>
                </div>
            </div>

        </section>
    );
}

function EndpointsContent() {
    const { user } = useAuth();
    const isAdmin = user?.user_role?.slug === "admin";
    const [modalOpen, setModalOpen] = useState(false);
    const [modalProduct, setModalProduct] = useState({ product: "", vendor: "" });
    const [activeCountMap, setActiveCountMap] = useState<Record<string, number>>({});
    const { setScreenData } = useScreenContext();

    useEffect(() => {
        async function loadCounts() {
            try {
                const trendInstances = await getSourceInstances("Trend Micro");
                setActiveCountMap((prev) => ({
                    ...prev,
                    "Trend Micro": trendInstances.filter((i) => i.active).length,
                }));
            } catch {
                // silent
            }
        }
        loadCounts();
    }, []);

    useEffect(() => {
        const totalAtivos = Object.values(activeCountMap).reduce((acc, n) => acc + n, 0);
        setScreenData("integrations-edr", {
            activeTab: "Defesa de Endpoints (EDR/XDR)",
            visibleProducts: ["CrowdStrike", "Microsoft Sentinel", "Microsoft Defender", "Trend Micro"],
            activeIntegrations: activeCountMap,
            totalAtivos,
        });
    }, [activeCountMap]);

    function openModal(product: string, vendor: string) {
        if (!isAdmin) return;
        setModalProduct({ product, vendor });
        setModalOpen(true);
    }

    async function handleModalClose() {
        setModalOpen(false);
        try {
            const trendInstances = await getSourceInstances("Trend Micro");
            setActiveCountMap((prev) => ({
                ...prev,
                "Trend Micro": trendInstances.filter((i) => i.active).length,
            }));
        } catch {
            // silent
        }
    }

    return (
        <section className="flex flex-col gap-5">

            <div>
                <h2 className="text-white text-2xl mb-5">MONITORIA</h2>
                <div className="grid grid-cols-2 md:grid-cols-2">
                    <div className="bg-[#0F0B1C] h-[140px] rounded-l-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/crowd-strike.png" />
                    </div>
                    <div className="bg-[#0F0B1C] h-[140px] rounded-r-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/sentinel.png" />
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-2 mt-3">
                    <div className="bg-[#0F0B1C] h-[140px] rounded-l-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/defender.png" />
                    </div>
                    <div
                        onClick={isAdmin ? () => openModal("Trend Micro", "Trend Micro") : undefined}
                        className={`bg-[#0F0B1C] h-[140px] rounded-r-lg flex items-center justify-center border border-[#2B2736] relative ${isAdmin ? "cursor-pointer hover:border-purple-600/50 transition-colors" : ""}`}
                    >
                        <img src="/assets/img/trend.png" />
                        {(activeCountMap["Trend Micro"] ?? 0) > 0 && (
                            <div className="absolute top-2 right-2 flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                <span className="text-[10px] text-gray-400">{activeCountMap["Trend Micro"]} ativa{activeCountMap["Trend Micro"] !== 1 ? "s" : ""}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <SourceConfigModal
                open={modalOpen}
                onClose={handleModalClose}
                product={modalProduct.product}
                vendor={modalProduct.vendor}
                allowedFetchTypes={["Push"]}
            />

        </section>
    );
}
