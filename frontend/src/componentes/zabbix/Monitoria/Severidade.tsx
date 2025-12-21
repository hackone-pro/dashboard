import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import GraficoDonutSimples from "../../graficos/GraficoDonutSimples";
import { getZabbixSeveridade } from "../../../services/zabbix/severidade";
import { useTenant } from "../../../context/TenantContext";

export type SeveridadeDonutCardRef = {
    carregar: () => void;
};

type SeveridadeResponse = {
    total: number;
    severity: {
        warning: number;
        high: number;
        disaster: number;
    };
};

const SeveridadeDonutCard = forwardRef<SeveridadeDonutCardRef>((props, ref) => {
    const { tenantAtivo } = useTenant();

    const [dados, setDados] = useState<SeveridadeResponse | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const carregar = async () => {
        if (!tenantAtivo) return;

        try {
            setCarregando(true);
            setErro(null);
            const res = await getZabbixSeveridade();
            setDados(res);
        } catch (e: any) {
            setErro(e?.message ?? "Erro ao carregar severidade");
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregar();
    }, [tenantAtivo]);

    useImperativeHandle(ref, () => ({
        carregar,
    }));

    if (erro) {
        return (
            <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2">
                {erro}
            </div>
        );
    }

    if (carregando) {
        return (
            <div className="flex items-center">
                <div className="w-[220px] h-[220px] rounded-full bg-[#ffffff0a] animate-pulse" />
                <div className="flex flex-col gap-2 ml-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-xs bg-[#ffffff14] animate-pulse" />
                            <div className="h-3 w-20 bg-[#ffffff14] rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!dados || dados.total === 0) {
        return <div className="text-xs text-gray-400">Nenhum evento ativo.</div>;
    }

    const labels = ["High", "Warning", "Disaster"];
    const series = [
        dados.severity.high,
        dados.severity.warning,
        dados.severity.disaster,
    ];

    const cores = [
        "#A855F7", // High (vermelho)
        "#1DD69A", // Warning (amarelo)
        "#F914AD", // Disaster (roxo)
    ];

    return (
        <div className="flex items-center">

            {/* Donut + total */}
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
