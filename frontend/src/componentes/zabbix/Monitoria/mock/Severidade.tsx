import { forwardRef, useImperativeHandle, useEffect } from "react";
import GraficoDonutSimples from "../../../graficos/GraficoDonutSimples";

export type SeveridadeDonutCardRef = {
    carregar: () => void;
};

interface SeveridadeDonutCardProps {
    onDadosCarregados?: (dados: { total: number; high: number; warning: number; disaster: number }) => void;
}

const SeveridadeDonutCard = forwardRef<SeveridadeDonutCardRef, SeveridadeDonutCardProps>(({ onDadosCarregados }, ref) => {

    useImperativeHandle(ref, () => ({
        carregar() {}
    }));

    // ================================
    // DADOS FAKE
    // ================================
    const dados = {
        total: 27,
        severity: {
            high: 9,
            warning: 12,
            disaster: 6
        }
    };

    useEffect(() => {
        onDadosCarregados?.({ total: dados.total, ...dados.severity });
    }, []);

    const labels = ["Crítico", "Alto", "Baixo",];

    const series = [
        dados.severity.high,
        dados.severity.warning,
        dados.severity.disaster
    ];

    const cores = [
        "#F914AD",  // Disaster
        "#A855F7", // High
        "#1DD69A", // Warning
        
    ];

    return (
        <div className="flex items-center">

            {/* Donut */}
            <div className="relative w-[220px] h-[220px] flex items-center justify-center">

                <GraficoDonutSimples
                    labels={labels}
                    series={series}
                    cores={cores}
                    height={220}
                />

                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-white text-2xl font-semibold">
                        {dados.total}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                        Eventos
                    </span>
                </div>

            </div>

            {/* Legenda */}
            <div className="flex flex-col gap-2 text-xs text-gray-400 ml-6">
                {labels.map((label, i) => (
                    <div key={label} className="flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-xs"
                            style={{ backgroundColor: cores[i] }}
                        />
                        {label}
                    </div>
                ))}
            </div>

        </div>
    );
});

export default SeveridadeDonutCard;