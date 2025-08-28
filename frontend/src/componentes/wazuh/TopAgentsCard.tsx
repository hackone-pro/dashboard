// src/componentes/wazuh/TopAgentsCard.tsx
import { useEffect, useMemo, useState } from "react";
import { getTopAgents, TopAgentItem } from "../../services/wazuh/topagents.service";

type DiasOption = "1" | "7" | "15" | "30" | "todos";

export default function TopAgentsCard() {
    const [dias, setDias] = useState<DiasOption>("todos");
    const [agentes, setAgentes] = useState<TopAgentItem[]>([]);
    const [carregando, setCarregando] = useState<boolean>(true);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        let ativo = true;
        async function fetchData() {
            try {
                setCarregando(true);
                setErro(null);
                const data = await getTopAgents(dias);
                if (!ativo) return;
                setAgentes(data);
            } catch (e: any) {
                if (!ativo) return;
                setErro(e?.message ?? "Erro ao buscar top agentes");
            } finally {
                if (ativo) setCarregando(false);
            }
        }
        fetchData();
        return () => {
            ativo = false;
        };
    }, [dias]);

    // Deriva o nível a partir do score (mesmos thresholds do backend)
    const nivelPorScore = (score: number): "Baixo" | "Médio" | "Alto" | "Crítico" => {
        if (score >= 100) return "Crítico";
        if (score >= 87) return "Alto";
        if (score >= 60) return "Médio";
        return "Baixo";
    };

    const getCorBadge = (nivel: string) => {
        switch (nivel) {
            case "Crítico":
            case "Crítica":
                return "badge-pink";
            case "Alto":
            case "Alta":
                return "badge-high";
            case "Médio":
            case "Média":
                return "badge-darkpink";
            case "Baixo":
            case "Baixa":
            default:
                return "badge-green";
        }
    };

    const getCorBarra = (nivel: string) => {
        switch (nivel) {
            case "Crítico":
            case "Crítica":
                return "bg-pink-500";
            case "Alto":
            case "Alta":
                return "bg-purple-400";
            case "Médio":
            case "Média":
                return "bg-indigo-400";
            case "Baixo":
            case "Baixa":
            default:
                return "bg-emerald-400";
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
                return 4;
            default:
                return 1;
        }
    };

    // ordem fixa de prioridade
    const ordemNivel = { "Crítico": 4, "Alto": 3, "Médio": 2, "Baixo": 1 };

    const listaOrdenada = useMemo(() => {
        return [...agentes].sort((a, b) => {
            const nivelA = nivelPorScore(a.score);
            const nivelB = nivelPorScore(b.score);

            // compara pelo ranking fixo
            const rankA = ordemNivel[nivelA];
            const rankB = ordemNivel[nivelB];

            if (rankB !== rankA) return rankB - rankA;

            // se forem do mesmo nível → desempata pelo total de alertas
            return b.total_alertas - a.total_alertas;
        });
    }, [agentes]);

    return (
        <div className="cards p-6 rounded-2xl shadow-lg flex-grow hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm text-white">Top Agentes com vulnerabilidades</h3>

                <select
                    className="bg-[#0d0c22] text-white text-xs px-2 py-1 rounded-sm border border-[#cacaca31]"
                    value={dias}
                    onChange={(e) => setDias(e.target.value as DiasOption)}
                >
                    <option value="1">24 horas</option>
                    <option value="7">7 dias</option>
                    <option value="15">15 dias</option>
                    <option value="30">30 dias</option>
                    <option value="todos">Todos</option>
                </select>
            </div>

            {erro && (
                <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2 mb-2">
                    {erro}
                </div>
            )}

            {carregando ? (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="h-10 bg-[#ffffff0a] rounded-md" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-2 divide-y divide-[#ffffff1e]">
                    {listaOrdenada.length === 0 ? (
                        <span className="text-xs text-gray-400 text-center py-4">
                            Nenhum agente encontrado para o período selecionado.
                        </span>
                    ) : (
                        listaOrdenada.map((item, i) => {
                            const nivel = nivelPorScore(item.score);
                            const qtd = getQtdPreenchida(nivel);
                            const total = 4;

                            return (
                                <div
                                    key={`${item.agent_name}-${i}`}
                                    className="group flex flex-col text-sm text-gray-300 px-2 py-2 hover:bg-[#ffffff0a] rounded-md transition-all"
                                >
                                    {/* Linha superior: badge + barras + score */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] text-gray-400">
                                            {item.total_alertas.toLocaleString("pt-BR")} alertas
                                        </span>

                                        <div className="flex items-center gap-4">
                                            <span className={`text-[11px] px-2 py-0.5 rounded-md badge ${getCorBadge(nivel)}`}>
                                                {nivel}
                                            </span>

                                            <div className="flex gap-1">
                                                {Array.from({ length: total }).map((_, j) => (
                                                    <span
                                                        key={j}
                                                        className={`w-1.5 h-3 rounded-sm ${j < qtd ? getCorBarra(nivel) : "bg-[#2b2b3a]"}`}
                                                    />
                                                ))}
                                            </div>

                                            {/* <span className="text-[11px] text-gray-400 min-w-[44px] text-right">
                                                {Math.round(item.score)}%
                                            </span> */}
                                        </div>
                                    </div>

                                    {/* Linha inferior: nome do agente + info à direita (total novamente compactado) */}
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="font-medium text-gray-400 truncate max-w-[240px]">
                                            {item.agent_name}
                                        </span>

                                        {/* <span className="text-[11px] text-gray-500">
                                            total: {item.total_alertas.toLocaleString("pt-BR")}
                                        </span> */}
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
