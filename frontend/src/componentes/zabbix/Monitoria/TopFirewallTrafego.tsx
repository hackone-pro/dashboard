import { useEffect, useState } from "react";
import {
  getZabbixFirewalls,
  FirewallItem,
} from "../../../services/zabbix/firewalls.service";
import SeveridadeBadge from "./SeveridadeBadge";

export default function FirewallsRamCard() {
  const [loading, setLoading] = useState(true);
  const [firewalls, setFirewalls] = useState<FirewallItem[]>([]);
  const MAX_MBPS = 50;

  async function carregar() {
    try {
      setLoading(true);
      const data = await getZabbixFirewalls();
      setFirewalls(data);
    } catch (err) {
      console.error("Erro Firewalls:", err);
      setFirewalls([]);
    } finally {
      setLoading(false);
    }
  }

  function bytesToGB(bytes?: number | null) {
    if (!bytes || bytes <= 0) return "0";
    return (bytes / 1024 / 1024 / 1024).toFixed(1);
  }

  function severidadePorCPU(cpu?: number | null) {
    if (typeof cpu !== "number") return "baixo";
    if (cpu >= 80) return "critico";
    if (cpu >= 60) return "alto";
    if (cpu >= 30) return "medio";
    return "baixo";
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-white text-md">
            Top Firewalls – Saúde e Tráfego
          </h3>
          <p className="text-gray-400 text-sm">
            Consumo de Recursos
          </p>
        </div>
      </div>

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
              <th className="py-2 px-3 font-normal">Firewall</th>
              <th className="font-normal">Tráfego (Mbps)</th>
              <th className="font-normal">CPU %</th>
              <th className="font-normal">Sessões</th>
              <th className="font-normal">Severidade</th>
            </tr>
          </thead>

          <tbody>
            {firewalls.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-6 text-gray-500 italic text-center"
                >
                  Nenhum firewall encontrado
                </td>
              </tr>
            ) : (
              firewalls.map((fw) => (
                <tr
                  key={fw.id}
                  className="border-b border-white/5 hover:bg-[#ffffff05] transition"
                >
                  {/* Firewall */}
                  <td className="px-3 py-3 text-gray-400">
                    {fw.name}
                  </td>

                  {/* TRAFEGO */}
                  <td>
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-24 h-2 bg-white/10 rounded">
                        <div
                          className="h-2 rounded bg-[#6366F1]"
                          style={{
                            width: `${Math.min(
                              ((fw.traffic_total_mbps ?? 0) / MAX_MBPS) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>

                      <div className="text-gray-400 text-[11px]">
                        {fw.traffic_total_mbps?.toFixed(2) ?? 0} Mbps
                      </div>
                    </div>
                  </td>

                  {/* CPU */}
                  <td>
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-24 h-2 bg-white/10 rounded">
                        <div
                          className="h-2 rounded bg-[#A855F7]"
                          style={{
                            width: `${fw.cpu ?? 0}%`,
                          }}
                        />
                      </div>

                      <div className="text-gray-400 text-[11px]">
                        {fw.cpu?.toFixed(1) ?? 0}%
                      </div>
                    </div>
                  </td>

                  {/* Sessões */}
                  <td className="text-gray-400">
                    {fw.sessions ?? "—"}
                  </td>

                  {/* Severidade */}
                  <td className="text-center">
                    <SeveridadeBadge
                      nivel={severidadePorCPU(fw.cpu)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
