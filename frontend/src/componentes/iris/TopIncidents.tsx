import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTenant } from "../../services/wazuh/tenant.service";
import { getTodosCasos } from "../../services/iris/cases.service";

import { useTenant } from "../../context/TenantContext";

interface Incidente {
    case_id: number;
    case_name: string;
    case_description: string;
    case_open_date: string; // "MM/DD/YYYY"
    classification_id: number;
    classification: string;
    client_name: string;
}

interface Props {
    token: string;
}

export default function TopIncidentes({ token }: Props) {
    const [incidentes, setIncidentes] = useState<Incidente[]>([]);
    const [filtroDias, setFiltroDias] = useState(0);
    const [irisUrl, setIrisUrl] = useState<string>("");
    const navigate = useNavigate();

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [animReady, setAnimReady] = useState(false);

    const { tenantAtivo, loading } = useTenant();

    const formatDateBR = (dateStr: string): string => {
        if (!dateStr) return "";
        const [mes, dia, ano] = dateStr.split("/");
        return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${ano}`;
    };

    useEffect(() => {
        if (loading || !tenantAtivo) return; // 👈 evita executar antes do tenant carregar

        let ativo = true;

        async function fetch() {
            try {
                setCarregando(true);
                setErro(null);
                setAnimReady(false);

                // 🔹 carrega tenant e incidentes novamente
                const tenant = await getTenant();
                if (!ativo) return;
                setIrisUrl(tenant.iris_url);

                const response = await getTodosCasos(token);
                // @ts-ignore
                const data: Incidente[] = Array.isArray(response) ? response : response.data;

                const hoje = new Date();
                const limite = new Date();
                limite.setDate(hoje.getDate() - filtroDias);

                // filtra os incidentes do tenant atual
                const filtrado = data.filter((incidente) => {
                    const [mes, dia, ano] = incidente.case_open_date.split("/");
                    const dataIncidente = new Date(`${ano}-${mes}-${dia}`);

                    if (filtroDias === 0) {
                        return incidente.client_name === tenant.cliente_name;
                    }
                    return dataIncidente >= limite && incidente.client_name === tenant.cliente_name;
                });

                const ordenado = filtrado.sort((a, b) => b.case_id - a.case_id);

                if (!ativo) return;
                setIncidentes(ordenado.slice(0, 7));
                setTimeout(() => ativo && setAnimReady(true), 50);
            } catch (e: any) {
                if (!ativo) return;
                setErro(e?.message ?? "Erro ao carregar incidentes");
            } finally {
                if (ativo) setCarregando(false);
            }
        }

        fetch();
        return () => {
            ativo = false;
        };
    }, [token, filtroDias, tenantAtivo]);

    const getCorBadge = (nivel: string) => {
        switch (nivel) {
            case "Crítico":
            case "Crítica":
            case "CRÍTICA":
            case "CRÍTICO":
                return "badge-pink";
            case "Alto":
            case "Alta":
                return "badge-high";
            case "Médio":
            case "Média":
                return "badge-darkpink";
            case "Baixo":
            case "Baixa":
                return "badge-green";
            default:
                return "bg-gray-500";
        }
    };

    const getCorBarra = (nivel: string) => {
        switch (nivel) {
            case "Crítico":
            case "Crítica":
            case "CRÍTICA":
            case "CRÍTICO":
                return "bg-pink-500";
            case "Alto":
            case "Alta":
                return "bg-purple-400";
            case "Médio":
            case "Média":
                return "bg-indigo-400";
            case "Baixo":
            case "Baixa":
                return "bg-emerald-400";
            default:
                return "bg-gray-400";
        }
    };

    const getQtdPreenchida = (nivel: string) => {
        switch (nivel) {
            case "Baixo":
            case "Baixa":
                return 1;
            case "Médio":
            case "Média":
                return 2;
            case "Alto":
            case "Alta":
                return 3;
            case "Crítico":
            case "Crítica":
            case "CRÍTICA":
            case "CRÍTICO":
                return 4;
            default:
                return 1;
        }
    };

    const mapNivelPorClassificationId = (id: number): string => {
        if ([1, 2, 11, 12, 13, 25, 32, 33, 34, 35, 36].includes(id)) return "Baixo";
        if ([3, 4, 5, 14, 15, 22, 30, 31].includes(id)) return "Médio";
        if ([6, 7, 8, 9, 10, 16, 23, 26, 27, 28, 29].includes(id)) return "Alto";
        if ([17, 18, 19, 20, 21, 24].includes(id)) return "Crítico";
        return "Baixo";
    };

    const NIVEIS_REGEX = "(Baixo|Baixa|M[eé]dio|M[eé]dia|Alto|Alta|CR[IÍ]TICA|CR[IÍ]TICO|Cr[ií]tico|Cr[ií]tica)";


    // 🔁 SUBSTITUIR a sua detectarNivelPorNome por esta
    const detectarNivelPorNome = (nome: string): string | null => {
        // 1) Padrão antigo: [HH:MM - DD/MM/AAAA] - Nível - ...
        const rComData = new RegExp(
            `\\[\\d{2}:\\d{2}\\s*-\\s*\\d{2}/\\d{2}/\\d{4}\\]\\s*-\\s*${NIVEIS_REGEX}`,
            "i"
        );

        // 2) Novo padrão IA: [HH:MM] - Nível - ...
        const rSemData = new RegExp(
            `\\[\\d{2}:\\d{2}\\]\\s*-\\s*${NIVEIS_REGEX}\\s*-`,
            "i"
        );

        // Tenta casar na ordem
        let m = nome.match(rComData);
        if (m) return m[1];

        m = nome.match(rSemData);
        if (m) return m[1];

        return null;
    };

    const formatCaseName = (name: string) => {
        // Normaliza espaços e remove NBSP
        let s = name.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trimStart();

        // Remove cabeçalho:
        // [opcional] "#86 - " ou "86 - "
        // + "[HH:MM]" (opcionalmente " - DD/MM/AAAA")
        // + " - Nível - "
        const cabecalho = new RegExp(
            String.raw`^\s*(?:#?\d+\s*[-–]\s*)?\[\d{2}:\d{2}(?:\s*[-–]\s*\d{2}\/\d{2}\/\d{4})?\]\s*[-–]\s*${NIVEIS_REGEX}\s*[-–]\s*`,
            "i"
        );
        s = s.replace(cabecalho, "");

        // Fallback: se vier só prefixo + "[HH:MM] - " (sem nível)
        const soHora = new RegExp(
            String.raw`^\s*(?:#?\d+\s*[-–]\s*)?\[\d{2}:\d{2}\]\s*[-–]\s*`,
            "i"
        );
        s = s.replace(soHora, "");

        return s.trim();
    };

    return (
        <div className="cards p-6 rounded-2xl shadow-lg flex-grow hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm text-white">Últimos Incidentes</h3>
                <select
                    className="bg-[#0d0c22] text-white text-xs px-2 py-1 rounded-md border border-[#cacaca31]"
                    value={filtroDias}
                    onChange={(e) => setFiltroDias(Number(e.target.value))}
                >
                    <option value={0}>Todos</option>
                    <option value={1}>24 horas</option>
                    <option value={7}>7 dias</option>
                    <option value={15}>15 dias</option>
                    <option value={30}>30 dias</option>
                </select>
            </div>

            {/* Erro */}
            {erro && (
                <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2 mb-2">
                    {erro}
                </div>
            )}

            {/* Loading */}
            {carregando ? (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 7 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex flex-col text-sm px-2 py-2 rounded-md bg-transparent"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <div className="h-3 w-24 bg-[#ffffff0f] rounded animate-pulse" />
                                <div className="flex items-center gap-4">
                                    <div className="h-4 w-16 bg-[#ffffff0f] rounded animate-pulse" />
                                    <div className="flex gap-1">
                                        {Array.from({ length: 4 }).map((_, j) => (
                                            <span
                                                key={j}
                                                className="w-1.5 h-3 rounded-sm bg-[#ffffff0f] animate-pulse"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="h-4 w-48 bg-[#ffffff0f] rounded animate-pulse" />
                                <div className="h-6 w-10 bg-[#ffffff0f] rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div
                    className={`flex flex-col gap-2 divide-y divide-[#ffffff1e] transition-opacity duration-300 ${animReady ? "opacity-100" : "opacity-0"
                        }`}
                >
                    {incidentes.length === 0 ? (
                        <span className="text-xs text-gray-400 text-center py-4">
                            Nenhum incidente encontrado.
                        </span>
                    ) : (
                        incidentes.map((incidente, i) => {
                            const nivelManual = detectarNivelPorNome(incidente.case_name);
                            const nivel =
                                nivelManual || mapNivelPorClassificationId(incidente.classification_id);
                            const qtd = getQtdPreenchida(nivel);
                            const total = 4;
                            const sentenceCase = (texto: string) =>
                                texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();

                            return (
                                <div
                                    key={i}
                                    className="group flex flex-col text-sm text-gray-300 px-2 py-2 hover:bg-[#ffffff0a] rounded-md transition-all"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] text-gray-400">
                                            {formatDateBR(incidente.case_open_date)}
                                        </span>

                                        <div className="flex items-center gap-4">
                                            <span
                                                className={`text-[11px] px-2 py-0.5 rounded-md badge ${getCorBadge(
                                                    nivel
                                                )}`}
                                            >
                                                {sentenceCase(nivel)}
                                            </span>

                                            <div className="flex gap-1">
                                                {Array.from({ length: total }).map((_, j) => (
                                                    <span
                                                        key={j}
                                                        className={`w-1.5 h-3 rounded-sm ${j < qtd ? getCorBarra(nivel) : "bg-[#2b2b3a]"
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Linha com nome + botão flutuante */}
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="font-medium text-gray-400 truncate max-w-[220px]">
                                            #{incidente.case_id} - {formatCaseName(incidente.case_name)}
                                        </span>

                                        {/* Botão visível apenas ao hover na group */}
                                        {irisUrl && (
                                            <button
                                                onClick={() => navigate(`/incidentes?open=${incidente.case_id}`)}
                                                className="px-1 py-1 btn card hover:bg-purple-600 text-[11px] text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            >
                                                Ver →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
