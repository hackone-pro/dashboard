import { useEffect, useState } from "react";
import {
  getZabbixRouters,
  RouterCPU,
} from "../../../services/zabbix/routers";

import GraficoStackedBarChart from "../../graficos/GraficoStackedBarChart";

export default function Roteadores() {
  const [routers, setRouters] = useState<RouterCPU[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        const res = await getZabbixRouters(5);
        setRouters(res.routers ?? []);
      } catch (e) {
        console.error("Erro ao carregar roteadores:", e);
        setRouters([]);
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  // ===============================
  // LOADING
  // ===============================
  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-white text-md">
              Top 5 Roteadores
            </h3>
            <p className="text-gray-400 text-sm">
              Utilização de CPU
            </p>
          </div>
        </div>

        <div className="h-[280px] bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  // ===============================
  // SEM DADOS
  // ===============================
  if (!routers.length) {
    return (
      <div>
        <h3 className="text-white text-md mb-2">
          Top 5 Roteadores
        </h3>
        <p className="text-gray-400 text-sm">
          Nenhum roteador encontrado
        </p>
      </div>
    );
  }

  // ===============================
  // PREPARA DADOS PARA O GRÁFICO
  // ===============================
  const categorias = routers.map((r) => r.name);
  const valores = routers.map((r) => r.cpu_percent);

  const cores = routers.map((r) => {
    switch (r.severidade) {
      case "critico":
        return "#EC4899";
      case "alto":
        return "#A855F7";
      case "medio":
        return "#6366F1";
      case "baixo":
        return "#1DD69A";
      default:
        return "#6366F1";
    }
  });

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-white text-md">
            Top 5 Roteadores
          </h3>
          <p className="text-gray-400 text-sm">
            Utilização de CPU
          </p>
        </div>
      </div>

      <div className="h-[280px] w-full">
        <GraficoStackedBarChart
          categorias={categorias}
          series={[
            {
              name: "CPU %",
              data: valores,
            },
          ]}
          cores={cores}
          stacked={false}
          distributed={true}
        />
      </div>
    </div>
  );
}
