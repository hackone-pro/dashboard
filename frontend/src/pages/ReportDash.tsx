import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

import { gerarRelatorio as gerarRelatorioAPI } from "../services/report-entry/report.service";
import { listarRelatorios, deletarRelatorio } from "../services/report-entry/report.service";

import LayoutModel from "../componentes/LayoutModel";
import { FiSearch } from "react-icons/fi";
import { useTenant } from "../context/TenantContext";

import { toastSuccess, toastError } from "../utils/toast";
import Swal from "sweetalert2";



export default function ReportDash() {
    const [horas, setHoras] = useState("24h");
    const [openSecoes, setOpenSecoes] = useState(false);
    const [secoesSelecionadas, setSecoesSelecionadas] = useState<string[]>([]);
    const [relatorios, setRelatorios] = useState<any[]>([]);
    const [gerando, setGerando] = useState(false);
    const [loading, setLoading] = useState(false);
    const [gerandoRelatorio, setGerandoRelatorio] = useState(false);

    const { tenantAtivo } = useTenant();
    const navigate = useNavigate();

    const portalRoot = typeof window !== "undefined" ? document.body : null;

    useEffect(() => {
        async function carregar() {
            if (!tenantAtivo) return;

            try {
                setLoading(true);
                const lista = await listarRelatorios();
                setRelatorios(lista);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        carregar();
    }, [tenantAtivo]);


    // Skeleton de carregamento
    const SkeletonLinha = () => (
        <div className="border border-white/5 rounded-xl px-4 py-4 grid grid-cols-5 items-center animate-pulse mb-2">
            <div className="h-4 bg-[#ffffff15] rounded w-32"></div>
            <div className="h-4 bg-[#ffffff15] rounded w-28"></div>
            <div className="h-4 bg-[#ffffff15] rounded w-24"></div>
            <div className="h-4 bg-[#ffffff15] rounded w-20"></div>
            <div className="flex justify-end">
                <div className="h-8 bg-[#ffffff15] rounded w-24"></div>
            </div>
        </div>
    );

    // Marcar/desmarcar seções
    function toggleSecao(item: string) {
        setSecoesSelecionadas(prev =>
            prev.includes(item)
                ? prev.filter(s => s !== item)
                : [...prev, item]
        );
    }

    // Gerar relatório REAL usando o backend
    async function handleGerarRelatorio() {
        try {
            if (secoesSelecionadas.length === 0) {
                toastError("Selecione ao menos uma seção do relatório.");
                return;
            }

            setGerandoRelatorio(true);

            const secoes = secoesSelecionadas;

            const novoRelatorio = await gerarRelatorioAPI(horas, secoes);

            // adiciona no topo
            setRelatorios(prev => [novoRelatorio, ...prev]);

            toastSuccess("Relatório gerado com sucesso!");

        } catch (error) {
            console.error("Erro ao gerar relatório:", error);
            toastError("Erro ao gerar relatório.");
        } finally {
            setGerandoRelatorio(false);  // 👈 encerra o skeleton do item
        }
    }

    async function handleDelete(id: number, nome: string) {
        const res = await Swal.fire({
            title: "Excluir relatório?",
            html: `Você realmente deseja excluir <b>${nome}</b>?<br>Essa ação não pode ser desfeita.`,
            icon: "warning",
            background: "#0A0617",
            color: "#E5E5E5",
            iconColor: "#A855F7",
            showCancelButton: true,
            confirmButtonText: "Sim, deletar",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#A855F7",
            cancelButtonColor: "#4B5563",
        });

        if (!res.isConfirmed) return;

        try {
            await deletarRelatorio(id);

            // Remove da lista renderizada
            setRelatorios(prev => prev.filter(r => r.id !== id));

            Swal.fire({
                title: "Deletado!",
                text: "O relatório foi removido com sucesso.",
                icon: "success",
                background: "#0A0617",
                color: "#E5E5E5",
                confirmButtonColor: "#7C3AED"
            });

        } catch (err) {
            Swal.fire({
                title: "Erro!",
                text: "Não foi possível excluir o relatório.",
                icon: "error",
                background: "#0A0617",
                color: "#E5E5E5",
                confirmButtonColor: "#7C3AED"
            });
        }
    }


    return (
        <LayoutModel titulo="Relatórios">

            {/* ======================== BARRA SUPERIOR ======================== */}
            <div className="cards rounded-2xl p-6 mb-6 border border-white/5 shadow-lg relative">

                <h2 className="text-white text-[15px]">Relatórios</h2>
                <p className="text-gray-400 text-sm mb-4">
                    Gere, visualize e exporte análises completas do ambiente de segurança.
                </p>

                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

                    {/* FILTROS */}
                    <div className="flex flex-col xl:flex-row gap-4">

                        {/* SELECT DE DATAS */}
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
                                    <option value="">Período</option>
                                    <option value="5d">5 dias</option>
                                    <option value="15d">15 dias</option>
                                    <option value="30d">30 dias</option>
                                </select>

                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
                                    ▼
                                </span>
                            </div>
                        </div>

                        {/* SELECT DE SEÇÕES */}
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

                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">
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
                                            "Top Acessos (URLs)",
                                            "Top Usuários",
                                            "Top Aplicações",
                                            "Top Categorias",
                                            "Top Usuários por Volume de Aplicação",
                                            "Top Acesso Detalhado",
                                            "Nível de Risco",
                                            "Vulnerabilidades Detectadas",
                                            "Top Hosts por Nível de Alertas",
                                            "Segurança dos Servidores (CIS Score)",
                                            "Top 5 Sistemas Operacionais Detectados",
                                            "Top Hosts por Alteração de Arquivos",
                                            "Top Hosts Alterados por Origem da Alteração",
                                            "Resumo de Ações nos Arquivos",
                                        ].map((item, idx) => (
                                            <label
                                                key={idx}
                                                className="flex items-center gap-3 py-2 cursor-pointer text-gray-300"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={secoesSelecionadas.includes(item)}
                                                    onChange={() => toggleSecao(item)}
                                                    className="w-4 h-4 rounded border-gray-600 bg-transparent"
                                                />
                                                <span>{item}</span>
                                            </label>
                                        ))}
                                    </div>,
                                    portalRoot
                                )}
                        </div>
                    </div>

                    {/* BOTÃO GERAR */}
                    <div>
                        <button
                            onClick={handleGerarRelatorio}
                            className="bg-purple-600 hover:bg-purple-700 px-5 py-2 rounded-xl text-white transition-all"
                        >
                            Gerar relatório →
                        </button>
                    </div>
                </div>
            </div>

            {/* =========================== LISTAGEM =========================== */}
            <div className="cards rounded-2xl p-6 border border-white/5">

                {/* Cabeçalho sempre visível */}
                <div className="bg-[#0A0617] grid grid-cols-5 text-gray-300 text-sm border border-white/10 rounded-xl px-4 py-3 mb-3">
                    <span>Nome</span>
                    <span>Período</span>
                    <span>Gerado em</span>
                    <span>Organização</span>
                    <span className="text-right mr-6">Ações</span>
                </div>

                {/* SKELETON GERAL — aparece ao mudar tenant ou carregar primeira vez */}
                {loading && !gerandoRelatorio && (
                    <>
                        <SkeletonLinha />
                        <SkeletonLinha />
                        <SkeletonLinha />
                        <SkeletonLinha />
                    </>
                )}

                {/* SKELETON EXCLUSIVO — aparece somente enquanto um novo relatório é gerado */}
                {gerandoRelatorio && (
                    <SkeletonLinha />
                )}

                {/* MENSAGEM: nenhum relatório */}
                {!loading && !gerandoRelatorio && relatorios.length === 0 && (
                    <div className="h-[40vh] flex items-center justify-center text-gray-300">
                        <div className="text-center">
                            <h2 className="text-lg mb-2">Nenhum relatório criado</h2>
                            <p className="text-sm">
                                Use os filtros acima para gerar um relatório.
                            </p>
                        </div>
                    </div>
                )}

                {/* LISTA REAL DE RELATÓRIOS */}
                {!loading && relatorios.map((rel) => {
                    const r = rel.attributes || rel;

                    return (
                        <div
                            key={rel.id}
                            className="border border-white/5 rounded-xl px-4 py-4 grid grid-cols-5 items-center mb-2"
                        >
                            {/* Nome */}
                            <div className="text-gray-300">
                                {r?.nome ?? `relatorio_${rel.id}`}
                            </div>

                            {/* Período */}
                            <div className="text-gray-300">
                                {r?.period ?? "--"}
                            </div>

                            {/* Data */}
                            <div className="text-gray-300">
                                {r?.createdAt
                                    ? new Date(r.createdAt).toLocaleString("pt-BR")
                                    : "--"}
                            </div>

                            {/* Organização */}
                            <div className="text-gray-300">
                                {r?.tenant || "---"}
                            </div>

                            {/* Ações */}
                            <div className="flex justify-end gap-3">

                                {/* VISUALIZAR */}
                                <button
                                    onClick={() => navigate(`/report-view?nome=${r.nome}`)}
                                    className="flex items-center gap-2 border border-purple-500/40 hover:bg-purple-500/10 text-purple-400 px-3 py-2 rounded-lg text-sm transition"
                                >
                                    <FiSearch className="text-purple-400 text-lg" />
                                    Visualizar
                                </button>

                                {/* DELETAR */}
                                <button
                                    onClick={() => handleDelete(rel.id, r.nome)}
                                    className="flex items-center gap-2 border border-red-500/40 hover:bg-red-500/10 text-red-400 px-3 py-2 rounded-lg text-sm transition"
                                >
                                    🗑️ Deletar
                                </button>

                            </div>
                        </div>
                    );
                })}

            </div>

        </LayoutModel>
    );
}
