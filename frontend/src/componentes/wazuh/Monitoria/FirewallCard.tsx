import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { getFirewallsList, FirewallInventarioItem} from "../../../services/wazuh/firewalls.service";
import { useTenant } from "../../../context/TenantContext";
import TooltipRight from "../../TooltipRight";

export type FirewallCardRef = {
  carregar: () => void;
};

// Status vindo do backend — sem cálculo no frontend
function getStatusIcon(ativo: boolean) {
  return ativo
    ? "/assets/img/indicador-on.png"
    : "/assets/img/indicador-off.png";
}

const FirewallCard = forwardRef<FirewallCardRef>((_, ref) => {
  const { tenantAtivo } = useTenant();

  const [loading, setLoading] = useState(true);
  const [firewalls, setFirewalls] = useState<FirewallInventarioItem[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const porPagina = 5;
  const firewallsContratados = tenantAtivo?.contract?.firewalls ?? 0;
  const totalPaginas = Math.ceil(firewalls.length / porPagina);

  const firewallsPaginados = firewalls.slice(
    (paginaAtual - 1) * porPagina,
    paginaAtual * porPagina
  );

  const ativos = firewalls.filter((fw) => fw.ativo).length;
  const inativos = firewalls.filter((fw) => !fw.ativo).length;

  async function carregar() {
    try {
      setLoading(true);

      // ✅ Uma única chamada — backend já resolve tudo
      const dados = await getFirewallsList();

      // Ativos primeiro, depois inativos; dentro de cada grupo ordena por timestamp desc
      const ordenados = dados.sort((a, b) => {
        if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;
        if (!a.timestamp && !b.timestamp) return 0;
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      setFirewalls(ordenados);
      setPaginaAtual(1);
    } catch (err) {
      console.error("Erro FirewallCard:", err);
    } finally {
      setLoading(false);
    }
  }

  useImperativeHandle(ref, () => ({ carregar }));

  useEffect(() => {
    if (tenantAtivo) carregar();
  }, [tenantAtivo]);

  return (
    <div className="cards rounded-2xl p-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-sm font-medium">Firewall</h3>

        <div className="flex items-center gap-4">
          {!loading && (
            <>
              {/* Contadores ativos/inativos */}
              {/* <span className="text-xs text-gray-400">
                <span className="text-green-400 font-bold">{ativos}</span> ativos
                {" · "}
                <span className="text-red-400 font-bold">{inativos}</span> inativos
              </span> */}

              {/* Total contratado */}
              <span className="text-xs text-gray-400">
                <strong className="text-white">{firewalls.length}</strong>
                {" / "}
                <strong className="text-white">{firewallsContratados}</strong>
                {" "}contratados
              </span>
            </>
          )}

          <button
            onClick={carregar}
            disabled={loading}
            className="text-sm border border-[#1D1929] bg-[#0A0617] hover:bg-gray-700 text-gray-400 px-3 py-1 rounded-md transition disabled:opacity-50"
          >
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-full h-6 bg-white/5 animate-pulse rounded" />
          ))}
        </div>
      ) : (
        <>
          <table className="w-full text-xs text-gray-400">
            <thead className="fundo-dashboard">
              <tr className="text-white">
                <th className="text-left py-2 px-3">Origem</th>
                <th className="text-left py-2">IP de Origem</th>
                <th className="text-center py-2">Indicador</th>
                <th className="text-center py-2">Último Log</th>
              </tr>
            </thead>

            <tbody>
              {firewallsPaginados.length === 0 ? (
                <tr className="border-b border-white/5">
                  <td colSpan={4} className="text-center py-6 text-gray-500 italic">
                    Nenhum dado de firewall encontrado
                  </td>
                </tr>
              ) : (
                firewallsPaginados.map((fw, index) => (
                  <tr
                    key={index}
                    className="border-b border-white/5 hover:bg-[#ffffff05] transition-colors"
                  >
                    {/* Nome */}
                    <td className="px-3 py-3">{fw.nome}</td>

                    {/* IP */}
                    <td>{fw.location ?? "-"}</td>

                    {/* Indicador — vem do backend */}
                    <td className="text-center">
                      <TooltipRight
                        status={fw.ativo ? "🟢" : "🔴"}
                        text={
                          fw.ativo
                            ? `Recebendo logs\n(${fw.logsRecentes} nas últimas 24h)`
                            : "Sem receber logs\n(mais de 24h)"
                        }
                      >
                        <img
                          src={getStatusIcon(fw.ativo)}
                          alt="status"
                          className="w-6 h-3 mx-auto"
                        />
                      </TooltipRight>
                    </td>

                    {/* Último log — ativos mostram data, inativos mostram tempo relativo */}
                    <td className="text-center">
                      {fw.timestamp
                        ? new Date(fw.timestamp).toLocaleString("pt-BR")
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Paginação */}
          <div className="flex justify-between items-center mt-4">
            <button
              disabled={paginaAtual === 1}
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              className={`px-3 py-1 rounded-md text-xs border text-gray-400 ${paginaAtual === 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5"
                }`}
            >
              ← Anterior
            </button>

            <span className="text-gray-400 text-xs">
              Página {paginaAtual} de {Math.max(totalPaginas, 1)}
            </span>

            <button
              disabled={paginaAtual === totalPaginas || totalPaginas === 0}
              onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
              className={`px-3 py-1 rounded-md text-xs border text-gray-400 ${paginaAtual === totalPaginas || totalPaginas === 0
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-white/5"
                }`}
            >
              Próxima →
            </button>
          </div>
        </>
      )}
    </div>
  );
});

export default FirewallCard;