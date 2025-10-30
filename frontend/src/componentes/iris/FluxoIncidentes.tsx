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
  diasGlobal?: string;
  onChangeFiltro?: (valor: string | null) => void;
  onUpdateTotais?: (total: number) => void; // 👈 para enviar total ao RiskLevel
}

export default function FluxoIncidentesIris({
  token,
  diasGlobal,
  onChangeFiltro,
  onUpdateTotais,
}: Props) {
  const [series, setSeries] = useState<{ name: string; data: number[] }[]>([]);
  const [categoriasX, setCategoriasX] = useState<string[]>([]);
  const [totalAbertos, setTotalAbertos] = useState(0);
  const [totalAtribuidos, setTotalAtribuidos] = useState(0);
  const [totalCasos, setTotalCasos] = useState(0);

  const [filtroLocal, setFiltroLocal] = useState<string | null>(null);
  const diasEfetivo = filtroLocal || diasGlobal || "1"; // 👈 local > global > padrão

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [animReady, setAnimReady] = useState(false);

  // 👇 sincroniza com o global (se não há local ativo)
  useEffect(() => {
    if (!filtroLocal && diasGlobal) {
      setFiltroLocal(null);
    }
  }, [diasGlobal]);

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
        const nDias = diasEfetivo === "todos" ? 0 : Number(diasEfetivo);
        if (nDias > 0) limite.setDate(hoje.getDate() - nDias);

        const parseUSDate = (mdy: string) => {
          const [mes, dia, ano] = mdy.split("/");
          return new Date(Number(ano), Number(mes) - 1, Number(dia));
        };

        // 🔹 Filtra por cliente e período
        const dataFiltrada = data.filter((c) => {
          if (c.client_name !== tenant.cliente_name) return false;
          if (nDias === 0) return true; // Todos
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

        const agrupado = agruparPorDia(dataFiltrada, tenant.owner_name, nDias);
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
    return () => {
      ativo = false;
    };
  }, [token, diasEfetivo]);

  useEffect(() => {
    onUpdateTotais?.(totalCasos);
  }, [totalCasos]);

  const tituloPeriodo = useMemo(() => {
    switch (diasEfetivo) {
      case "todos":
        return "todos os registros";
      case "1":
        return "últimas 24h";
      case "7":
        return "últimos 7 dias";
      case "15":
        return "últimos 15 dias";
      case "30":
        return "últimos 30 dias";
      default:
        return "";
    }
  }, [diasEfetivo]);

  return (
    <>
      <div className="flex justify-between items-start mb-4">
        <div
          className={`transition-opacity duration-300 ${
            animReady ? "opacity-100" : "opacity-0"
          }`}
        >
          <h3 className="text-sm text-white font-semibold mb-4">
            Controle de Incidentes
          </h3>

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

        {/* 🔹 Select com filtro local e sincronização global */}
        <div className="min-w-fit">
          <select
            className="bg-[#0d0c22] text-white text-xs px-2 py-1 rounded-md border border-[#cacaca31]"
            value={filtroLocal || diasEfetivo}
            onChange={(e) => {
              const val = e.target.value;
              const novoValor = val === diasGlobal ? null : val;
              setFiltroLocal(novoValor);
              onChangeFiltro?.(novoValor);
            }}
          >
            <option value="1">24 horas</option>
            <option value="2">48 horas</option>
            <option value="7">7 dias</option>
            <option value="15">15 dias</option>
            <option value="30">30 dias</option>
            <option value="todos">Todos</option>
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
        <div
          className={`transition-opacity duration-300 ${
            animReady ? "opacity-100" : "opacity-0"
          }`}
        >
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

function agruparPorDia(incidentes: Incidente[], ownerName: string, dias: number) {
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

  let diasOrdenados: string[];

  if (dias === 0) {
    const todasDatas = [
      ...Object.keys(contagemAbertos),
      ...Object.keys(contagemAtribuidos),
    ];
    const minData = todasDatas.length
      ? new Date(Math.min(...todasDatas.map((d) => new Date(d).getTime())))
      : new Date();
    const hoje = new Date();

    diasOrdenados = [];
    let d = new Date(minData);
    while (d <= hoje) {
      diasOrdenados.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
    }
  } else {
    const hoje = new Date();
    diasOrdenados = Array.from({ length: dias }).map((_, i) => {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - (dias - 1 - i));
      return d.toISOString().slice(0, 10);
    });
  }

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
