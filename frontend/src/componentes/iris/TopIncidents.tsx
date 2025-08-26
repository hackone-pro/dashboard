import { useEffect, useState } from "react";
import { getCasosRecentes } from "../../services/iris/cases.service";

export type Incidente = {
    case_id: number;
    case_name: string;
    case_description: string;
    case_open_date: string;
    classification_id: number;
    classification: string;
};

type Props = {
    token: string;
};

export default function TopIncidentesCard({ token }: Props) {
    const [range, setRange] = useState("1d");
    const [incidentes, setIncidentes] = useState<Incidente[]>([]);

    useEffect(() => {
        async function fetch() {
            const data = await getCasosRecentes(range, token);
            // console.log("🧪 Incidentes recebidos:", data.slice(0, 12)); // 👈 alterado
            setIncidentes(data.slice(0, 8));
        }
        fetch();
    }, [range]);

    const getCorBadge = (nivel: string) => {
        switch (nivel) {
            case "Crítico": return "badge-pink";
            case "Alto": return "bg-purple-500";
            case "Médio": return "badge-darkpink";
            case "Baixo": return "badge-green";
            default: return "bg-gray-500";
        }
    };

    const getCorBarra = (nivel: string) => {
        switch (nivel) {
            case "Crítico": return "bg-pink-500";
            case "Alto": return "bg-purple-400";
            case "Médio": return "bg-indigo-400";
            case "Baixo": return "bg-emerald-400";
            default: return "bg-gray-400";
        }
    };

    const getQtdPreenchida = (nivel: string) => {
        switch (nivel) {
            case "Baixo": return 1;
            case "Médio": return 2;
            case "Alto": return 3;
            case "Crítico": return 4;
            default: return 1;
        }
    };

    const mapNivelPorClassificationId = (id: number): "Baixo" | "Médio" | "Alto" | "Crítico" => {
        if ([1, 2, 11, 12, 13, 25, 32, 33, 34, 35, 36].includes(id)) return "Baixo"; // spam, escaneamentos, conformidade
        if ([3, 4, 5, 14, 15, 22, 30, 31].includes(id)) return "Médio";              // vírus, phishing, exploits, etc.
        if ([6, 7, 8, 9, 10, 16, 23, 26, 27, 28, 29].includes(id)) return "Alto";    // ransomware, rootkit, spyware, etc.
        if ([17, 18, 19, 20, 21, 24].includes(id)) return "Crítico";                 // domínio comprometido, sabotagem, etc.
        return "Baixo"; // fallback
    };

    const detectarNivelPorNome = (nome: string): string | null => {
        const match = nome.match(/\[\d{2}:\d{2} - \d{2}\/\d{2}\/\d{4}\] - (Baixa|Baixo|Médio|Média|Alto|Alta|Crítica|Crítico)/i);
        if (!match) return null;

        // Padroniza: transforma "Alta" em "Alto", "Média" em "Médio", etc.
        const nivel = match[1].toLowerCase();
        if (nivel.includes("baixo")) return "Baixo";
        if (nivel.includes("baixa")) return "Baixo";
        if (nivel.includes("media")) return "Médio";
        if (nivel.includes("médio")) return "Médio";
        if (nivel.includes("alta")) return "Alto";
        if (nivel.includes("alto")) return "Alto";
        if (nivel.includes("critica")) return "Crítica";
        if (nivel.includes("crítico")) return "Crítico";
        return null;
    };


    return (
        <div className="cards mt-3 p-6 rounded-2xl shadow-lg flex-grow hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-center">
                <h3 className="text-sm text-white">Top Incidentes</h3>
                <select
                    className="bg-[#0d0c22] text-white text-xs px-2 py-1 rounded-sm border border-[#1D1929]"
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                >
                    <option value="1d">24 horas</option>
                    <option value="7d">7 dias</option>
                    <option value="30d">30 dias</option>
                </select>
            </div>

            <div className="flex flex-col gap-2 mt-4 divide-y divide-[#ffffff1e]">
                {incidentes.length === 0 ? (
                    <span className="text-xs text-gray-400 text-center py-4">Nenhum incidente encontrado.</span>
                ) : (
                    incidentes.map((incidente, i) => {
                        const nivelManual = detectarNivelPorNome(incidente.case_name);
                        const nivel = nivelManual || mapNivelPorClassificationId(incidente.classification_id);
                        const qtd = getQtdPreenchida(nivel);
                        const total = 4;

                        const formatCaseName = (name: string) => {
                            // Remove padrão do tipo: [HH:MM - DD/MM/YYYY] - Nivel -
                            return name.replace(/\[\d{2}:\d{2}\s*-\s*\d{2}\/\d{2}\/\d{4}\]\s*-\s*(Baixa|Baixo|Médio|Média|Alto|Alta|Crítica|Crítico)\s*-\s*/i, "");
                        };


                        return (
                            <div
                                key={i}
                                className="flex flex-col text-sm text-gray-300 px-2 py-2 hover:bg-[#ffffff0a] rounded-md transition-all"
                            >
                                {/* Linha de cima → data à esquerda, badge e traços à direita */}
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-gray-400">{incidente.case_open_date}</span>
                                    <div className="flex items-center gap-4">
                                        <span
                                            className={`text-[10px] px-2 py-0.5 rounded-md badge text-white ${getCorBadge(nivel)}`}
                                        >
                                            {nivel}
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

                                {/* Linha de baixo → título sozinho */}
                                <span className="font-medium text-gray-400 truncate mt-1">
                                    {formatCaseName(incidente.case_name)}
                                </span>
                            </div>

                        );
                    })
                )}
            </div>
        </div>
    );
}