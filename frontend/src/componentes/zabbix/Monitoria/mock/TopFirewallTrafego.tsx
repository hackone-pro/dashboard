import SeveridadeBadge from "../SeveridadeBadge";

export default function FirewallsRamCard() {
  const MAX_MBPS = 50;

  // ================================
  // DADOS FAKE
  // ================================
  const firewalls = [
    {
      id: "1",
      name: "FW-HQ-SP",
      traffic_total_mbps: 42.5,
      cpu: 86.2,
      sessions: 14250,
    },
    {
      id: "2",
      name: "FW-DATACENTER",
      traffic_total_mbps: 37.1,
      cpu: 64.7,
      sessions: 11800,
    },
    {
      id: "3",
      name: "FW-FILIAL-RJ",
      traffic_total_mbps: 18.4,
      cpu: 42.9,
      sessions: 6340,
    },
    {
      id: "4",
      name: "FW-DMZ",
      traffic_total_mbps: 12.8,
      cpu: 28.5,
      sessions: 2910,
    },
    {
      id: "5",
      name: "FW-BACKUP",
      traffic_total_mbps: 4.2,
      cpu: 9.4,
      sessions: 740,
    },
  ];

  function severidadePorCPU(cpu?: number | null) {
    if (typeof cpu !== "number") return "baixo";
    if (cpu >= 80) return "critico";
    if (cpu >= 60) return "alto";
    if (cpu >= 30) return "medio";
    return "baixo";
  }

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
          {firewalls.map((fw) => (
            <tr
              key={fw.id}
              className="border-b border-white/5 hover:bg-[#ffffff05] transition"
            >
              {/* Firewall */}
              <td className="px-3 py-3 text-gray-400">{fw.name}</td>

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
                    {fw.traffic_total_mbps.toFixed(2)} Mbps
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
                        width: `${fw.cpu}%`,
                      }}
                    />
                  </div>

                  <div className="text-gray-400 text-[11px]">
                    {fw.cpu.toFixed(1)}%
                  </div>
                </div>
              </td>

              {/* Sessões */}
              <td className="text-gray-400">{fw.sessions}</td>

              {/* Severidade */}
              <td className="text-center">
                <SeveridadeBadge nivel={severidadePorCPU(fw.cpu)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}