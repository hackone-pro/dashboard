import { useEffect, useState } from "react";
import {
  getTopAgents,
  TopAgentItem,
} from "../../../services/wazuh/topagents.service";
import { useTenant } from "../../../context/TenantContext";
import { GripVertical } from "lucide-react";

interface TopAgentsCardProps {
  dias: string;
  periodo?: { from: string; to: string } | null;
  onChangeFiltro?: (valor: string | null) => void;
  isWidget?: boolean;
}

export default function TopAgentsCard({
  dias,
  periodo,
  onChangeFiltro,
  isWidget = false,
}: TopAgentsCardProps) {
  const { tenantAtivo } = useTenant();

  const [filtroLocal, setFiltroLocal] = useState<string | null>(null);
  const diasEfetivo = filtroLocal || dias;

  const [agentes, setAgentes] = useState<TopAgentItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [animReady, setAnimReady] = useState(false);

  useEffect(() => {
    if (!tenantAtivo) return;

    let ativo = true;

    async function fetchData() {
      try {
        setCarregando(true);
        setErro(null);
        setAnimReady(false);

        const inicio = Date.now();

        //  ÚNICA ALTERAÇÃO FUNCIONAL:
        const data = await getTopAgents(
          periodo
            ? { from: periodo.from, to: periodo.to }
            : { dias: diasEfetivo }
        );

        if (!ativo) return;

        const elapsed = Date.now() - inicio;
        const delay = Math.max(500 - elapsed, 0);

        setTimeout(() => {
          if (ativo) {
            setAgentes(data);
            setAnimReady(true);
          }
        }, delay);
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
  }, [diasEfetivo, periodo, tenantAtivo]);

  // -----------------------------
  // 🦴 SKELETON (ORIGINAL)
  // -----------------------------
  if (carregando) {
    return (
      <div className="cards p-6 rounded-2xl shadow-lg flex-grow transition-all duration-300">
        <div className="flex justify-between items-center mb-5">
          <div className="h-4 w-28 bg-[#ffffff12] rounded animate-pulse" />
          <div className="h-6 w-24 bg-[#ffffff12] rounded animate-pulse" />
        </div>

        <div className="w-full">
          <div className="flex text-xs text-gray-400 mb-3">
            {["Hosts", "Crítico", "Alto", "Médio", "Baixo"].map((col, i) => (
              <div
                key={i}
                className={`${
                  i === 0 ? "w-[40%] text-left pl-2" : "w-[15%] text-center"
                }`}
              >
                <div className="h-3 bg-[#ffffff12] rounded animate-pulse mx-auto w-16" />
              </div>
            ))}
          </div>

          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center border-b border-[#ffffff1e] py-2 animate-pulse"
            >
              <div className="w-[40%] pl-2">
                <div className="h-3 bg-[#ffffff12] rounded w-20 mb-1" />
                <div className="h-3 bg-[#ffffff12] rounded w-32" />
              </div>
              <div className="w-[15%] text-center">
                <div className="h-3 bg-[#ffffff12] rounded w-6 mx-auto" />
              </div>
              <div className="w-[15%] text-center">
                <div className="h-3 bg-[#ffffff12] rounded w-6 mx-auto" />
              </div>
              <div className="w-[15%] text-center">
                <div className="h-3 bg-[#ffffff12] rounded w-6 mx-auto" />
              </div>
              <div className="w-[15%] text-center">
                <div className="h-3 bg-[#ffffff12] rounded w-6 mx-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -----------------------------
  // ERRO (ORIGINAL)
  // -----------------------------
  if (erro) {
    return (
      <div className="cards p-6 rounded-2xl shadow-lg flex-grow transition-all duration-300">
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2">
          {erro}
        </div>
      </div>
    );
  }

  return (
    <div className="cards p-6 rounded-2xl shadow-lg flex-grow transition-all duration-300 relative">

      {/* 🔹 HEADER — ORIGINAL */}
      <div className="flex justify-between items-center mb-5 relative z-20">
        <div className="flex items-center gap-2">
          {isWidget && (
            <GripVertical
              size={18}
              className="drag-handle cursor-grab active:cursor-grabbing text-white/50 hover:text-white transition"
            />
          )}
          <h3 className="text-sm text-white">Top Hosts</h3>
        </div>

        <select
          className={`bg-[#0d0c22] text-white text-xs px-2 py-1 rounded-sm border border-[#cacaca31]
            ${isWidget ? "mr-8" : ""} 
          `}
          value={filtroLocal || dias}
          onChange={(e) => {
            const val = e.target.value;
            const novoValor = val === dias ? null : val;
            setFiltroLocal(novoValor);
            onChangeFiltro?.(novoValor);
          }}
          disabled={!!periodo}
        >
          <option value="1">24 horas</option>
          <option value="2">48 horas</option>
          <option value="7">7 dias</option>
          <option value="15">15 dias</option>
          <option value="30">30 dias</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {/* 🔹 TABELA — VISUAL ORIGINAL */}
      <div className="overflow-x-auto relative z-20">
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
                    <div className="font-medium text-gray-200">
                      {item.agent_name}
                    </div>
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
    </div>
  );
}
