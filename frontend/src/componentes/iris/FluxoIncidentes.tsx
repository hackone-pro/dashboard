import { useEffect, useState } from "react";
import { getTodosCasos } from "../../services/iris/cases.service";
import GraficoAreaSpline from "../graficos/GraficoAreaSpline";
import { useTenant } from "../../context/TenantContext";
import { GripVertical } from "lucide-react";

interface Incidente {
  case_id: number;
  case_name: string;
  case_description: string;
  case_open_date: string;
  state_name: string;
  owner: string;
  client_name: string;
}

interface Periodo {
  from: string;
  to: string;
}

interface Props {
  token: string;
  diasGlobal?: string;
  periodo?: Periodo | null;
  onUpdateTotais?: (total: number) => void;
  isWidget?: boolean;
}

export default function FluxoIncidentesIris({
  token,
  diasGlobal,
  periodo,
  onUpdateTotais,
  isWidget = false,
}: Props) {
  const { tenantAtivo } = useTenant();

  const [series, setSeries] = useState<{ name: string; data: number[] }[]>([]);
  const [categoriasX, setCategoriasX] = useState<string[]>([]);
  const [totalAbertos, setTotalAbertos] = useState(0);
  const [totalAtribuidos, setTotalAtribuidos] = useState(0);
  const [totalCasos, setTotalCasos] = useState(0);

  const diasEfetivo = diasGlobal || "1";

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantAtivo) return;
    let ativo = true;

    async function fetch() {
      try {
        setCarregando(true);
        setErro(null);

        const response = await getTodosCasos(
          token,
          periodo ? { from: periodo.from, to: periodo.to } : undefined
        );
        // @ts-ignore
        const data: Incidente[] = Array.isArray(response)
          ? response
          : ((response as { data?: Incidente[] }).data || []);

        const hoje = new Date();
        const limite = new Date();

        const nDias =
          periodo || diasEfetivo === "todos"
            ? 0
            : Number(diasEfetivo);

        if (nDias > 0) limite.setDate(hoje.getDate() - nDias);

        const parseUSDate = (mdy: string) => {
          const [mes, dia, ano] = mdy.split("/");
          return new Date(Number(ano), Number(mes) - 1, Number(dia));
        };

        const dataFiltrada = data.filter((c) => {
          // @ts-ignore
          if (c.client_name !== tenantAtivo.cliente_name) return false;

          if (periodo) return true;

          if (nDias === 0) return true;

          const d = parseUSDate(c.case_open_date);
          return d >= limite && d <= hoje;
        });

        const abertos = dataFiltrada.filter(
          (c) => c.state_name === "Open"
        ).length;

        const atribuidos = dataFiltrada.filter(
          // @ts-ignore
          (c) => c.owner === tenantAtivo.owner_name
        ).length;

        const totalCliente = dataFiltrada.length;

        if (!ativo) return;

        setTotalAbertos(abertos);
        setTotalAtribuidos(atribuidos);
        setTotalCasos(totalCliente);

        const agrupado = agruparPorDia(
          dataFiltrada,
          // @ts-ignore
          tenantAtivo.owner_name,
          nDias
        );

        setSeries(agrupado.series);
        setCategoriasX(agrupado.categoriasX);
      } catch (e: any) {
        if (!ativo) return;
        setErro(e?.message ?? "Erro ao carregar dados do IRIS");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    fetch();
    return () => {
      ativo = false;
    };
  }, [token, diasEfetivo, periodo, tenantAtivo]);

  useEffect(() => {
    onUpdateTotais?.(totalCasos);
  }, [totalCasos]);

  return (
    <div
      className={`rounded-xl shadow-md h-full flex flex-col relative overflow-hidden
      ${isWidget ? "p-6" : "p-0"}
    `}
    >
      {/* HEADER */}
      <div className="flex justify-between items-start mb-4 relative z-20">
        <div className="flex items-center gap-2">
          {isWidget && (
            <GripVertical
              size={18}
              className="drag-handle cursor-grab active:cursor-grabbing text-white/50 hover:text-white"
            />
          )}
          <h3 className="text-sm text-white font-semibold">
            Controle de Incidentes
          </h3>
        </div>
      </div>

      {erro && (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2 mb-3">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="w-full h-20 bg-[#ffffff0a] rounded-xl animate-pulse mb-4" />
      ) : (
        <div className="flex gap-10 text-sm mb-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-gray-400">Casos abertos</span>
            </div>
            <span className="text-white text-lg font-semibold">
              {totalAbertos}
              <span className="text-gray-500 text-base font-normal">
                {" "}
                / {totalCasos}
              </span>
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-pink-400" />
              <span className="text-gray-400">Casos atribuídos</span>
            </div>
            <span className="text-white text-lg font-semibold">
              {totalAtribuidos}
            </span>
          </div>
        </div>
      )}

      {carregando ? (
        <div className="w-full h-52 bg-[#ffffff0a] rounded-xl animate-pulse" />
      ) : (
        <GraficoAreaSpline
          series={series}
          categoriasX={categoriasX}
          cores={["#A855F7", "#EC4899"]}
          hideXAxisLabels
        />
      )}
    </div>
  );
}

/* =====================
   AGRUPAMENTO
===================== */

function agruparPorDia(
  incidentes: Incidente[],
  ownerName: string,
  dias: number
) {
  const contagemAbertos: Record<string, number> = {};
  const contagemAtribuidos: Record<string, number> = {};

  const toKey = (mdy: string) => {
    const [mes, dia, ano] = mdy.split("/");
    return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  };

  incidentes.forEach((incidente) => {
    const chave = toKey(incidente.case_open_date);

    if (incidente.state_name === "Open") {
      contagemAbertos[chave] = (contagemAbertos[chave] || 0) + 1;
    }
    if (incidente.owner === ownerName) {
      contagemAtribuidos[chave] = (contagemAtribuidos[chave] || 0) + 1;
    }
  });

  const hoje = new Date();
  const diasOrdenados =
    dias === 0
      ? (() => {
          const todasDatas = [
            ...Object.keys(contagemAbertos),
            ...Object.keys(contagemAtribuidos),
          ];
          const minData = todasDatas.length
            ? new Date(Math.min(...todasDatas.map((d) => new Date(d).getTime())))
            : new Date();
          const arr: string[] = [];
          for (let d = new Date(minData); d <= hoje; d.setDate(d.getDate() + 1)) {
            arr.push(d.toISOString().slice(0, 10));
          }
          return arr;
        })()
      : Array.from({ length: dias }).map((_, i) => {
          const d = new Date(hoje);
          d.setDate(hoje.getDate() - (dias - 1 - i));
          return d.toISOString().slice(0, 10);
        });

  const categoriasX = diasOrdenados.map((d) => {
    const [ano, mes, dia] = d.split("-");
    return `${dia}/${mes}`;
  });

  const dataAbertos = diasOrdenados.map((d) => contagemAbertos[d] || 0);
  const dataAtribuidos = diasOrdenados.map((d) => contagemAtribuidos[d] || 0);

  return {
    categoriasX,
    series: [
      { name: "Abertos", data: dataAbertos },
      { name: "Atribuídos", data: dataAtribuidos },
    ],
  };
}