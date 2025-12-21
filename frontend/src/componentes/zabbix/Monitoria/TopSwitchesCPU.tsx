import { useEffect, useState } from "react";
import { getTopSwitchesCPU, TopSwitchCPUItem } from "../../../services/zabbix/top-switches-cpu";

const SEVERITY_STYLE: Record<string, string> = {
    critico: "border-[#EC4899]",
    alto: "border-[#A855F7]",
    medio: "border-[#6366F1]",
    baixo: "border-[#1DD69A]",
};

export default function TopSwitchesCPU() {
    const [switches, setSwitches] = useState<TopSwitchCPUItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function carregar() {
            try {
                const data = await getTopSwitchesCPU(5);
                setSwitches(data);
            } catch (e) {
                console.error(e);
                setSwitches([]);
            } finally {
                setLoading(false);
            }
        }

        carregar();
    }, []);

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

                {/* Título + subtítulo */}
                <div>
                    <h3 className="text-white text-md">Top switches - CPU</h3>
                    <p className="text-gray-400 text-sm">
                        SecurityOne • Utilização de CPU dos Switches
                    </p>
                </div>

                {/* Legenda de severidade */}
                <div className="flex flex-col items-end gap-2 text-sm text-gray-400">
                    <span className="text-gray-400">
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
            {loading ? (
                <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
            ) : (
                <div className="grid grid-cols-5 gap-4">
                    {switches.map((sw) => (
                        <div
                            key={sw.hostid}
                            className={`rounded-xl border bg-[#0A0617]
              flex flex-col items-center justify-center h-32
              transition-all
              ${SEVERITY_STYLE[sw.severity]}`}
                        >
                            <span className="text-gray-300 text-xs mb-1">
                                {sw.name}
                            </span>

                            <span className="text-white text-lg font-semibold">
                                {sw.cpu.toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
