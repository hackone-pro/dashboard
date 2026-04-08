import { useState } from "react";
import LayoutModel from "../componentes/LayoutModel";
import { IoIosLock } from "react-icons/io";

import LLMConfigPanel from "../componentes/chat/LLMConfigPanel"; // ← NOVO
import { ProviderType } from "../services/azure-api/llm.service";               // ← NOVO

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

    function abrirPainelIA(provider: ProviderType) {
        setPainelIA({ aberto: true, provider });
    }

    function fecharPainelIA() {
        setPainelIA((prev) => ({ ...prev, aberto: false }));
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
                    <NgSocContent onConfigIA={abrirPainelIA} />
                )}
                {abaAtiva === "Firewall" && <FirewallContent />}
                {abaAtiva === "Monitoria" && <MonitoriaContent />}
                {abaAtiva === "Defesa de Endpoints (EDR/XDR)" && <EndpointsContent />}
            </section>

            {/* ================= PAINEL IA ================= */}
            {painelIA.aberto && (
                <LLMConfigPanel
                    providerInicial={painelIA.provider}
                    tenantId={import.meta.env.VITE_CHAT_CLIENT_ID ?? ""}
                    onClose={fecharPainelIA}
                />
            )}

        </LayoutModel>
    );
}

/* =====================================================
   NG-SOC — cards de IA clicáveis
===================================================== */

function NgSocContent({
    onConfigIA,
}: {
    onConfigIA: (provider: ProviderType) => void;
}) {
    return (
        <section className="flex flex-col gap-5">

            {/* SIEM — inalterado */}
            <div>
                <h2 className="text-white text-2xl mb-5">NG-SOC</h2>
                <h3 className="text-white text-xl mb-3">SIEM</h3>
                <div className="grid grid-cols-1 md:grid-cols-3">
                    <div className="bg-[#0F0B1C] h-[140px] rounded-l-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/wazuh.png" />
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

            {/* IA — cards clicáveis ↓ */}
            <div>
                <h3 className="text-white text-xl mb-3">Inteligência Artificial</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-0">
                    {IA_PROVIDERS.map((ia, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === IA_PROVIDERS.length - 1;
                        return (
                            <button
                                key={ia.value}
                                onClick={() => onConfigIA(ia.value)}
                                className={`
                                    group bg-[#0F0B1C] h-[140px] flex items-center justify-center
                                    border border-[#2B2736] transition-all duration-200
                                    hover:bg-[#4B06DD]/10 hover:border-[#4B06DD]/50
                                    relative overflow-hidden
                                    ${isFirst ? "rounded-l-lg" : ""}
                                    ${isLast ? "rounded-r-lg" : ""}
                                `}
                            >
                                <img
                                    src={ia.img}
                                    className="transition-transform duration-200 group-hover:scale-105"
                                />
                                {/* Tooltip ao hover */}
                                <span className="
                                    absolute bottom-3 left-0 right-0 text-center
                                    text-[11px] text-purple-400 opacity-0
                                    group-hover:opacity-100 transition-opacity duration-200
                                ">
                                    Configurar {ia.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

        </section>
    );
}

/* =====================================================
   OUTRAS ABAS (ESQUELETO)
===================================================== */

function FirewallContent() {
    return (
        <section className="flex flex-col gap-5">

            <div>
                <h2 className="text-white text-2xl mb-5">FIREWALL</h2>
                <div className="grid grid-cols-1 md:grid-cols-4">
                    <div className="bg-[#0F0B1C] h-[140px] rounded-l-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/azure.jpg" />
                    </div>
                    <div className="bg-[#0F0B1C] h-[140px] flex items-center justify-center border-y border-[#2B2736]">
                        <img src="/assets/img/fortgate.png" />
                    </div>
                    <div className="bg-[#0F0B1C] h-[140px] flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/checkpoint.png" />
                    </div>
                    <div className="bg-[#0F0B1C] h-[140px] rounded-r-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/sophos.png" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 mt-3">
                    <div className="bg-[#0F0B1C] h-[140px] rounded-l-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/palo-alto.png" />
                    </div>
                    <div className="bg-[#0F0B1C] h-[140px] flex items-center justify-center border-y border-[#2B2736]">
                        <img src="/assets/img/cisco.png" />
                    </div>
                    <div className="bg-[#0F0B1C] h-[140px] rounded-r-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/sonic.png" />
                    </div>
                </div>
            </div>

        </section>
    );
}

function MonitoriaContent() {
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
                    <div className="bg-[#0F0B1C] h-[140px] rounded-r-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/trend.png" />
                    </div>
                </div>
            </div>

        </section>
    );
}
