import { useEffect, useState } from "react";
import GraficoAreaSpline from "../graficos/GraficoAreaSpline";
import { getTodosCasos } from "../../services/iris/cases.service";
import { getTenant } from "../../services/wazuh/tenant.service";
import { useTenant } from "../../context/TenantContext";

import { GripVertical, Trash2 } from "lucide-react";

interface Incidente {
  case_id: number;
  case_name: string;
  case_description: string;
  case_open_date: string;
  classification_id: number;
  classification: string;
  opened_by: string;
  client_name: string;
}

interface Props {
  token: string;
}

export default function IaHumans({ token }: Props) {
  const { tenantAtivo } = useTenant();
  const [series, setSeries] = useState<{ name: string; data: number[] }[]>([]);
  const [categoriasX, setCategoriasX] = useState<string[]>([]);
  const [totalIa, setTotalIa] = useState(0);
  const [totalHumanos, setTotalHumanos] = useState(0);
  const [filtroDias, setFiltroDias] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantAtivo) return;

    let ativo = true;
    async function fetch() {
      try {
        setCarregando(true);
        setErro(null);

        const tenant = await getTenant();
        if (!ativo) return;

        const response = await getTodosCasos(token);
        // @ts-ignore
        const data: Incidente[] = Array.isArray(response) ? response : response.data;

        const hoje = new Date();
        const limite = new Date();
        limite.setDate(hoje.getDate() - (filtroDias || 0));

        const dataFiltrada = data.filter((incidente) => {
          if (incidente.client_name !== tenant.cliente_name) return false;
          if (filtroDias === 0) return true;
          const [mes, dia, ano] = incidente.case_open_date.split("/");
          const dataIncidente = new Date(`${ano}-${mes}-${dia}`);
          return dataIncidente >= limite && dataIncidente <= hoje;
        });

        const agrupado = agruparPorDia(dataFiltrada, filtroDias);
        if (!ativo) return;

        setSeries(agrupado.series);
        setCategoriasX(agrupado.categoriasX);

        const somaIa = agrupado.series?.[0]?.data?.reduce((a, b) => a + b, 0) ?? 0;
        const somaHumanos = agrupado.series?.[1]?.data?.reduce((a, b) => a + b, 0) ?? 0;
        setTotalIa(somaIa);
        setTotalHumanos(somaHumanos);
      } catch (e: any) {
        if (!ativo) return;
        setErro(e?.message ?? "Erro ao carregar tendência de casos");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    fetch();
    return () => {
      ativo = false;
    };
  }, [token, filtroDias, tenantAtivo]);

  return (
    <div className="rounded-2xl flex-grow transition-all duration-300">
      <div className="flex items-center justify-between gap-2 cursor-default select-none mb-5">

        {/* Grupo do ícone + título */}
        <div className="flex items-center gap-2">
          {/* Ícone com drag-handle */}
          <GripVertical size={18} className="text-white/50 hover:text-white transition" />
          <h3 className="text-sm text-white">Tendência de Volume de Casos</h3>
        </div>

        {/* Botão à direita — agora clicável */}
        <select
          className="bg-[#0d0c22] text-white text-xs mr-10 px-2 py-1 rounded-sm border border-[#cacaca31]"
          value={filtroDias}
          onChange={(e) => setFiltroDias(Number(e.target.value))}
        >
          <option value={0}>Todos</option>
          <option value={1}>24 horas</option>
          <option value={7}>7 dias</option>
          <option value={15}>15 dias</option>
          <option value={30}>30 dias</option>
        </select>
      </div>

      {erro && (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2 mb-2">
          {erro}
        </div>
      )}

      {/* 🔹 Estado de carregamento (estilo TopAgents) */}
      {carregando ? (
        <div className="flex flex-col gap-4">
          {/* blocos de estatísticas */}
          <div className="flex gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col items-center">
                <div className="h-3 w-20 bg-[#ffffff10] rounded mb-2" />
                <div className="h-5 w-8 bg-[#ffffff10] rounded" />
              </div>
            ))}
          </div>

          {/* bloco do gráfico */}
          <div className="h-52 bg-[#ffffff10] rounded-xl animate-pulse" />
        </div>
      ) : (
        <>
          <div className="flex gap-8 text-sm mb-4">
            <div className="flex flex-col items-center">
              <span className="text-gray-400 mb-1">IA vs Humanos</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                <span className="text-gray-400">IA</span>
              </div>
              <span className="text-white text-lg font-semibold">{totalIa}</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                <span className="text-gray-400">Humanos</span>
              </div>
              <span className="text-white text-lg font-semibold">{totalHumanos}</span>
            </div>
          </div>

          <GraficoAreaSpline
            series={series}
            categoriasX={categoriasX}
            cores={["#744CD8", "#ED35FB"]}
            hideXAxisLabels
          />
        </>
      )}
    </div>
  );
}

/** Agrupa incidentes por dia */
function agruparPorDia(incidentes: Incidente[], dias: number) {
  const contagemIA: Record<string, number> = {};
  const contagemHumanos: Record<string, number> = {};

  incidentes.forEach((i) => {
    const [mes, dia, ano] = i.case_open_date.split("/");
    const data = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
    if (i.opened_by === "Inteligencia_Artificial") {
      contagemIA[data] = (contagemIA[data] || 0) + 1;
    } else {
      contagemHumanos[data] = (contagemHumanos[data] || 0) + 1;
    }
  });

  const hoje = new Date();
  const diasOrdenados =
    dias === 0
      ? Array.from(new Set([...Object.keys(contagemIA), ...Object.keys(contagemHumanos)])).sort()
      : Array.from({ length: dias }).map((_, i) => {
        const d = new Date(hoje);
        d.setDate(hoje.getDate() - (dias - 1 - i));
        return d.toISOString().slice(0, 10);
      });

  const categoriasX = diasOrdenados.map((d) => {
    const [ano, mes, dia] = d.split("-");
    return `${dia}/${mes}`;
  });

  const ia = diasOrdenados.map((d) => contagemIA[d] || 0);
  const humanos = diasOrdenados.map((d) => contagemHumanos[d] || 0);

  return {
    categoriasX,
    series: [
      { name: "IA", data: ia },
      { name: "Humanos", data: humanos },
    ],
  };
}
