// src/components/wazuh/AnoVulnerabilidadeCard.tsx
import { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import {
  getAnoVulnerabilidades,
  AnoVulnerabilidade,
} from "../../../services/wazuh/anovulnerabilidades.service";
import GraficoStackedBarChart from "../../graficos/GraficoStackedBarChart";
import { useTenant } from "../../../context/TenantContext"; // 👈 tenant global

export type AnoVulnerabilidadeCardRef = {
  carregar: () => void;
};

const AnoVulnerabilidadeCard = forwardRef<AnoVulnerabilidadeCardRef>((props, ref) => {
  const { tenantAtivo } = useTenant(); // 👈 usa o tenant global
  const [anoVulns, setAnoVulns] = useState<AnoVulnerabilidade[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    if (!tenantAtivo) return; // evita execução antes do tenant
    setCarregando(true);
    try {
      const lista = await getAnoVulnerabilidades("todos");
      setAnoVulns(lista);
      setErro(null);
    } catch (e: any) {
      setErro(e?.message || "Falha ao carregar vulnerabilidades por ano");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [tenantAtivo]); // 🔹 recarrega automaticamente ao trocar tenant

  useImperativeHandle(ref, () => ({
    carregar,
  }));

  // 🔹 Skeleton (carregando)
  if (carregando) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 w-48 bg-[#ffffff14] rounded animate-pulse" />
        </div>

        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-16 bg-[#ffffff14] rounded animate-pulse" />
              <div className="flex-1 h-3 bg-[#ffffff14] rounded animate-pulse" />
              <div className="h-3 w-8 bg-[#ffffff14] rounded animate-pulse" />
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
  if (!anoVulns.length) {
    return (
      <div className="cards rounded-xl p-4 flex flex-col justify-center items-center relative h-full text-xs text-gray-400">
        Sem dados de vulnerabilidades por ano
      </div>
    );
  }

  // 🔹 Dados carregados
  return (
    <div className="cards rounded-xl p-4 flex flex-col justify-start relative h-full">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium text-white">Vulnerabilidades por Ano</h3>
      </div>

      <GraficoStackedBarChart
        categorias={anoVulns.map((a) => a.ano)} // eixo X
        series={[
          {
            name: "Baixo",
            data: anoVulns.map((a) => a.severity.Low || 0),
          },
          {
            name: "Médio",
            data: anoVulns.map((a) => a.severity.Medium || 0),
          },
          {
            name: "Alto",
            data: anoVulns.map((a) => a.severity.High || 0),
          },
          {
            name: "Crítico",
            data: anoVulns.map((a) => a.severity.Critical || 0),
          },
        ]}
      />
    </div>
  );
});

export default AnoVulnerabilidadeCard;