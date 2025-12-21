import { useEffect, useState } from "react";
import {
    getZabbixRouters,
    RouterSeveridade,
} from "../../../services/zabbix/routers";

/**
 * Estilo de borda conforme impacto calculado
 */
const SEVERITY_STYLE: Record<string, string> = {
    critico: "border-[#EC4899]",
    alto: "border-[#A855F7]",
    medio: "border-[#6366F1]",
    baixo: "border-[#1DD69A]",
};

export default function Roteadores() {
    const [routers, setRouters] = useState<RouterSeveridade[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function carregar() {
            try {
                const res = await getZabbixRouters(5);
                setRouters(res.routers);
            } catch (e) {
                console.error(e);
                setRouters([]);
            } finally {
                setLoading(false);
            }
        }

        carregar();
    }, []);

    /**
     * Calcula percentual de impacto baseado em pesos
     */
    function calcularImpactoPercentual(r: RouterSeveridade) {
        const pesoHigh = 4;
        const pesoAverage = 2;
        const pesoWarning = 1;

        const impactoAtual =
            r.high * pesoHigh +
            r.average * pesoAverage +
            r.warning * pesoWarning;

        const maxImpacto = r.total * pesoHigh;

        if (maxImpacto === 0) return 0;

        return Math.round((impactoAtual / maxImpacto) * 100);
    }

    /**
     * Define severidade visual a partir do percentual
     */
    function severidadePorPercentual(percent: number) {
        if (percent >= 75) return "critico";
        if (percent >= 50) return "alto";
        if (percent >= 25) return "medio";
        return "baixo";
    }

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
                {/* Título */}
                <div>
                    <h3 className="text-white text-md">
                        Nível de Impacto dos Roteadores
                    </h3>
                    <p className="text-gray-400 text-sm">
                        Baseado na quantidade e severidade de alertas ativos
                    </p>
                </div>

                {/* Legenda */}
                <div className="flex flex-col items-end gap-2 text-sm text-gray-400">
                    <span>Nível de Severidade dos Alertas</span>

                    <div className="flex gap-4 text-xs">
                        <LegendaItem cor="#EC4899" label="Crítico" />
                        <LegendaItem cor="#A855F7" label="Alto" />
                        <LegendaItem cor="#6366F1" label="Médio" />
                        <LegendaItem cor="#1DD69A" label="Baixo" />
                    </div>
                </div>
            </div>

            {/* Conteúdo */}
            {loading ? (
                <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 justify-center">

                    {routers.map((rt) => {
                        const percentual = calcularImpactoPercentual(rt);
                        const severidade = severidadePorPercentual(percentual);

                        return (
                            <div
                                key={rt.name}
                                className={`rounded-xl border bg-[#0A0617]
            flex flex-col items-center justify-center h-32 w-full max-w-[180px]
            transition-all
            ${SEVERITY_STYLE[severidade]}`}
                            >
                                <span className="text-gray-300 text-xs mb-1">
                                    {rt.name}
                                </span>

                                <span className="text-white text-lg font-semibold">
                                    {rt.total}
                                </span>

                                <span className="text-[11px] text-gray-400 mt-1">
                                    alertas ativos
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
