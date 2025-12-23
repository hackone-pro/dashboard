import { useEffect, useState } from "react";
import { getTopHostsCPU, TopHostCPUItem } from "../../../services/zabbix/top-hosts-cpu";

type HostCPU = {
  name: string;
  cpu: number; // percentual
};

const TOTAL_BLOCKS = 20;

export default function TopHostsCPU() {
  const [hosts, setHosts] = useState<HostCPU[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarHostsCPU() {
    try {
      const data: TopHostCPUItem[] = await getTopHostsCPU(3);

      const normalizado: HostCPU[] = data.map((h) => ({
        name: h.name,
        cpu: Number(h.cpu.toFixed(2)),
      }));

      setHosts(normalizado);
    } catch (error) {
      console.error("Erro ao carregar Top Hosts CPU:", error);
      setHosts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarHostsCPU();
  }, []);

  return (
    <div className="h-full flex flex-col">
      
      {/* Título */}
      <h3 className="text-white text-md mb-1">CPU</h3>
      <p className="text-gray-400 text-sm mb-4">Top hosts por CPU %</p>

      {/* Loading */}
      {loading && (
        <p className="text-gray-500 text-sm">Carregando dados...</p>
      )}

      {/* Lista */}
      {!loading && (
        <div className="flex flex-col gap-5">
          {hosts.length === 0 && (
            <p className="text-gray-500 text-sm">
              Nenhum dado de CPU disponível
            </p>
          )}

          {hosts.map((host) => {
            const activeBlocks = Math.round(
              (host.cpu / 100) * TOTAL_BLOCKS
            );

            return (
              <div key={host.name}>
                
                {/* Cabeçalho do host */}
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{host.name}</span>
                  <span className="text-gray-400">{host.cpu}%</span>
                </div>

                {/* Barra segmentada */}
                <div className="flex gap-1">
                  {Array.from({ length: TOTAL_BLOCKS }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-4 w-full rounded-sm ${
                        i < activeBlocks
                          ? "bg-gradient-to-t from-purple-700 to-purple-500"
                          : "bg-[#2a2a2a]"
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
