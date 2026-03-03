import { useEffect, useState } from "react";
import {
  getZabbixLinksWan,
  LinkWanItem,
} from "../../../services/zabbix/links-wan";
import SeveridadeBadge from "./SeveridadeBadge";

export default function LinksWanCard() {
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<LinkWanItem[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const porPagina = 4;
  const totalPaginas = Math.ceil(links.length / porPagina);

  const linksPaginados = links.slice(
    (paginaAtual - 1) * porPagina,
    paginaAtual * porPagina
  );

  async function carregar() {
    try {
      setLoading(true);
      const res = await getZabbixLinksWan();

      const ordenados = [...res.links].sort(
        (a, b) => (Number(b.trafego_mbps) || 0) - (Number(a.trafego_mbps) || 0)
      );

      setLinks(ordenados);
      setPaginaAtual(1);
    } catch (err) {
      console.error("Erro Links WAN:", err);
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="cards rounded-2xl p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-white text-md">Links WAN / Internet</h3>
          <p className="text-gray-400 text-sm">
            Consumo de Links de Internet
          </p>
        </div>
      </div>

      {/* Skeleton */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-full h-8 bg-white/5 animate-pulse rounded"
            />
          ))}
        </div>
      ) : (
        <>
          <table className="w-full text-sm text-gray-400 text-center">
            <thead className="fundo-dashboard">
              <tr className="text-white">
                <th className="text-center py-2 px-3">Device</th>
                <th className="text-center">Link</th>
                <th className="text-center">Tráfego (Mbps)</th>
                <th className="text-center">Capacidade</th>
                <th className="text-center">Severidade</th>
              </tr>
            </thead>

            <tbody>
              {linksPaginados.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-6 text-gray-500 italic"
                  >
                    Nenhum link WAN encontrado
                  </td>
                </tr>
              ) : (
                linksPaginados.map((l, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-white/5 hover:bg-[#ffffff05] transition"
                  >
                    <td className="px-3 py-3">{l.firewall}</td>
                    <td>{l.link}</td>

                    {/* Barra de Uso */}
                    <td>
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-24 h-2 bg-white/10 rounded">
                          <div
                            className={`h-2 rounded ${l.severidade === "critico"
                                ? "bg-[#EC4899]"
                                : l.severidade === "alto"
                                  ? "bg-[#A855F7]"
                                  : l.severidade === "medio"
                                    ? "bg-[#6366F1]"
                                    : "bg-[#1DD69A]"
                              }`}
                            style={{
                              width: `${Math.min(
                                l.uso_percentual ?? 0,
                                100
                              )}%`,
                            }}
                          />
                        </div>

                        <div className="text-gray-400 text-[11px] whitespace-nowrap">
                          {l.trafego_mbps.toFixed(1)} Mbps
                        </div>
                      </div>
                    </td>

                    {/* Capacidade */}
                    <td className="text-gray-400">
                      {l.capacidade_mbps >= 1000
                        ? `${(l.capacidade_mbps / 1000).toFixed(1)} Gbps`
                        : `${l.capacidade_mbps} Mbps`}
                    </td>

                    <td className="text-center">
                      <SeveridadeBadge nivel={l.severidade} />
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
}