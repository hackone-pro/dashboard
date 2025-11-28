import {
    forwardRef,
    useImperativeHandle,
    useState,
    useEffect
} from "react";

import { getEdrList } from "../../../services/wazuh/edr.service";
import TooltipRight from "../../TooltipRight";
import { useTenant } from "../../../context/TenantContext";

export type EdrCardRef = {
    carregar: () => void;
};

type EdrItemMonitor = {
    deviceName: string;
    timestamp: string | null;
    status: string;
};

function formatIntegrationName(name: string) {
    const map: Record<string, string> = {
        "ms-graph": "Microsoft Defender",
        "microsoft-graph": "Microsoft Defender",
        "graph": "Microsoft Defender",
    };

    return map[name] || name;
}

function getStatusByTimestamp(timestamp: string | null) {
    if (!timestamp) return "🔴";
    const diffMinutes = (Date.now() - new Date(timestamp).getTime()) / 60000;
    if (diffMinutes <= 59) return "🟢";
    if (diffMinutes <= 119) return "🟡";
    return "🔴";
}

function getStatusIcon(status: string) {
    if (status === "🟢") return "/assets/img/indicador-on.png";
    if (status === "🟡") return "/assets/img/indicador-warning.png";
    return "/assets/img/indicador-off.png";
}

const EdrCard = forwardRef<EdrCardRef>((props, ref) => {

    const { tenantAtivo, loading: loadingTenant } = useTenant();

    // 🔒 PERMISSÃO — apenas este cliente pode ver EDR
    const permitido =
        tenantAtivo?.cliente_name === "FEPA-PRD-FNL-0001";

    const [loading, setLoading] = useState(true);
    const [itens, setItens] = useState<EdrItemMonitor[]>([]);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const porPagina = 5;

    const totalPaginas = Math.ceil(itens.length / porPagina);
    const itensPaginados = itens.slice(
        (paginaAtual - 1) * porPagina,
        paginaAtual * porPagina
    );

    async function carregar() {
        try {
            setLoading(true);

            const logs = await getEdrList();
            const uniqueMap = new Map<string, EdrItemMonitor>();

            logs.forEach((item) => {
                const integration = item.deviceName ?? "-";

                if (!uniqueMap.has(integration)) {
                    uniqueMap.set(integration, {
                        deviceName: formatIntegrationName(integration),
                        timestamp: item.timestamp ?? null,
                        status: getStatusByTimestamp(item.timestamp ?? null),
                    });
                }
            });

            const tabela = Array.from(uniqueMap.values()).sort((a, b) => {
                if (!a.timestamp && !b.timestamp) return 0;
                if (!a.timestamp) return 1;
                if (!b.timestamp) return -1;
                return new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime();
            });

            setItens(tabela);

        } catch (err) {
            console.error("Erro EdrCard:", err);
        } finally {
            setLoading(false);
        }
    }

    useImperativeHandle(ref, () => ({
        carregar,
    }));

    useEffect(() => {
        if (permitido) carregar();
    }, [tenantAtivo]);

    // 🔵 Tenant ainda carregando
    if (loadingTenant) {
        return (
            <div className="cards rounded-2xl p-6">
                <h3 className="text-white text-sm mb-4">EDR</h3>
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="w-full h-6 bg-white/5 animate-pulse rounded" />
                    ))}
                </div>
            </div>
        );
    }

    // 🔒 Não permitido — layout padrão
    if (!permitido) {
        return (
            <div className="cards rounded-2xl p-6">
                <h3 className="text-white text-sm mb-4">EDR</h3>

                <table className="w-full text-xs text-gray-400">
                    <thead className="fundo-dashboard">
                        <tr className="text-white">
                            <th className="text-left py-2 px-3">Origem</th>
                            <th className="text-center py-2">Status</th>
                            <th className="text-center py-2">Último Log</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr className="border-b border-white/5">
                            <td colSpan={3} className="text-center py-6 text-gray-500">
                                Nenhum dado de EDR encontrado
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="cards rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-sm">EDR</h3>

                <button
                    onClick={carregar}
                    className="text-sm border border-[#1D1929] bg-[#0A0617] hover:bg-gray-700 text-gray-400 px-3 py-1 rounded-md transition"
                >
                    Atualizar
                </button>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="w-full h-6 bg-white/5 animate-pulse rounded" />
                    ))}
                </div>
            ) : (
                <>
                    <table className="w-full text-xs text-gray-400">
                        <thead className="fundo-dashboard">
                            <tr className="text-white">
                                <th className="text-left py-2 px-3">Origem</th>
                                <th className="text-center py-2">Status</th>
                                <th className="text-center py-2">Último Log</th>
                            </tr>
                        </thead>

                        <tbody>
                            {itensPaginados.length === 0 ? (
                                <tr className="border-b border-white/5">
                                    <td colSpan={3} className="text-center py-6 text-gray-500 italic">
                                        Nenhuma EDR encontrada
                                    </td>
                                </tr>
                            ) : (
                                itensPaginados.map((edr, index) => (
                                    <tr
                                        key={index}
                                        className="border-b border-white/5 hover:bg-[#ffffff05] transition-colors"
                                    >
                                        <td className="px-3 py-3">{edr.deviceName}</td>

                                        <td className="text-center">
                                            <TooltipRight
                                                status={edr.status}
                                                text={
                                                    edr.status === "🟢"
                                                        ? "Recebendo logs\n(menos de 1h)"
                                                        : edr.status === "🟡"
                                                            ? "Sem receber logs\n(menos de 2h)"
                                                            : "Sem receber logs\n(mais de 2h)"
                                                }
                                            >
                                                <img
                                                    src={getStatusIcon(edr.status)}
                                                    alt="status"
                                                    className="w-6 h-3 mx-auto"
                                                />
                                            </TooltipRight>
                                        </td>

                                        <td className="text-center">
                                            {edr.timestamp
                                                ? new Date(edr.timestamp).toLocaleString()
                                                : "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Paginação */}
                    <div className="flex justify-between items-center mt-4">
                        <button
                            disabled={paginaAtual === 1}
                            onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                            className={`px-3 py-1 rounded-md text-xs border text-gray-400 
                                ${paginaAtual === 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5"}`}
                        >
                            ← Anterior
                        </button>

                        <span className="text-gray-400 text-xs">
                            Página {paginaAtual} de {totalPaginas}
                        </span>

                        <button
                            disabled={paginaAtual === totalPaginas}
                            onClick={() =>
                                setPaginaAtual((p) => Math.min(totalPaginas, p + 1))
                            }
                            className={`px-3 py-1 rounded-md text-xs border text-gray-400 
                                ${paginaAtual === totalPaginas ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5"}`}
                        >
                            Próxima →
                        </button>
                    </div>
                </>
            )}
        </div>
    );
});

export default EdrCard;
