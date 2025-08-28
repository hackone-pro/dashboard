import { useEffect, useMemo, useState } from "react";
import { getTenant } from "../../services/wazuh/tenant.service";
import { getTodosCasos } from "../../services/iris/cases.service";
import GraficoAreaSpline from "../graficos/GraficoAreaSpline";

interface Incidente {
  case_id: number;
  case_name: string;
  case_description: string;
  case_open_date: string; // "MM/DD/YYYY"
  state_name: string;     // "Open" ...
  owner: string;
  client_name: string;
}

interface Props {
  token: string;
}

export default function FluxoIncidentesIris({ token }: Props) {
  const [series, setSeries] = useState<{ name: string; data: number[] }[]>([]);
  const [categoriasX, setCategoriasX] = useState<string[]>([]);
  const [totalAbertos, setTotalAbertos] = useState(0);
  const [totalAtribuidos, setTotalAtribuidos] = useState(0);
  const [totalCasos, setTotalCasos] = useState(0);
  const [filtroDias, setFiltroDias] = useState(0); // 👈 0 = Todos

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [animReady, setAnimReady] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function fetch() {
      try {
        setCarregando(true);
        setErro(null);
        setAnimReady(false);

        const tenant = await getTenant();
        const response = await getTodosCasos(token);
        // @ts-ignore
        const data: Incidente[] = Array.isArray(response) ? response : response.data;

        const hoje = new Date();
        const limite = new Date();
        limite.setDate(hoje.getDate() - (filtroDias || 0));

        const parseUSDate = (mdy: string) => {
          const [mes, dia, ano] = mdy.split("/");
          return new Date(Number(ano), Number(mes) - 1, Number(dia));
        };

        // Filtra por cliente e (se filtroDias > 0) recorta por período
        const dataFiltrada = data.filter((c) => {
          if (c.client_name !== tenant.cliente_name) return false;
          if (filtroDias === 0) return true; // Todos
          const d = parseUSDate(c.case_open_date);
          return d >= limite && d <= hoje;
        });

        const abertos = dataFiltrada.filter((c) => c.state_name === "Open").length;
        const atribuidos = dataFiltrada.filter((c) => c.owner === tenant.owner_name).length;
        const totalCliente = dataFiltrada.length;

        if (!ativo) return;

        setTotalAbertos(abertos);
        setTotalAtribuidos(atribuidos);
        setTotalCasos(totalCliente);

        const agrupado = agruparPorDia(dataFiltrada, tenant.owner_name);
        setSeries(agrupado.series);
        setCategoriasX(agrupado.categoriasX);

        setTimeout(() => ativo && setAnimReady(true), 50);
      } catch (e: any) {
        if (!ativo) return;
        setErro(e?.message ?? "Erro ao carregar dados do IRIS");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    fetch();
    return () => { ativo = false; };
  }, [token, filtroDias]);

  const tituloPeriodo = useMemo(() => {
    switch (filtroDias) {
      case 0: return "todos os registros";
      case 1: return "últimas 24h";
      case 7: return "últimos 7 dias";
      case 15: return "últimos 15 dias";
      case 30: return "últimos 30 dias";
      default: return "";
    }
  }, [filtroDias]);

  return (
    <>
      <div className="flex justify-between items-start mb-4">
        <div className={`transition-opacity duration-300 ${animReady ? "opacity-100" : "opacity-0"}`}>
          <h3 className="text-sm text-white font-semibold mb-4">
            Controle de Incidentes
          </h3>
          {/* <p className="text-[11px] text-gray-500 mb-3">{tituloPeriodo}</p> */}

          {carregando ? (
            <div className="flex gap-10">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span className="text-gray-400 text-sm">Casos abertos</span>
                </div>
                <div className="h-6 w-24 rounded bg-[#ffffff0a] animate-pulse" />
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-pink-400" />
                  <span className="text-gray-400 text-sm">Casos atribuídos</span>
                </div>
                <div className="h-6 w-16 rounded bg-[#ffffff0a] animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex gap-10 text-sm">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400"></span>
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
                  <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                  <span className="text-gray-400">Casos atribuídos</span>
                </div>
                <span className="text-white text-lg font-semibold">
                  {totalAtribuidos}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="min-w-fit">
          <select
            className="bg-[#0d0c22] text-white text-xs px-2 py-1 rounded-md border border-[#cacaca31]"
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
      </div>

      {erro && (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2 mb-3">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="w-full h-52 rounded-xl bg-[#ffffff0a] animate-pulse" />
      ) : (
        <div className={`transition-opacity duration-300 ${animReady ? "opacity-100" : "opacity-0"}`}>
          <GraficoAreaSpline
            series={series}
            categoriasX={categoriasX}
            cores={["#A855F7", "#EC4899"]}
            hideXAxisLabels
          />
        </div>
      )}
    </>
  );
}

function agruparPorDia(incidentes: Incidente[], ownerName: string) {
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

  const todasDatas = Array.from(
    new Set([...Object.keys(contagemAbertos), ...Object.keys(contagemAtribuidos)])
  ).sort();

  const categoriasX = todasDatas.map((d) => {
    const [ano, mes, dia] = d.split("-");
    return `${dia}/${mes}`;
  });

  const dataAbertos = todasDatas.map((d) => contagemAbertos[d] || 0);
  const dataAtribuidos = todasDatas.map((d) => contagemAtribuidos[d] || 0);

  return {
    categoriasX,
    series: [
      { name: "Abertos", data: dataAbertos },
      { name: "Atribuídos", data: dataAtribuidos },
    ],
  };
}