import { useEffect, useState } from "react";
import { getTopAgents, TopAgentItem } from "../../../services/wazuh/topagents.service";

interface TopAgentsCardProps {
  dias: string; // 👈 vem do RiskLevel (global)
  onChangeFiltro?: (valor: string | null) => void; // 👈 novo (já existe na sua versão)
}

export default function TopAgentsCard({ dias, onChangeFiltro }: TopAgentsCardProps) {
  const [filtroLocal, setFiltroLocal] = useState<string | null>(null);
  const diasEfetivo = filtroLocal || dias; // 👈 prioridade local

  const [agentes, setAgentes] = useState<TopAgentItem[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  // 🔹 Busca os dados conforme o filtro efetivo
  useEffect(() => {
    let ativo = true;
    async function fetchData() {
      try {
        setCarregando(true);
        setErro(null);
        const data = await getTopAgents(diasEfetivo);
        if (!ativo) return;
        setAgentes(data);
      } catch (e: any) {
        if (!ativo) return;
        setErro(e?.message ?? "Erro ao buscar top agentes");
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    fetchData();
    return () => {
      ativo = false;
    };
  }, [diasEfetivo]); // 👈 refaz a busca sempre que mudar o filtro efetivo

  return (
    <div className="cards p-6 rounded-2xl shadow-lg flex-grow transition-all duration-300">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-sm text-white">Top Hosts</h3>

        {/* 🔹 Select interno com opção "Usar global" */}
        <select
          className="bg-[#0d0c22] text-white text-xs px-2 py-1 rounded-sm border border-[#cacaca31]"
          value={filtroLocal || dias}
          onChange={(e) => {
            const val = e.target.value;
            const novoValor = val === dias ? null : val;
            setFiltroLocal(novoValor);
            onChangeFiltro?.(novoValor); // 👈 notifica o RiskLevel
          }}
        >
          <option value={dias}>Usar global ({dias} dias)</option>
          <option value="1">24 horas</option>
          <option value="2">48 horas</option>
          <option value="7">7 dias</option>
          <option value="15">15 dias</option>
          <option value="30">30 dias</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {erro && (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2 mb-2">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-10 bg-[#ffffff0a] rounded-md" />
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-300 border-collapse py-3">
            <thead>
              <tr className="text-xs text-gray-400 top-agents">
                <th className="text-left w-[40%] pl-2 pb-3">Hosts</th>
                <th className="w-[15%] text-center">
                  <span className="text-pink-500 badge-pink badge rounded-md py-0.5 px-2">
                    Crítico
                  </span>
                </th>
                <th className="w-[15%] text-center">
                  <span className="text-[#A855F7] badge-high badge rounded-md py-0.5 px-3">
                    Alto
                  </span>
                </th>
                <th className="w-[15%] text-center">
                  <span className="text-[#6366F1] badge-darkpink badge rounded-md py-0.5 px-2">
                    Médio
                  </span>
                </th>
                <th className="w-[15%] text-center">
                  <span className="text-[#1DD69A] badge-green badge rounded-md py-0.5 px-2">
                    Baixo
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {agentes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-xs text-gray-500 py-4">
                    Nenhum agente encontrado
                  </td>
                </tr>
              ) : (
                agentes.map((item, i) => (
                  <tr
                    key={`${item.agent_name}-${i}`}
                    className="hover:bg-[#ffffff12] transition-all border-b border-[#ffffff1e]"
                  >
                    <td className="px-2 py-2">
                      <div className="text-[11px] text-gray-400">
                        {item.total_alertas.toLocaleString("pt-BR")} alertas
                      </div>
                      <div className="font-medium text-gray-200">{item.agent_name}</div>
                    </td>
                    <td className="text-center">{item.severidade?.Crítico ?? 0}</td>
                    <td className="text-center">{item.severidade?.Alto ?? 0}</td>
                    <td className="text-center">{item.severidade?.Médio ?? 0}</td>
                    <td className="text-center">{item.severidade?.Baixo ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
