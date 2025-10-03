// src/components/wazuh/TopUsersCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { getTopUsers, TopUserItem } from "../../services/wazuh/topusers.service";

export type TopUsersCardRef = {
  carregar: () => void;
};

const TopUsersCard = forwardRef<TopUsersCardRef>((props, ref) => {
  const [dados, setDados] = useState<TopUserItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const res = await getTopUsers("todos"); // default: últimos 7 dias
      setDados(res.slice(0, 5)); // só top 5
    } catch (e: any) {
      setErro(e.message ?? "Erro ao buscar dados");
    } finally {
      setCarregando(false);
    }
  };

  // chama automaticamente ao montar
  useEffect(() => {
    carregar();
  }, []);

  // expõe a função carregar para o pai
  useImperativeHandle(ref, () => ({
    carregar,
  }));

  if (carregando) {
    return <div className="w-full h-52 rounded-xl bg-[#ffffff0a] animate-pulse" />;
  }


  if (erro) {
    return <div className="text-red-400 text-sm">{erro}</div>;
  }

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
