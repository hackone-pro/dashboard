import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { getTopFirewalls } from "../../../services/wazuh/topfirewall.service";
import { getFirewallsList } from "../../../services/wazuh/firewalls.service";

import TooltipRight from "../../TooltipRight";

export type FirewallCardRef = {
    carregar: () => void;
};

type FirewallMonitorItem = {
    nome: string;
    ip: string;
    timestamp: string | null;
    status: string;
};

function getStatusByTimestamp(timestamp: string | null) {
    if (!timestamp) return "🔴";

    const logDate = new Date(timestamp).getTime();
    const now = Date.now();
    const diffMinutes = (now - logDate) / 1000 / 60;

    if (diffMinutes <= 59) return "🟢";
    if (diffMinutes <= 119) return "🟡";
    return "🔴";
}

// Ícones
function getStatusIcon(status: string) {
    if (status === "🟢") return "/assets/img/indicador-on.png";
    if (status === "🟡") return "/assets/img/indicador-warning.png";
    return "/assets/img/indicador-off.png";
}


const FirewallCard = forwardRef<FirewallCardRef>((props, ref) => {
    const [loading, setLoading] = useState(true);
    const [firewalls, setFirewalls] = useState<FirewallMonitorItem[]>([]);
    const [paginaAtual, setPaginaAtual] = useState(1);
    const porPagina = 5;

    const totalPaginas = Math.ceil(firewalls.length / porPagina);
    const firewallsPaginados = firewalls.slice(
        (paginaAtual - 1) * porPagina,
        paginaAtual * porPagina
    );

    async function carregar() {
        try {
            setLoading(true);

            const inventario = await getFirewallsList();
            const logs10 = await getTopFirewalls("10min");
            const logsLast = await getTopFirewalls("todos");

            const tabela = inventario
                .map((fw) => {
                    const log10 = logs10.find((l) => l.gerador === fw.id);
                    const logLast = logsLast.find((l) => l.gerador === fw.id);

                    const timestamp =
                        log10?.timestamp ??
                        logLast?.timestamp ??
                        null;

                    return {
                        nome: fw.nome,
                        ip: fw.location ?? "-",
                        timestamp,
                        status: getStatusByTimestamp(timestamp),
                    };
                })
                .sort((a, b) => {
                    if (!a.timestamp && !b.timestamp) return 0;
                    if (!a.timestamp) return 1;
                    if (!b.timestamp) return -1;
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                });

            setFirewalls(tabela);
        } catch (err) {
            console.error("Erro FirewallCard:", err);
        } finally {
            setLoading(false);
        }
    }

    useImperativeHandle(ref, () => ({
        carregar,
    }));

    useEffect(() => {
        carregar();
    }, []);

    return (
        <div className="cards rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-sm">Firewall</h3>

                <button
                    onClick={carregar}
                    className="text-sm border border-[#1D1929] bg-[#0A0617] hover:bg-gray-700 text-gray-400 px-3 py-1 rounded-md transition"
                >
                    Atualizar
                </button>
            </div>

            {/* 🔵 SKELETON */}
            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="w-full h-6 bg-white/5 animate-pulse rounded"
                        ></div>
                    ))}
                </div>
            ) : (
                <>
                    <table className="w-full text-xs text-gray-400">
                        <thead className="fundo-dashboard">
                            <tr className="text-white">
                                <th className="text-left py-2 px-3">Origem</th>
                                <th className="text-left py-2">IP de Origem</th>
                                <th className="text-center py-2">Indicador</th>
                                <th className="text-center py-2">Último Log</th>
                            </tr>
                        </thead>

                        <tbody>
                            {firewallsPaginados.length === 0 ? (
                                <tr className="border-b border-white/5">
                                    <td
                                        colSpan={4}
                                        className="text-center py-6 text-gray-500 italic"
                                    >
                                        Nenhum dado de firewall encontrado
                                    </td>
                                </tr>
                            ) : (
                                firewallsPaginados.map((fw, index) => (
                                    <tr
                                        key={index}
                                        className="border-b border-white/5 hover:bg-[#ffffff05] transition-colors"
                                    >
                                        <td className="px-3 py-3">{fw.nome}</td>
                                        <td>{fw.ip}</td>

                                        <td className="text-center">
                                            <TooltipRight
                                                status={fw.status}
                                                text={
                                                    fw.status === "🟢"
                                                        ? "Recebendo logs\n(menos de 1h)"
                                                        : fw.status === "🟡"
                                                            ? "Sem receber logs\n (mais de 1h)"
                                                            : "Sem receber logs\n (mais de 2h)"
                                                }
                                            >
                                                <img
                                                    src={getStatusIcon(fw.status)}
                                                    alt="status"
                                                    className="w-6 h-3 mx-auto"
                                                />
                                            </TooltipRight>
                                        </td>

                                        <td className="text-center">
                                            {fw.timestamp
                                                ? new Date(fw.timestamp).toLocaleString()
                                                : "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* 🔵 Paginação */}
                    <div className="flex justify-between items-center mt-4">
                        <button
                            disabled={paginaAtual === 1}
                            onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                            className={`px-3 py-1 rounded-md text-xs border text-gray-400 
                                ${paginaAtual === 1
                                    ? "opacity-30 cursor-not-allowed"
                                    : "hover:bg-white/5"
                                }`}
                        >
                            ← Anterior
                        </button>

                        <span className="text-gray-400 text-xs">
                            Página {paginaAtual} de {totalPaginas}
                        </span>

                        <button
                            disabled={paginaAtual === totalPaginas}
                            onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                            className={`px-3 py-1 rounded-md text-xs border text-gray-400 
                                ${paginaAtual === totalPaginas
                                    ? "opacity-30 cursor-not-allowed"
                                    : "hover:bg-white/5"
                                }`}
                        >
                            Próxima →
                        </button>
                    </div>
                </>
            )}
        </div>
    );
});

export default FirewallCard;
