import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { getServidoresList } from "../../../services/wazuh/servidores.service";
import { useTenant } from "../../../context/TenantContext";

import TooltipRight from "../../TooltipRight";

export type ServidoresCardRef = {
    carregar: () => void;
};

type ServidorMonitorItem = {
    nome: string;
    ip: string | null;
    timestamp: string | null;
    status: string;
};

function getStatus(timestamp: string | null) {
    if (!timestamp) return "🔴";

    const logDate = new Date(timestamp).getTime();
    const diffMinutes = (Date.now() - logDate) / 1000 / 60;

    if (diffMinutes <= 59) return "🟢";
    if (diffMinutes <= 119) return "🟡";
    return "🔴";
}

function getStatusIcon(status: string) {
    if (status === "🟢") return "/assets/img/indicador-on.png";
    if (status === "🟡") return "/assets/img/indicador-warning.png";
    return "/assets/img/indicador-off.png";
}

const ServidoresCard = forwardRef<ServidoresCardRef>((props, ref) => {
    const { tenantAtivo } = useTenant();

    const [loading, setLoading] = useState(true);
    const [servidores, setServidores] = useState<ServidorMonitorItem[]>([]);
    const [paginaAtual, setPaginaAtual] = useState(1);

    const porPagina = 5;

    // 🔹 CONTRATO VINDO DO TENANT
    const servidoresContratados =
        tenantAtivo?.contract?.servers ?? 0;

    const totalPaginas = Math.ceil(servidores.length / porPagina);
    const servidoresPaginados = servidores.slice(
        (paginaAtual - 1) * porPagina,
        paginaAtual * porPagina
    );

    async function carregar() {
        try {
            setLoading(true);

            const lista = await getServidoresList();

            const tabela = lista
                .filter(
                    (srv) =>
                        srv.ip &&
                        srv.ip.trim() !== "" &&
                        srv.ip !== "-"
                )
                .map((srv) => ({
                    nome: srv.nome,
                    ip: srv.ip,
                    timestamp: srv.timestamp ?? null,
                    status: getStatus(srv.timestamp ?? null),
                }))
                .sort((a, b) => {
                    if (!a.timestamp && !b.timestamp) return 0;
                    if (!a.timestamp) return 1;
                    if (!b.timestamp) return -1;
                    return (
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    );
                });

            setServidores(tabela);
            setPaginaAtual(1);
        } catch (err) {
            console.error("Erro ServidoresCard:", err);
        } finally {
            setLoading(false);
        }
    }

    useImperativeHandle(ref, () => ({
        carregar,
    }));

    // 🔹 RECARREGA AO TROCAR TENANT
    useEffect(() => {
        if (tenantAtivo) carregar();
    }, [tenantAtivo]);

    return (
        <div className="cards rounded-2xl p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-white text-sm font-medium">
                    Servidores
                </h3>

                <div className="flex items-center gap-4">
                    {!loading && (
                        <span className="text-xs text-gray-400">
                            <strong className="text-white">
                                {servidores.length}
                            </strong>{" "}
                            /{" "}
                            <strong className="text-white">
                                {servidoresContratados}
                            </strong>{" "}
                            contratados
                        </span>
                    )}

                    <button
                        onClick={carregar}
                        className="text-sm border border-[#1D1929] bg-[#0A0617] hover:bg-gray-700 text-gray-400 px-3 py-1 rounded-md transition"
                    >
                        Atualizar
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div
                            key={i}
                            className="w-full h-6 bg-white/5 animate-pulse rounded"
                        />
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
                            {servidoresPaginados.length === 0 ? (
                                <tr className="border-b border-white/5">
                                    <td
                                        colSpan={4}
                                        className="text-center py-6 text-gray-500 italic"
                                    >
                                        Nenhum dado de servidor encontrado
                                    </td>
                                </tr>
                            ) : (
                                servidoresPaginados.map((srv, index) => (
                                    <tr
                                        key={index}
                                        className="border-b border-white/5 hover:bg-[#ffffff05] transition-colors"
                                    >
                                        <td className="px-3 py-3">{srv.nome}</td>
                                        <td>{srv.ip}</td>

                                        <td className="text-center">
                                            <TooltipRight
                                                status={srv.status}
                                                text={
                                                    srv.status === "🟢"
                                                        ? "Recebendo logs\n(menos de 1h)"
                                                        : srv.status === "🟡"
                                                            ? "Sem receber logs\n(mais de 1h)"
                                                            : "Sem receber logs\n(mais de 2h)"
                                                }
                                            >
                                                <img
                                                    src={getStatusIcon(srv.status)}
                                                    alt="status"
                                                    className="w-6 h-3 mx-auto"
                                                />
                                            </TooltipRight>
                                        </td>

                                        <td className="text-center">
                                            {srv.timestamp
                                                ? new Date(srv.timestamp).toLocaleString()
                                                : "-"}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <div className="flex justify-between items-center mt-4">
                        <button
                            disabled={paginaAtual === 1}
                            onClick={() =>
                                setPaginaAtual((p) => Math.max(1, p - 1))
                            }
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
                            onClick={() =>
                                setPaginaAtual((p) =>
                                    Math.min(totalPaginas, p + 1)
                                )
                            }
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

export default ServidoresCard;
