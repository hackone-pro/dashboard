import { useEffect, useState } from "react";
import {
  getTopOSVulnerabilidades,
  TopOSVulnerabilidade,
} from "../../services/wazuh/topsovulnerabilidades.service";
import GraficoBarHorizontal from "../../componentes/graficos/GraficoBarraHorizontal";

export default function TopOSGraficoCard() {
  const [topSo, setTopSo] = useState<TopOSVulnerabilidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const lista = await getTopOSVulnerabilidades(5, "todos");
      setTopSo(lista);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || "Falha ao carregar vulnerabilidades por SO");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-white">
          Vulnerabilidades por Sistema Operacional
        </h3>
      </div>

      {err && <div className="text-xs text-red-400 mb-2">{err}</div>}

      {loading ? (
        <div className="h-32 flex items-center justify-center text-gray-400 text-xs">
          Carregando gráfico...
        </div>
      ) : topSo.length > 0 ? (
        <GraficoBarHorizontal
          categorias={topSo.map((os) => os.os)}
          valores={topSo.map((os) => os.total)}
          cor="#632BD3"
          tituloY="Tipo de sistema operacional host"
        />
      ) : (
        <div className="text-xs text-center text-gray-400 py-4">
          Sem vulnerabilidades de OS
        </div>
      )}
    </div>
  );
}
