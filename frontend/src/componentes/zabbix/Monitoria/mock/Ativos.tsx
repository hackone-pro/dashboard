import { forwardRef, useImperativeHandle } from "react";
import GraficoStackedBarChart from "../../../graficos/GraficoStackedBarChart";

export type AtivosCardRef = {
  carregar: () => void;
};

interface Props {
  isWidget?: boolean;
}

const Ativos = forwardRef<AtivosCardRef, Props>(
  ({ isWidget = false }, ref) => {

    // ================================
    // DADOS FAKE
    // ================================
    const dadosFake = [
      { name: "Firewalls", total: 7 },
      { name: "Switches", total: 8 },
      { name: "Servidores", total: 5 },
      { name: "Roteadores", total: 8 }
    ];

    useImperativeHandle(ref, () => ({
      carregar: () => {},
    }));

    const categorias = dadosFake.map((g) => g.name);
    const valores = dadosFake.map((g) => g.total);

    return (
      <div className="h-[250px] w-full">
        <GraficoStackedBarChart
          categorias={categorias}
          series={[
            {
              name: "Ativos",
              data: valores,
            },
          ]}
          cores={["#8B5CF6"]}
        />
      </div>
    );
  }
);

export default Ativos;