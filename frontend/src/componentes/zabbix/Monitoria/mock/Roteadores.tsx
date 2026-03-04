import GraficoStackedBarChart from "../../../graficos/GraficoStackedBarChart";

type RouterCPU = {
  name: string;
  cpu_percent: number;
  severidade: "baixo" | "medio" | "alto" | "critico";
};

export default function Roteadores() {

  // ===============================
  // DADOS FAKE
  // ===============================
  const routers: RouterCPU[] = [
    {
      name: "RTR-HQ-SP",
      cpu_percent: 82,
      severidade: "alto",
    },
    {
      name: "RTR-DATACENTER",
      cpu_percent: 64,
      severidade: "medio",
    },
    {
      name: "RTR-FILIAL-RJ",
      cpu_percent: 47,
      severidade: "medio",
    },
    {
      name: "RTR-BRANCH-SUL",
      cpu_percent: 33,
      severidade: "baixo",
    },
    {
      name: "RTR-CLOUD-EDGE",
      cpu_percent: 91,
      severidade: "critico",
    },
  ];

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