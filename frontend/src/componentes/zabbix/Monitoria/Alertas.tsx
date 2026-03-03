import { useEffect, useState } from "react";
import { AlertaZabbixItem, getZabbixAlertas } from "../../../services/zabbix/alertas";
import SeveridadeBadge from "./SeveridadeBadge";

export default function AlertasZabbix() {
  const [alertas, setAlertas] = useState<AlertaZabbixItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    try {
      const data = await getZabbixAlertas(10);
  
      setAlertas(data.alertas);
  
    } catch (err) {
      console.error("Erro ao carregar alertas:", err);
      setAlertas([]);
    } finally {
      setLoading(false);
    }
  }
  

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-white text-lg">Alertas</h3>
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
            {loading && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-500">
                  Carregando alertas...
                </td>
              </tr>
            )}

            {!loading && alertas.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-gray-400">
                  Nenhum alerta ativo
                </td>
              </tr>
            )}

            {alertas.map((a, idx) => (
              <tr
                key={idx}
                className="border-b border-white/5 hover:bg-white/5 transition"
              >
                <td className="py-3 text-gray-400">{a.horario}</td>
                <td className="text-gray-400">{a.host}</td>
                <td className="text-gray-400 truncate max-w-[420px]">
                  {a.problema}
                </td>
                <td className="text-center">
                  <SeveridadeBadge nivel={a.severidade}/>
                </td>
                <td className="text-center text-gray-400">{a.duracao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}