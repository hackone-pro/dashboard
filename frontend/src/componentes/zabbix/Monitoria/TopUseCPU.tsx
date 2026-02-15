import { useEffect, useState } from "react";
import {
  getTopHostsCPU,
  TopHostCPUItem,
} from "../../../services/zabbix/top-hosts-cpu";
import SeveridadeBadge from "./SeveridadeBadge";

export default function TopUseCPU() {
  const [loading, setLoading] = useState(true);
  const [hosts, setHosts] = useState<TopHostCPUItem[]>([]);

  async function carregar() {
    try {
      setLoading(true);
      const data = await getTopHostsCPU(5);
      setHosts(data);
    } catch (err) {
      console.error("Erro Top Hosts CPU:", err);
      setHosts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function severidadePorCPU(cpu: number) {
    if (cpu >= 80) return "critico";
    if (cpu >= 60) return "alto";
    if (cpu >= 30) return "medio";
    return "baixo";
  }

  return (
    <div className="cards rounded-2xl p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-white text-md">Top hosts por uso</h3>
          <p className="text-gray-400 text-sm">
            Utilização em tempo real
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
        <table className="w-full text-sm text-gray-400 text-center">
          <thead className="fundo-dashboard">
            <tr className="text-white">
              <th className="text-center py-2 px-3 font-normal">Host</th>
              <th className="text-center font-normal">CPU</th>
              <th className="text-center font-normal">Uso de RAM</th>
              <th className="text-center font-normal">Processos</th>
              <th className="text-center font-normal">Severidade</th>
            </tr>
          </thead>

          <tbody>
            {hosts.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-6 text-gray-500 italic"
                >
                  Nenhum host encontrado
                </td>
              </tr>
            ) : (
              hosts.map((h) => {
                const ramPercent =
                  typeof h.ram_used_gb === "number" &&
                    typeof h.ram_total_gb === "number" &&
                    h.ram_total_gb > 0
                    ? (h.ram_used_gb / h.ram_total_gb) * 100
                    : null;

                return (
                  <tr
                    key={h.hostid}
                    className="border-b border-white/5 hover:bg-[#ffffff05] transition"
                  >
                    {/* Host */}
                    <td className="px-3 py-3 text-gray-400">{h.name}</td>

                    {/* CPU */}
                    <td>
                      <div className="flex items-center gap-2 justify-center">
                        <div className="w-24 h-2 bg-white/10 rounded">
                          <div
                            className="h-2 rounded bg-[#A855F7]"
                            style={{ width: `${Math.min(h.cpu, 100)}%` }}
                          />
                        </div>
                        <div className="text-gray-400 text-[11px]">
                          {h.cpu.toFixed(1)}%
                        </div>
                      </div>
                    </td>

                    {/* RAM */}
                    <td>
                      {ramPercent !== null ? (
                        <div className="flex items-center gap-2 justify-center">
                          <div className="w-24 h-2 bg-white/10 rounded">
                            <div
                              className="h-2 rounded bg-[#6366F1]"
                              style={{ width: `${Math.min(ramPercent, 100)}%` }}
                            />
                          </div>

                          <div className="text-gray-400 text-[11px] whitespace-nowrap">
                            {ramPercent.toFixed(1)}%
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}

                    </td>

                    {/* Processos */}
                    <td className="text-gray-400">
                      {h.processes ?? "—"}
                    </td>

                    {/* Severidade */}
                    <td className="text-center">
                      <SeveridadeBadge nivel={severidadePorCPU(h.cpu)} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
