import { useState } from "react";
import SeveridadeBadge from "../SeveridadeBadge";

type LinkWanItem = {
  firewall: string;
  link: string;
  trafego_mbps: number;
  capacidade_mbps: number;
  uso_percentual: number;
  severidade: "baixo" | "medio" | "alto" | "critico";
};

export default function LinksWanCard() {

  // ===============================
  // DADOS FAKE
  // ===============================
  const links: LinkWanItem[] = [
    {
      firewall: "FW-HQ-SP",
      link: "Link Principal",
      trafego_mbps: 840,
      capacidade_mbps: 1000,
      uso_percentual: 84,
      severidade: "alto",
    },
    {
      firewall: "FW-HQ-SP",
      link: "Link Backup",
      trafego_mbps: 120,
      capacidade_mbps: 500,
      uso_percentual: 24,
      severidade: "baixo",
    },
    {
      firewall: "FW-DATACENTER",
      link: "Link Cloud",
      trafego_mbps: 620,
      capacidade_mbps: 1000,
      uso_percentual: 62,
      severidade: "medio",
    },
    {
      firewall: "FW-FILIAL-RJ",
      link: "Internet Filial",
      trafego_mbps: 310,
      capacidade_mbps: 500,
      uso_percentual: 62,
      severidade: "medio",
    },
    {
      firewall: "FW-BRANCH-SUL",
      link: "Internet MPLS",
      trafego_mbps: 90,
      capacidade_mbps: 200,
      uso_percentual: 45,
      severidade: "baixo",
    },
    {
      firewall: "FW-DATACENTER",
      link: "Link Backup DC",
      trafego_mbps: 920,
      capacidade_mbps: 1000,
      uso_percentual: 92,
      severidade: "critico",
    },
  ];

  const [paginaAtual, setPaginaAtual] = useState(1);

  const porPagina = 4;
  const totalPaginas = Math.ceil(links.length / porPagina);

  const linksPaginados = links.slice(
    (paginaAtual - 1) * porPagina,
    paginaAtual * porPagina
  );

  return (
    <div className="cards rounded-2xl p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-white text-md">
            Links WAN / Internet
          </h3>
          <p className="text-gray-400 text-sm">
            Consumo de Links de Internet
          </p>
        </div>
      </div>

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
          {linksPaginados.map((l, idx) => (

            <tr
              key={idx}
              className="border-b border-white/5 hover:bg-[#ffffff05] transition"
            >

              <td className="px-3 py-3">
                {l.firewall}
              </td>

              <td>
                {l.link}
              </td>

              {/* Barra de Uso */}
              <td>

                <div className="flex items-center gap-2 justify-center">

                  <div className="w-24 h-2 bg-white/10 rounded">

                    <div
                      className={`h-2 rounded
                        ${
                          l.severidade === "critico"
                            ? "bg-[#EC4899]"
                            : l.severidade === "alto"
                            ? "bg-[#A855F7]"
                            : l.severidade === "medio"
                            ? "bg-[#6366F1]"
                            : "bg-[#1DD69A]"
                        }
                      `}
                      style={{
                        width: `${Math.min(
                          l.uso_percentual,
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
                  : `${l.capacidade_mbps} Mbps`
                }

              </td>

              <td className="text-center">
                <SeveridadeBadge nivel={l.severidade} />
              </td>

            </tr>

          ))}
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
            ${
              paginaAtual === 1
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-white/5"
            }
          `}
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
            ${
              paginaAtual === totalPaginas
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-white/5"
            }
          `}
        >
          Próxima →
        </button>

      </div>

    </div>
  );
}