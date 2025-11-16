// src/components/iris/FluxoIncidentesIris.tsx
import { useEffect, useMemo, useState } from "react";
import { getTenant } from "../../services/wazuh/tenant.service";
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

interface Props {
  token: string;
  diasGlobal?: string;
  onChangeFiltro?: (valor: string | null) => void;
  onUpdateTotais?: (total: number) => void;
  isWidget?: boolean; // 👈 novo
}

export default function FluxoIncidentesIris({
  token,
  diasGlobal,
  onChangeFiltro,
  onUpdateTotais,
  isWidget = false,
}: Props) {
  const { tenantAtivo } = useTenant();
<<<<<<< HEAD
=======

>>>>>>> 1162e3f (Final - Edit dashboard)
  const [series, setSeries] = useState<{ name: string; data: number[] }[]>([]);
  const [categoriasX, setCategoriasX] = useState<string[]>([]);
  const [totalAbertos, setTotalAbertos] = useState(0);
  const [totalAtribuidos, setTotalAtribuidos] = useState(0);
  const [totalCasos, setTotalCasos] = useState(0);

  const [filtroLocal, setFiltroLocal] = useState<string | null>(null);
  const diasEfetivo = filtroLocal || diasGlobal || "1";

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [animReady, setAnimReady] = useState(false);

  useEffect(() => {
    if (!filtroLocal && diasGlobal) setFiltroLocal(null);
  }, [diasGlobal]);

  useEffect(() => {
    if (!tenantAtivo) return;
<<<<<<< HEAD
=======
    let ativo = true;
>>>>>>> 1162e3f (Final - Edit dashboard)

    let ativo = true;
    async function fetch() {
      try {
        setCarregando(true);
        setErro(null);
        setAnimReady(false);

        const inicio = Date.now();
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

        const dataFiltrada = data.filter((c) => {
          if (c.client_name !== tenant.cliente_name) return false;
          if (nDias === 0) return true;
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

<<<<<<< HEAD
        const agrupado = agruparPorDia(dataFiltrada, tenant.owner_name, nDias);
        setSeries(agrupado.series);
        setCategoriasX(agrupado.categoriasX);

        const elapsed = Date.now() - inicio;
        const delay = Math.max(500 - elapsed, 0);
        setTimeout(() => ativo && setAnimReady(true), delay);
=======
        //@ts-ignore
        const agrupado = agruparPorDia(dataFiltrada, tenantAtivo.owner_name, nDias);
        setSeries(agrupado.series);
        setCategoriasX(agrupado.categoriasX);

>>>>>>> 1162e3f (Final - Edit dashboard)
      } catch (e: any) {
        if (!ativo) return;
        setErro(e?.message ?? "Erro ao carregar dados do IRIS");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    fetch();
<<<<<<< HEAD
    return () => {
      ativo = false;
    };
=======
    return () => { ativo = false };
>>>>>>> 1162e3f (Final - Edit dashboard)
  }, [token, diasEfetivo, tenantAtivo]);

  useEffect(() => {
    onUpdateTotais?.(totalCasos);
  }, [totalCasos]);

<<<<<<< HEAD
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

  // 🦴 Skeleton animado (mantém estrutura e alinhamento)
  if (carregando) {
    return (
      <div className="p-6 shadow-md h-full flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="h-4 w-40 bg-[#ffffff12] rounded animate-pulse mb-3" />
            <div className="flex gap-10">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#A855F7]" />
                  <span className="h-3 w-20 bg-[#ffffff12] rounded animate-pulse" />
                </div>
                <div className="h-6 w-20 rounded bg-[#ffffff12] animate-pulse" />
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#F914AD]" />
                  <span className="h-3 w-24 bg-[#ffffff12] rounded animate-pulse" />
                </div>
                <div className="h-6 w-16 rounded bg-[#ffffff12] animate-pulse" />
              </div>
            </div>
          </div>
          <div className="h-6 w-24 bg-[#ffffff12] rounded animate-pulse" />
        </div>

        <div className="mt-6 h-52 rounded-md bg-[#ffffff08] animate-pulse" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="cards rounded-xl p-6 shadow-md h-full flex flex-col">
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2">
          {erro}
        </div>
      </div>
    );
  }

  return (
    <div className="shadow-md h-full flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <div
          className={`transition-opacity duration-300 ${
            animReady ? "opacity-100" : "opacity-0"
          }`}
        >
          <h3 className="text-sm text-white font-semibold mb-4">
            Controle de Incidentes
          </h3>

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
=======
  return (
    <div
      className={`rounded-xl shadow-md h-full flex flex-col relative overflow-hidden
      ${isWidget ? "p-6" : "p-0"}
    `}
    >

      {/* HEADER */}
      <div className="flex justify-between items-start mb-4 relative z-20">

        {/* Título + drag só na dashboard */}
        <div className="flex items-center gap-2">
          {isWidget && (
            <>
              <GripVertical
                size={18}
                className="drag-handle cursor-grab active:cursor-grabbing text-white/50 hover:text-white"
              />

            </>
          )}
          <h3 className="text-sm text-white font-semibold">
            Controle de Incidentes
          </h3>
>>>>>>> 1162e3f (Final - Edit dashboard)
        </div>

        {/* Select permanece SEM mudanças */}
        <div className={`${isWidget ? "mr-8" : ""}`}>
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

      {/* ERRO */}
      {erro && (
        <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2 mb-3">
          {erro}
        </div>
      )}

<<<<<<< HEAD
      <div
        className={`transition-opacity duration-500 ${
          animReady ? "opacity-100" : "opacity-0"
        }`}
      >
=======
      {/* BLOCO DE DADOS */}
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
              <span className="text-gray-500 text-base font-normal"> / {totalCasos}</span>
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-pink-400" />
              <span className="text-gray-400">Casos atribuídos</span>
            </div>
            <span className="text-white text-lg font-semibold">{totalAtribuidos}</span>
          </div>
        </div>
      )}

      {/* GRÁFICO */}
      {carregando ? (
        <div className="w-full h-52 bg-[#ffffff0a] rounded-xl animate-pulse" />
      ) : (
>>>>>>> 1162e3f (Final - Edit dashboard)
        <GraficoAreaSpline
          series={series}
          categoriasX={categoriasX}
          cores={["#A855F7", "#EC4899"]}
          hideXAxisLabels
        />
<<<<<<< HEAD
      </div>
=======
      )}

>>>>>>> 1162e3f (Final - Edit dashboard)
    </div>
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
    if (incidente.state_name === "Open")
      contagemAbertos[chave] = (contagemAbertos[chave] || 0) + 1;
    if (incidente.owner === ownerName)
      contagemAtribuidos[chave] = (contagemAtribuidos[chave] || 0) + 1;
  });

  const hoje = new Date();
<<<<<<< HEAD
  let diasOrdenados: string[] = [];

  if (dias === 0) {
    const todasDatas = [...Object.keys(contagemAbertos), ...Object.keys(contagemAtribuidos)];
    const minData = todasDatas.length
      ? new Date(Math.min(...todasDatas.map((d) => new Date(d).getTime())))
      : new Date();
    let d = new Date(minData);
    while (d <= hoje) {
      diasOrdenados.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
    }
  } else {
    diasOrdenados = Array.from({ length: dias }).map((_, i) => {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - (dias - 1 - i));
      return d.toISOString().slice(0, 10);
    });
  }
=======
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
>>>>>>> 1162e3f (Final - Edit dashboard)

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
