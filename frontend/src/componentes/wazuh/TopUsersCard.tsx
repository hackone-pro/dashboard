// src/components/wazuh/TopUsersCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { getTopUsers, TopUserItem } from "../../services/wazuh/topusers.service";
import { useTenant } from "../../context/TenantContext";

export type TopUsersCardRef = {
  carregar: (opts?: {
    from?: string;
    to?: string;
    dias?: number;
  }) => void;
};

interface TopUsersCardProps {
  onDadosCarregados?: (users: TopUserItem[]) => void;
}

const TopUsersCard = forwardRef<TopUsersCardRef, TopUsersCardProps>(({ onDadosCarregados }, ref) => {
  const { tenantAtivo } = useTenant();

  const [dados, setDados] = useState<TopUserItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async (opts?: {
    from?: string;
    to?: string;
    dias?: number;
  }) => {
    if (!tenantAtivo) return;

    try {
      setCarregando(true);
      setErro(null);

      const res = await getTopUsers(
        opts?.from && opts?.to
          ? { from: opts.from, to: opts.to }
          : { dias: opts?.dias ?? 1 } // 🔥 fallback: últimas 24h
      );

      setDados(res.slice(0, 5));
      onDadosCarregados?.(res.slice(0, 5));
    } catch (e: any) {
      setErro(e?.message ?? "Erro ao buscar dados");
    } finally {
      setCarregando(false);
    }
  };

  // 🔥 carga inicial = últimas 24h
  useEffect(() => {
    carregar({ dias: 1 });
  }, [tenantAtivo]);

  useImperativeHandle(ref, () => ({
    carregar,
  }));

  // -----------------------------
  // ERRO
  // -----------------------------
  if (erro) {
    return (
      <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2">
        {erro}
      </div>
    );
  }

  // -----------------------------
  // SKELETON
  // -----------------------------
  if (carregando) {
    return (
      <div className="rounded-xl border border-white/5 p-4">
        <div className="h-5 w-40 bg-[#ffffff0a] rounded animate-pulse mb-4" />
        <table className="min-w-full text-sm text-left text-gray-400">
          <thead>
            <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
              <th className="px-3 py-2">Usuário</th>
              <th className="px-3 py-2 text-center">ID do Host</th>
              <th className="px-3 py-2 text-center">Nome do Host</th>
              <th className="px-3 py-2 text-right">Contagem</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-800">
                <td className="px-3 py-2">
                  <div className="h-3 w-24 bg-[#ffffff0a] rounded animate-pulse" />
                </td>
                <td className="px-3 py-2 text-center">
                  <div className="h-3 w-10 bg-[#ffffff0a] rounded animate-pulse mx-auto" />
                </td>
                <td className="px-3 py-2 text-center">
                  <div className="h-3 w-20 bg-[#ffffff0a] rounded animate-pulse mx-auto" />
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="h-3 w-8 bg-[#ffffff0a] rounded animate-pulse ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // -----------------------------
  // SEM DADOS
  // -----------------------------
  if (!dados.length) {
    return (
      <div className="text-xs text-gray-400 flex items-center justify-center h-40">
        Nenhum dado para exibir.
      </div>
    );
  }

  // -----------------------------
  // TABELA FINAL
  // -----------------------------
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left text-gray-400">
        <thead>
          <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
            <th className="px-3 py-2">Usuário</th>
            <th className="px-3 py-2 text-center">ID do Host</th>
            <th className="px-3 py-2 text-center">Nome do Host</th>
            <th className="px-3 py-2 text-right">Contagem</th>
          </tr>
        </thead>
        <tbody>
          {dados.map((item, idx) => (
            <tr
              key={idx}
              className="border-b border-gray-800 hover:bg-gray-800/40 transition"
            >
              <td className="px-3 py-2">{item.user}</td>
              <td className="px-3 py-2 text-center">{item.agent_id}</td>
              <td className="px-3 py-2 text-center">{item.agent_name}</td>
              <td className="px-3 py-2 text-right font-semibold">
                {item.count.toLocaleString("pt-BR")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export default TopUsersCard;
