// src/components/wazuh/TopAgenteVulnerabilidadeCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { getTopAgentesVulnerabilidades, TopAgenteVulnerabilidade } from "../../../services/wazuh/agentesvulnerabilidades.service";
import { useTenant } from "../../../context/TenantContext"; // 👈 tenant global

export type TopAgenteVulnerabilidadeCardRef = {
  carregar: () => void;
};

const formatPt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);

const TopAgenteVulnerabilidadeCard = forwardRef<TopAgenteVulnerabilidadeCardRef>((props, ref) => {
  const { tenantAtivo } = useTenant(); // 👈 obtém tenant ativo
  const [topAgents, setTopAgents] = useState<TopAgenteVulnerabilidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    if (!tenantAtivo) return; // 🔹 evita chamada sem tenant
    setCarregando(true);
    try {
      // 🔹 o tenant é tratado internamente no service
      const lista = await getTopAgentesVulnerabilidades(5, "todos");
      setTopAgents(lista);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message || "Falha ao carregar Top Agentes");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [tenantAtivo]); // 👈 recarrega sempre que o tenant mudar

  useImperativeHandle(ref, () => ({
    carregar,
  }));

  // 🔹 Skeleton (carregando)
  if (carregando) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-white">Top 5 Agentes</h3>
          <span className="text-xs text-gray-400">Total</span>
        </div>

        <ul className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="flex justify-between items-center">
              <span className="h-4 w-40 rounded bg-white/10 animate-pulse" />
              <span className="h-4 w-8 rounded bg-white/10 animate-pulse" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // 🔹 Erro
  if (erro) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-center items-center relative h-full text-xs text-red-400">
        {erro}
      </div>
    );
  }

  // 🔹 Sem dados
  if (!topAgents.length) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-center items-center relative h-full text-xs text-gray-400">
        Sem vulnerabilidades em agentes
      </div>
    );
  }

  // 🔹 Dados carregados
  return (
    <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-white">Top 5 Agentes</h3>
        <span className="text-xs text-gray-400">Total</span>
      </div>

      <ul className="space-y-2 py-3">
        {topAgents.slice(0, 5).map((agent) => (
          <li
            key={agent.agent}
            className="flex justify-between items-center text-sm text-gray-300 hover:text-white transition-colors border-b border-white/5 pb-1"
          >
            <span className="truncate font-medium text-gray-400">{agent.agent}</span>
            <span className="font-medium text-gray-400">{formatPt(agent.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});

export default TopAgenteVulnerabilidadeCard;