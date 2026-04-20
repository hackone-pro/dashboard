import { useEffect } from "react";
import SeveridadeBadge from "../SeveridadeBadge";

type AlertaZabbixItem = {
  horario: string;
  host: string;
  problema: string;
  severidade: "baixo" | "medio" | "alto" | "critico";
  duracao: string;
};

interface Props {
  onDadosCarregados?: (alertas: AlertaZabbixItem[]) => void;
}

export default function AlertasZabbix({ onDadosCarregados }: Props) {

  // ==============================
  // ALERTAS FAKE
  // ==============================
  const alertas: AlertaZabbixItem[] = [
    {
      horario: "18:02",
      host: "FW-HQ-SP",
      problema: "High CPU utilization detected",
      severidade: "alto",
      duracao: "12m",
    },
    {
      horario: "17:48",
      host: "RTR-DATACENTER",
      problema: "Interface Gi0/1 packet loss detected",
      severidade: "medio",
      duracao: "25m",
    },
    {
      horario: "17:30",
      host: "SRV-DB-01",
      problema: "Disk usage above 90%",
      severidade: "critico",
      duracao: "1h 02m",
    },
    {
      horario: "17:11",
      host: "SW-CORE-01",
      problema: "High memory usage detected",
      severidade: "alto",
      duracao: "33m",
    },
    {
      horario: "16:58",
      host: "FW-FILIAL-RJ",
      problema: "VPN tunnel unstable",
      severidade: "medio",
      duracao: "40m",
    },
    {
      horario: "16:45",
      host: "RTR-BRANCH-SUL",
      problema: "Interface WAN latency high",
      severidade: "baixo",
      duracao: "18m",
    },
  ];

  useEffect(() => { onDadosCarregados?.(alertas); }, []);

  return (
    <div>

      {/* Header */}
      <div className="mb-4">
        <h3 className="text-white text-lg">
          Alertas
        </h3>

        <p className="text-gray-400 text-sm">
          Ativos com alerta: {alertas.length} ativos impactados
        </p>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto">

        <table className="w-full text-sm text-center">

          <thead className="text-white bg-[#0A0617] border border-[#231F30] rounded-md">
            <tr>
              <th className="py-3">Horário</th>
              <th>Host</th>
              <th>Problema</th>
              <th className="text-center">Severidade</th>
              <th className="text-center">Duração</th>
            </tr>
          </thead>

          <tbody>

            {alertas.map((a, idx) => (

              <tr
                key={idx}
                className="border-b border-white/5 hover:bg-white/5 transition"
              >

                <td className="py-3 text-gray-400">
                  {a.horario}
                </td>

                <td className="text-gray-400">
                  {a.host}
                </td>

                <td className="text-gray-400 truncate max-w-[420px]">
                  {a.problema}
                </td>

                <td className="text-center">
                  <SeveridadeBadge nivel={a.severidade} />
                </td>

                <td className="text-center text-gray-400">
                  {a.duracao}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}