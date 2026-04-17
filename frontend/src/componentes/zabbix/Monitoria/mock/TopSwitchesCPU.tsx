import { useEffect } from "react";
import GraficoDonutLimpo from "../../../graficos/GraficoDonutLimpo";

const SEVERITY_STYLE: Record<string, string> = {
    critico: "border-[#EC4899]",
    alto: "border-[#A855F7]",
    medio: "border-[#6366F1]",
    baixo: "border-[#1DD69A]",
};

interface Props {
    onDadosCarregados?: (switches: { name: string; cpu: number; severity: string }[]) => void;
}

export default function TopSwitchesCPU({ onDadosCarregados }: Props) {

    // ================================
    // DADOS FAKE
    // ================================
    const switches = [
        { hostid: "1", name: "SW-Core-HQ", cpu: 87, severity: "critico" },
        { hostid: "2", name: "SW-Distrib-01", cpu: 68, severity: "alto" },
        { hostid: "3", name: "SW-Distrib-02", cpu: 54, severity: "medio" },
        { hostid: "4", name: "SW-Acesso-01", cpu: 31, severity: "baixo" },
        { hostid: "5", name: "SW-Acesso-02", cpu: 12, severity: "baixo" }
    ];

    useEffect(() => { onDadosCarregados?.(switches.map(({ name, cpu, severity }) => ({ name, cpu, severity }))); }, []);

    function LegendaItem({ cor, label }: { cor: string; label: string }) {
        return (
            <div className="flex items-center gap-1">
                <span
                    className="w-2.5 h-2.5 rounded-xs"
                    style={{ backgroundColor: cor }}
                />
                <span>{label}</span>
            </div>
        );
    }

    return (
        <div>

            {/* Header */}
            <div className="flex justify-between items-start mb-6">

                <div>
                    <h3 className="text-white text-md">Top switches - CPU</h3>
                    <p className="text-gray-400 text-sm">
                        SecurityOne • Utilização de CPU dos Switches
                    </p>
                </div>

                <div className="flex flex-col items-end gap-2 text-sm text-gray-400">
                    <span>
                        Nível de severidade da utilização da CPU
                    </span>

                    <div className="flex gap-4 text-xs">
                        <LegendaItem cor="#ec4899" label="Crítico" />
                        <LegendaItem cor="#a855f7" label="Alto" />
                        <LegendaItem cor="#6366f1" label="Médio" />
                        <LegendaItem cor="#1DD69A" label="Baixo" />
                    </div>
                </div>

            </div>

            {/* Conteúdo */}
            <div className="grid grid-cols-5 gap-4">

                {switches.map((sw) => {

                    const cpu = Math.min(100, Math.max(0, sw.cpu));

                    const corMapa: Record<string, string> = {
                        critico: "#EC4899",
                        alto: "#A855F7",
                        medio: "#6366F1",
                        baixo: "#1DD69A",
                    };

                    const severityFinal = cpu === 0 ? "baixo" : sw.severity;
                    const cor = corMapa[severityFinal] ?? "#6366F1";

                    return (
                        <div
                            key={sw.hostid}
                            className={`rounded-xl bg-[#0A0617]
                            flex flex-col items-center justify-center p-4
                            transition-all
                            ${SEVERITY_STYLE[severityFinal]}`}
                        >

                            <GraficoDonutLimpo
                                valor={cpu}
                                cor={cor}
                            />

                            <span className="text-gray-400 text-xs mt-2">
                                {sw.name}
                            </span>

                        </div>
                    );
                })}

            </div>

        </div>
    );
}