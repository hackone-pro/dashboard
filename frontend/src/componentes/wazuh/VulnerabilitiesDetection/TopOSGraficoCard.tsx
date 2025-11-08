// src/components/wazuh/TopOSGraficoCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import {
  getTopOSVulnerabilidades,
  TopOSVulnerabilidade,
} from "../../../services/wazuh/topsovulnerabilidades.service";
import GraficoBarHorizontal from "../../../componentes/graficos/GraficoBarraHorizontal";
import { useTenant } from "../../../context/TenantContext"; // 👈 tenant global

export type TopOSGraficoCardRef = {
  carregar: () => void;
};

const TopOSGraficoCard = forwardRef<TopOSGraficoCardRef>((props, ref) => {
  const { tenantAtivo } = useTenant(); // 👈 obtém tenant global
  const [topSo, setTopSo] = useState<TopOSVulnerabilidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    if (!tenantAtivo) return; // evita execução antes do tenant carregar
    setCarregando(true);
    try {
      const lista = await getTopOSVulnerabilidades(5, "todos");
      setTopSo(lista);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message || "Falha ao carregar vulnerabilidades por SO");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [tenantAtivo]); // 🔹 recarrega quando o tenant muda

  useImperativeHandle(ref, () => ({
    carregar,
  }));

  // 🔹 Skeleton (carregando)
  if (carregando) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 w-60 bg-[#ffffff14] rounded animate-pulse" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-20 bg-[#ffffff14] rounded animate-pulse" />
              <div className="flex-1 h-3 bg-[#ffffff14] rounded animate-pulse" />
              <div className="h-3 w-10 bg-[#ffffff14] rounded animate-pulse" />
            </div>
          ))}
        </div>
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
  if (!topSo.length) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-center items-center relative h-full text-xs text-gray-400">
        Sem vulnerabilidades de OS
      </div>
    );
  }

  // 🔹 Dados carregados
  return (
    <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-white">
          Vulnerabilidades por Sistema Operacional
        </h3>
      </div>

      <GraficoBarHorizontal
        categorias={topSo.map((os) => os.os)}
        valores={topSo.map((os) => os.total)}
        cor="#632BD3"
        tituloY="Tipo de sistema operacional host"
      />
    </div>
  );
});

export default TopOSGraficoCard;