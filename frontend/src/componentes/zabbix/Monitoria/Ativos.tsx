import { forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { GripVertical } from "lucide-react";
import GraficoStackedBarChart from "../../graficos/GraficoStackedBarChart";
import { getZabbixAtivos, ZabbixGrupoAtivo } from "../../../services/zabbix/ativos";
import { useTenant } from "../../../context/TenantContext";

export type AtivosCardRef = {
  carregar: () => void;
};

interface Props {
  isWidget?: boolean;
}

type AtivosResponse = {
  total: number;
  grupos: ZabbixGrupoAtivo[];
};

const Ativos = forwardRef<AtivosCardRef, Props>(
  ({ isWidget = false }, ref) => {
    const { tenantAtivo } = useTenant();

    const [dados, setDados] = useState<AtivosResponse | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    const carregar = async () => {
      if (!tenantAtivo) return;

      try {
        setCarregando(true);
        setErro(null);

        const res = await getZabbixAtivos();
        setDados(res);
      } catch (e: any) {
        setErro(e?.message ?? "Erro ao carregar ativos do Zabbix");
      } finally {
        setCarregando(false);
      }
    };

    useEffect(() => {
      carregar();
    }, [tenantAtivo]);

    useImperativeHandle(ref, () => ({
      carregar,
    }));

    // ======================================================
    // LOADING
    // ======================================================
    if (carregando) {
      return (
        <div
          className={`flex flex-col justify-start relative h-full
            ${isWidget}
          `}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="h-4 w-48 bg-[#ffffff14] rounded animate-pulse" />
          </div>

          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 w-32 bg-[#ffffff14] rounded animate-pulse" />
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
          className={`rounded-xl shadow-md flex flex-col justify-center items-center relative h-full cards
            ${isWidget}
          `}
        >
          <span className="text-xs text-red-400">{erro}</span>
        </div>
      );
    }

    // ======================================================
    // SEM DADOS
    // ======================================================
    if (!dados || !dados.grupos.length) {
      return (
        <div
          className={`rounded-xl shadow-md flex flex-col justify-center items-center relative h-full cards
            ${isWidget}
          `}
        >
          <span className="text-xs text-gray-400">Nenhum ativo encontrado</span>
        </div>
      );
    }

    // ======================================================
    // CONTEÚDO NORMAL
    // ======================================================
    const categorias = dados.grupos.map((g) => g.name);
    const valores = dados.grupos.map((g) => g.total);

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


