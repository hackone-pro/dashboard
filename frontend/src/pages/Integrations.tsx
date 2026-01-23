import { useState } from "react";
import LayoutModel from "../componentes/LayoutModel";
import { IoIosLock } from "react-icons/io";


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

export default function Integrations() {
    const [abaAtiva, setAbaAtiva] = useState<AbaIntegracao>("NG-SOC");

    return (
        <LayoutModel titulo="Integrações">

            <div className="cards p-6 rounded-2xl">

                {/* ================= HEADER ================= */}
                <section
                    className="relative px-8 rounded-2xl mb-8 overflow-hidden"
                    style={{
                        background:
                            "linear-gradient(90deg, rgba(77, 46, 148, 1) 0%, rgba(52, 11, 139, 1) 39%, rgba(85, 9, 138, 1) 76%, rgba(27, 14, 54, 1) 100%)",
                    }}
                >
                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 items-center gap-6">

                        {/* TEXTO */}
                        <div className="max-w-xl">
                            <h1 className="text-white text-3xl font-semibold mb-3">
                                Integrações que conectam todo o seu ecossistema de segurança
                            </h1>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                Integrações nativas com as principais soluções de segurança para
                                centralizar eventos, automatizar respostas e operar o SOC em tempo real.
                            </p>
                        </div>

                        {/* IMAGEM */}
                        <div className="relative flex justify-center md:justify-end">
                            <img
                                src="/assets/img/circle.png"
                                alt="Integrações de Segurança"
                                className="
                            opacity-90
                            select-none
                            pointer-events-none"
                            />
                        </div>
                    </div>
                </section>

                <div className="bg-[#0A0617] p-6 rounded-lg">
                    {/* ================= ABAS ================= */}
                    <section className="flex flex-wrap gap-3 mb-10">
                        {([
                            "NG-SOC",
                            "Firewall",
                            "Monitoria",
                            "Defesa de Endpoints (EDR/XDR)",
                            "Proteção de Dados",
                            "CSIRT",
                            "Vulnerabilidades",
                            "IAM",
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
                                    {/* ÍCONE */}
                                    {isLiberada ? (
                                        // @ts-ignore
                                        <IoIosLock
                                            className={`w-4 h-4 ${isAtiva ? "text-white" : "text-white"
                                                }`}
                                        />
                                    ) : (
                                        // @ts-ignore
                                        <IoIosLock className="w-4 h-4 text-white" />
                                    )}

                                    <span>{aba}</span>
                                </button>
                            );
                        })}
                    </section>

                    {/* ================= CONTEÚDO ================= */}
                    <section className="flex flex-col gap-12">
                        {abaAtiva === "NG-SOC" && <NgSocContent />}
                        {abaAtiva === "Firewall" && <FirewallContent />}
                        {abaAtiva === "Monitoria" && <MonitoriaContent />}
                        {abaAtiva === "Defesa de Endpoints (EDR/XDR)" && <EndpointsContent />}
                    </section>
                </div>
            </div>
        </LayoutModel>
    );
}

/* =====================================================
   NG-SOC (LAYOUT FINAL)
===================================================== */

function NgSocContent() {
    return (
        <section className="flex flex-col gap-5">

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

            <div>
                <h3 className="text-white text-xl mb-3">Inteligência Artificial</h3>
                <div className="grid grid-cols-1 md:grid-cols-4">
                    <div className="bg-[#0F0B1C] h-[140px] rounded-l-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/openai.png" />
                    </div>
                    <div className="bg-[#0F0B1C] h-[140px] flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/deepseek.png" />
                    </div>
                    <div className="bg-[#0F0B1C] h-[140px] flex items-center justify-center border-y border-[#2B2736]">
                        <img src="/assets/img/gemini.png" />
                    </div>
                    <div className="bg-[#0F0B1C] h-[140px] rounded-r-lg flex items-center justify-center border border-[#2B2736]">
                        <img src="/assets/img/copilot.png" />
                    </div>
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
