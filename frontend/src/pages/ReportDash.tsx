import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { createPortal } from "react-dom";

import LayoutModel from "../componentes/LayoutModel";
import { FiSearch, FiDownload } from "react-icons/fi";

export default function ReportDash() {
    const [horas, setHoras] = useState("24h");
    const [openSecoes, setOpenSecoes] = useState(false);
    const navigate = useNavigate();
    const usados = 0;

    // cria um portal no body para dropdown
    const portalRoot = typeof window !== "undefined" ? document.body : null;

    return (
        <LayoutModel titulo="Relatórios">

            {/* ========================  BARRA SUPERIOR  ======================== */}
            <div className="cards rounded-2xl p-6 mb-6 border border-white/5 shadow-lg relative">

                {/* SUBTÍTULO */}
                <h2 className="text-white text-[15px]">Relatórios</h2>
                <p className="text-gray-400 text-sm mb-4">
                    Gere, visualize e exporte análises completas do ambiente de segurança.
                </p>

                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

                    {/* =======================  LADO ESQUERDO  ======================= */}
                    <div className="flex flex-col xl:flex-row gap-4">

                        {/* ÍCONE + SELECT DE DATAS */}
                        <div className="flex items-center gap-2">

                            <div className="w-10 h-10 bg-[#0A0617] border border-white/10 rounded-xl flex items-center justify-center">
                                <span className="text-white text-lg">📅</span>
                            </div>

                            <div className="relative">
                                <select
                                    className="
                                        bg-[#0A0617]
                                        border border-white/10
                                        text-white
                                        rounded-xl
                                        px-4 py-2
                                        pr-10
                                        w-36
                                        appearance-none
                                        cursor-pointer
                                    "
                                    value={horas}
                                    onChange={(e) => setHoras(e.target.value)}
                                >
                                    <option value="24h">24 horas</option>
                                    <option value="hoje">Hoje</option>
                                    <option value="7d">7 dias</option>
                                    <option value="15d">15 dias</option>
                                    <option value="30d">30 dias</option>
                                </select>

                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
                                    ▼
                                </span>
                            </div>
                        </div>

                        {/* SELECT DE SEÇÕES VIA PORTAL (SEM CLIPPING) */}
                        <div className="relative">
                            <button
                                onClick={() => setOpenSecoes(!openSecoes)}
                                className="
                                    bg-[#0A0617]
                                    border border-white/10
                                    text-white
                                    rounded-xl
                                    px-4 py-2
                                    pr-10
                                    w-[300px]
                                    text-left
                                    cursor-pointer
                                "
                            >
                                Selecionar Seções do Relatório
                            </button>

                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
                                ▼
                            </span>

                            {openSecoes && portalRoot &&
                                createPortal(
                                    <div
                                        className="
                                            fixed
                                            z-[999999]
                                            bg-[#0A0617]
                                            border border-white/10
                                            rounded-xl
                                            shadow-xl
                                            p-4
                                            text-sm
                                            max-h-[500px]
                                            overflow-y-auto
                                        "
                                        style={{
                                            top: "220px",
                                            left: "325px",
                                            width: "380px"
                                        }}
                                    >
                                        {[
                                            "Nível de Risco",
                                            "Vulnerabilidades Detectadas",
                                            "Top Hosts por Volume de Alertas",
                                            "Segurança dos Servidores (CIS Score)",
                                            "Integridade de Arquivos",
                                            "Top Sistemas Operacionais Vulneráveis",
                                            "Top Usuários",
                                            "Distribuição de Ações (FIM)",
                                            "Top Acessos (URLs)",
                                            "Top Aplicações",
                                            "Top Categorias",
                                            "Top Usuários por Uso de Aplicações",
                                            "Top Acesso Detalhado",
                                        ].map((item, idx) => (
                                            <label
                                                key={idx}
                                                className="flex items-center gap-3 py-2 cursor-pointer text-gray-300"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded border-gray-600 bg-transparent"
                                                />
                                                <span>{item}</span>
                                            </label>
                                        ))}
                                    </div>,
                                    portalRoot
                                )
                            }
                        </div>
                    </div>

                    {/* =======================  BOTÃO  ======================= */}
                    <div>
                        <button className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-xl text-white transition-all">
                            Gerar relatório →
                        </button>
                    </div>

                </div>
            </div>

            {/* ===========================  CONTEÚDO CENTRAL  =========================== */}
            <div className="cards rounded-2xl p-6 border border-white/5">

                {/* SIMULAÇÃO: relatório fictício */}
                {true ? (
                    <>

                        {/* CABEÇALHO */}
                        <div className="bg-[#0A0617] grid grid-cols-5 text-gray-300 text-sm border border-white/10 rounded-xl px-4 py-3 mb-3">
                            <span>Nome</span>
                            <span>Período</span>
                            <span>Gerado em</span>
                            <span>Organização</span>
                            <span className="text-right mr-6">Ações</span>
                        </div>

                        {/* LINHA */}
                        <div className=" border border-white/5 rounded-xl px-4 py-4 grid grid-cols-5 items-center">

                            <div className="text-gray-300">
                                relatório_01_08112025
                            </div>

                            <div className="text-gray-300">
                                28/11/2025 – 02/12/2025
                            </div>

                            <div className="text-gray-300">
                                28/11/25 08:55
                            </div>

                            <div className="text-gray-300">
                                ---
                            </div>

                            {/* AÇÕES */}
                            <div className="flex justify-end gap-3">

                                {/* VISUALIZAR */}
                                <button
                                    onClick={() => navigate("/report-view")}
                                    className="
                                        flex items-center gap-2
                                        border border-purple-500/40
                                        hover:bg-purple-500/10
                                        text-purple-400 
                                        px-3 py-2 rounded-lg text-sm transition
                                    "
                                >
                                    {/* @ts-ignore */}
                                    <FiSearch className="text-purple-400 text-lg" />
                                    Visualizar
                                </button>

                                {/* DOWNLOAD */}
                                {/* <button
                                    className="
                        flex items-center gap-2
                        border border-purple-500/40
                        hover:bg-purple-500/10
                        text-purple-400
                        px-3 py-2 rounded-lg text-sm transition
                    "
                                >
                                    <FiDownload className="text-purple-400 text-lg" />
                                    Download PDF
                                </button> */}

                            </div>

                        </div>
                    </>
                ) : (
                    // MENSAGEM QUANDO NÃO EXISTEM RELATÓRIOS
                    <div className="h-[50vh] flex items-center justify-center text-gray-300">
                        <div className="text-center">
                            <h2 className="text-lg mb-2">Nenhum relatório criado</h2>
                            <p className="text-sm">Use os filtros acima para gerar ou visualizar um relatório.</p>
                        </div>
                    </div>
                )}

            </div>


        </LayoutModel>
    );
}
