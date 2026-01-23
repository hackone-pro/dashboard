import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { gerarRelatorio as gerarRelatorioAPI } from "../services/report-entry/report.service";
import { listarRelatorios, deletarRelatorio } from "../services/report-entry/report.service";

import LayoutModel from "../componentes/LayoutModel";
import { FiSearch, FiTrash } from "react-icons/fi";
import { IoCalendarOutline } from "react-icons/io5";
import { useTenant } from "../context/TenantContext";

import { toastSuccess, toastError } from "../utils/toast";
import Swal from "sweetalert2";


export default function ReportDash() {
    const [horas, setHoras] = useState("");
    const [openSecoes, setOpenSecoes] = useState(false);
    const [secoesSelecionadas, setSecoesSelecionadas] = useState<string[]>([]);
    const [relatorios, setRelatorios] = useState<any[]>([]);
    const [gerando, setGerando] = useState(false);
    const [loading, setLoading] = useState(false);
    const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
    const [progresso, setProgresso] = useState(0);

    const [openPeriodo, setOpenPeriodo] = useState(false);
    const botaoPeriodoRef = useRef<HTMLButtonElement | null>(null);
    const periodoRef = useRef<HTMLDivElement | null>(null);


    const botaoSecoesRef = useRef<HTMLButtonElement | null>(null);

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

    const [filtroSecoes, setFiltroSecoes] = useState("");
    const secoesRef = useRef<HTMLDivElement | null>(null);

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

    const SkeletonGeracaoRelatorio = () => (
        <div className="mt-4 space-y-3 animate-pulse">
            <div className="h-4 w-1/3 bg-[#ffffff15] rounded"></div>
            <div className="h-4 w-2/3 bg-[#ffffff15] rounded"></div>
            <div className="h-4 w-1/2 bg-[#ffffff15] rounded"></div>
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

    function selecionarTodasSecoes() {
        setSecoesSelecionadas(secoesFiltradas);
    }

    function limparTodasSecoes() {
        setSecoesSelecionadas([]);
    }

    // Gerar relatório REAL usando o backend
    async function handleGerarRelatorio() {
        try {
            if (!horas) {
                toastError("Selecione um período para gerar o relatório.");
                return;
            }

            if (secoesSelecionadas.length === 0) {
                toastError("Selecione ao menos uma seção do relatório.");
                return;
            }

            setGerandoRelatorio(true);
            setProgresso(5);

            const interval = setInterval(() => {
                setProgresso(prev => (prev < 90 ? prev + 5 : prev));
            }, 600);

            const novoRelatorio = await gerarRelatorioAPI(horas, secoesSelecionadas);

            clearInterval(interval);
            setProgresso(100);

            setRelatorios(prev => [novoRelatorio, ...prev]);
            toastSuccess("Relatório gerado com sucesso!");

        } catch (error) {
            toastError("Erro ao gerar relatório.");
        } finally {
            setTimeout(() => {
                setGerandoRelatorio(false);
                setProgresso(0);
            }, 500);
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

    const secoesDisponiveis = [
        "Top Acessos (URLs)",
        "Top Usuários",
        "Top Aplicações",
        "Top Categorias",
        "Top Usuários por Volume de Aplicação",
        "Top Acesso Detalhado",
        "Nível de Risco",
        "Vulnerabilidades Detectadas",
        "Top Hosts por Nível de Alertas",
        // "Segurança dos Servidores (CIS Score)",
        "Top 5 Sistemas Operacionais Detectados",
        "Top Hosts por Alteração de Arquivos",
        "Top Hosts Alterados por Origem da Alteração",
        "Resumo de Ações nos Arquivos",
        "Incidentes",
    ];

    const secoesFiltradas = secoesDisponiveis.filter(sec =>
        sec.toLowerCase().includes(filtroSecoes.toLowerCase())
    );

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            // se clicou no botão, ignora
            if (botaoSecoesRef.current?.contains(target)) {
                return;
            }

            if (
                openPeriodo &&
                periodoRef.current &&
                !periodoRef.current.contains(target) &&
                !botaoPeriodoRef.current?.contains(target)
            ) {
                setOpenPeriodo(false);
            }

            // se clicou fora do portal, fecha
            if (
                openSecoes &&
                secoesRef.current &&
                !secoesRef.current.contains(target)
            ) {
                setOpenSecoes(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openSecoes]);

    const periodosDisponiveis = [
        { label: "5 dias", value: "5d" },
        { label: "15 dias", value: "15d" },
        { label: "30 dias", value: "30d" },
    ];

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
                                <span className="text-white text-lg">
                                    {/* @ts-ignore */}
                                    <IoCalendarOutline />
                                </span>
                            </div>

                            <div className="relative">

                                {/* BOTÃO DO PERÍODO */}
                                <button
                                    ref={botaoPeriodoRef}
                                    onClick={() => setOpenPeriodo(v => !v)}
                                    className="
                                        bg-[#0A0617]
                                        border border-white/10
                                        text-white
                                        rounded-xl
                                        px-4 py-2
                                        pr-10
                                        w-36
                                        flex items-center justify-between
                                        cursor-pointer
                                    "
                                >
                                    <span className={horas ? "text-white" : "text-gray-400"}>
                                        {periodosDisponiveis.find(p => p.value === horas)?.label || "Período"}
                                    </span>

                                    <span className="text-gray-300">▼</span>
                                </button>

                                {/* DROPDOWN DO PERÍODO */}
                                {openPeriodo && portalRoot &&
                                    createPortal(
                                        <div
                                            ref={periodoRef}
                                            className="
                                                fixed z-[999999]
                                                bg-[#161125]
                                                border border-white/10
                                                rounded-xl
                                                shadow-xl
                                                p-2
                                                w-40
                                            "
                                            style={{
                                                top: "220px",
                                                left: "160px",
                                            }}
                                        >
                                            {periodosDisponiveis.map(p => {
                                                const ativo = horas === p.value;

                                                return (
                                                    <button
                                                        key={p.value}
                                                        onClick={() => {
                                                            setHoras(p.value);
                                                            setOpenPeriodo(false);
                                                        }}
                                                        className={`
                                                            relative
                                                            w-full flex items-center gap-3 p-3 rounded-md text-left
                                                            transition-colors
                                                            ${ativo
                                                                                                            ? `
                                                                bg-[#250E5D] text-white
                                                                before:absolute before:top-0 before:left-0 before:w-full before:h-[1px]
                                                                before:bg-gradient-to-r before:from-[#3A0F80] before:via-[#AE29CA] before:to-[#3A0F80]
                                                                after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px]
                                                                after:bg-gradient-to-r after:from-[#3A0F80] after:via-[#AE29CA] after:to-[#3A0F80]
                                                            `
                                                                : "text-gray-400 hover:bg-[#1B1037]"
                                                            }
                                                        `}
                                                    >

                                                        {/* CHECK VISUAL — IGUAL AO DAS SEÇÕES */}
                                                        <span
                                                            className={`
                                                                w-6 h-6 flex items-center justify-center
                                                                border border-[#271E3F]
                                                                bg-transparent
                                                                transition-all
                                                                ${ativo ? "border-[#554b74]" : ""}
                                                                `}
                                                                                                        >
                                                             <svg className={`
                                                                    w-4 h-4
                                                                    transition-all
                                                                    ${ativo ? "opacity-100 scale-100 text-[#939393]" : "opacity-0 scale-75"}
                                                                `}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="3"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M5 13l4 4L19 7"
                                                                />
                                                            </svg>
                                                        </span>

                                                        <span>{p.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>,
                                        portalRoot
                                    )
                                }
                            </div>

                        </div>

                        {/* SELECT DE SEÇÕES */}
                        <div className="relative">
                            <button
                                ref={botaoSecoesRef}
                                onClick={() => setOpenSecoes(v => !v)}
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
                                        ref={secoesRef}
                                        className="
                                            fixed
                                            z-[999999]
                                            bg-[#161125]
                                            border border-white/10
                                            rounded-xl
                                            shadow-xl
                                            p-4
                                            text-sm
                                        "
                                        style={{
                                            top: "220px",
                                            left: "325px",
                                            width: "380px"
                                        }}
                                    >
                                        {/* CAMPO DE PESQUISA */}
                                        <input
                                            type="text"
                                            placeholder="Pesquisar seção..."
                                            value={filtroSecoes}
                                            onChange={(e) => setFiltroSecoes(e.target.value)}
                                            className="
                                                w-full px-3 py-2 mb-3
                                                bg-[#0d0a20]
                                                border border-white/10
                                                rounded-lg
                                                text-white
                                            "
                                        />

                                        {/* AÇÕES RÁPIDAS */}
                                        <div className="flex justify-between items-center mb-2 px-1 text-xs">
                                            <button
                                                type="button"
                                                onClick={selecionarTodasSecoes}
                                                className="
                                                text-gray-400
                                                    hover:text-white
                                                    transition
                                                "
                                            >
                                                Selecionar todos
                                            </button>

                                            <button
                                                type="button"
                                                onClick={limparTodasSecoes}
                                                className="
                                                text-gray-400
                                                hover:text-white
                                                transition
                                            "
                                            >
                                                Limpar tudo
                                            </button>
                                        </div>


                                        {/* LISTA COM ALTURA FIXA + SCROLL */}
                                        <div className="lista-secoes max-h-[330px] overflow-y-auto pr-2 overflow-x-hidden">

                                            {secoesFiltradas.map((item, idx) => {
                                                const ativo = secoesSelecionadas.includes(item);

                                                return (
                                                    <label
                                                        key={idx}
                                                        className={`
                                                            relative flex items-center gap-3 p-3 cursor-pointer transition-colors
                                                            ${ativo
                                                                ? `
                                                                bg-[#250E5D] text-white rounded-md
                                                                before:absolute before:top-0 before:left-0 before:w-full before:h-[1px]
                                                                before:bg-gradient-to-r before:from-[#3A0F80] before:via-[#AE29CA] before:to-[#3A0F80]
                                                                after:absolute after:bottom-0 after:w-full after:h-[1px]
                                                                after:bg-gradient-to-r after:from-[#3A0F80] after:via-[#AE29CA] after:to-[#3A0F80]
                                                            `
                                                                : "text-gray-400 hover:bg-[#1B1037]"
                                                            }
                                                        `}
                                                    >
                                                        {/* checkbox nativo */}
                                                        <input
                                                            type="checkbox"
                                                            checked={ativo}
                                                            onChange={() => toggleSecao(item)}
                                                            className="sr-only"
                                                        />

                                                        {/* checkbox visual */}
                                                        <span
                                                            className={`
                                                            w-6 h-6 flex items-center justify-center
                                                            border border-[#271E3F]
                                                            bg-transparent
                                                            transition-all
                                                            ${ativo ? "border-[#554b74]" : ""}
                                                            `}
                                                        >
                                                            <svg
                                                                className={`
                                                                    w-4 h-4
                                                                    transition-all
                                                                    ${ativo ? "opacity-100 scale-100 text-[#939393]" : "opacity-0 scale-75"}
                                                                `}
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="3"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M5 13l4 4L19 7"
                                                                />
                                                            </svg>
                                                        </span>

                                                        <span>{item}</span>
                                                    </label>
                                                );
                                            })}


                                            {secoesFiltradas.length === 0 && (
                                                <p className="text-gray-500 text-center py-3">
                                                    Nenhuma seção encontrada.
                                                </p>
                                            )}
                                        </div>
                                    </div>,
                                    portalRoot
                                )
                            }

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
                    <>
                        {/* barra de progresso */}
                        <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Gerando relatório…</span>
                                <span>{progresso}%</span>
                            </div>

                            <div className="w-full h-2 bg-[#1B1037] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 via-purple-400 to-purple-600 transition-all duration-500"
                                    style={{ width: `${progresso}%` }}
                                />
                            </div>
                        </div>

                        {/* skeleton visual */}
                        <SkeletonGeracaoRelatorio />
                    </>
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
                                    onClick={() => navigate(`/relatorios/report-view?nome=${r.nome}`)}
                                    className="flex items-center gap-2 border border-purple-500/40 hover:bg-purple-500/10 text-purple-400 px-3 py-2 rounded-lg text-sm transition"
                                >
                                    {/* @ts-ignore */}
                                    <FiSearch className="text-purple-400 text-lg" />
                                    Visualizar
                                </button>

                                {/* DELETAR */}
                                <button
                                    onClick={() => handleDelete(rel.id, r.nome)}
                                    className="flex items-center gap-2 border border-pink hover:bg-red-500/10 text-[#F914AD] px-3 py-2 rounded-lg text-sm transition"
                                >
                                    {/* @ts-ignore */}
                                    <FiTrash /> Deletar
                                </button>

                            </div>
                        </div>
                    );
                })}
            </div>
        </LayoutModel>
    );
}
