// src/components/wazuh/TopOSGraficoCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import {
  getTopOSVulnerabilidades,
  TopOSVulnerabilidade,
} from "../../../services/wazuh/topsovulnerabilidades.service";
import GraficoBarHorizontal from "../../../componentes/graficos/GraficoBarraHorizontal";
import { useTenant } from "../../../context/TenantContext";
import { GripVertical } from "lucide-react";

export type TopOSGraficoCardRef = {
  carregar: () => void;
};

interface Props {
  isWidget?: boolean;
}

const TopOSGraficoCard = forwardRef<TopOSGraficoCardRef, Props>(
  ({ isWidget = false }, ref) => {
    const { tenantAtivo } = useTenant();
    const [topSo, setTopSo] = useState<TopOSVulnerabilidade[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const carregar = async () => {
      if (!tenantAtivo) return;
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
    }, [tenantAtivo]);

    useImperativeHandle(ref, () => ({ carregar }));

    // ======================================================
    // LOADING
    // ======================================================
    if (carregando) {
      return (
        <div
          className={`rounded-xl shadow-md flex flex-col justify-start relative h-full bg-[#1D1929]
            ${isWidget ? "p-6" : "p-4"}
          `}
        >
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

    // ======================================================
    // ERRO
    // ======================================================
    if (erro) {
      return (
        <div
          className={`rounded-xl shadow-md flex flex-col justify-center items-center relative h-full bg-[#1D1929]
            ${isWidget ? "p-6" : "p-4"}
          `}
        >
          <span className="text-xs text-red-400">{erro}</span>
        </div>
      );
    }

    // ======================================================
    // SEM DADOS
    // ======================================================
    if (!topSo.length) {
      return (
        <div
          className={`rounded-xl shadow-md flex flex-col justify-center items-center relative h-full bg-[#1D1929]
            ${isWidget ? "p-6" : "p-4"}
          `}
        >
          <span className="text-xs text-gray-400">Sem vulnerabilidades de OS</span>
        </div>
      );
    }

    // ======================================================
    // CONTEÚDO NORMAL
    // ======================================================
    return (
      <div
        className={`rounded-xl shadow-md flex flex-col justify-start relative h-full bg-[#1D1929]
          ${isWidget ? "p-6" : "p-4"}
        `}
      >
        {/* HEADER → com drag-handle igual aos outros widgets */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            {isWidget && (
              <GripVertical
                size={18}
                className="drag-handle cursor-grab active:cursor-grabbing 
                           text-white/50 hover:text-white transition"
              />
            )}

            <h3 className="text-sm font-medium text-white">
              Vulnerabilidades por Sistema Operacional
            </h3>
          </div>
        </div>

        <GraficoBarHorizontal
          categorias={topSo.map((os) => os.os)}
          valores={topSo.map((os) => os.total)}
          cor="#632BD3"
          tituloY="Tipo de sistema operacional host"
        />
      </div>
    );
  }
);

export default TopOSGraficoCard;
