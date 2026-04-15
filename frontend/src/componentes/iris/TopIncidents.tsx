import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getTenant } from "../../services/wazuh/tenant.service";
import { getTodosCasos } from "../../services/iris/cases.service";
import { useTenant } from "../../context/TenantContext";
import { GripVertical } from "lucide-react";

import {
  extrairSeveridadeDoTexto,
  detectarNivelPorNome,
  formatCaseName,
  sentenceCase
} from "../../utils/incidentes/helpers";

interface Incidente {
  case_id: number;
  case_name: string;
  case_description: string;
  case_open_date: string;
  classification_id: number;
  classification: string;
  client_name: string;
}

interface IncidenteSummary {
  id: number;
  nome: string;
  severidade: string;
  data: string;
}

interface Props {
  token: string;
  onDadosCarregados?: (incidentes: IncidenteSummary[]) => void;
}

export default function TopIncidentes({ token, onDadosCarregados }: Props) {
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [filtroDias, setFiltroDias] = useState(0);
  const [irisUrl, setIrisUrl] = useState<string>("");
  const navigate = useNavigate();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [animReady, setAnimReady] = useState(false);

  const { tenantAtivo, loading } = useTenant();

  const formatDateBR = (dateStr: string): string => {
    if (!dateStr) return "";
    const [mes, dia, ano] = dateStr.split("/");
    return `${dia.padStart(2, "0")}/${mes.padStart(2, "0")}/${ano}`;
  };

  /* =====================================
     MESMA LÓGICA DA PÁGINA INCIDENTES
  ===================================== */

  const mapNivelPorClassificationId = (id?: number | null) => {
    if (!id) return "Baixo";
    if ([1,2,11,12,13,25,32,33,34,35,36].includes(id)) return "Baixa";
    if ([3,4,5,14,15,22,30,31].includes(id)) return "Média";
    if ([6,7,8,9,10,16,23,26,27,28,29].includes(id)) return "Alta";
    if ([17,18,19,20,21,24].includes(id)) return "Crítica";
    return "Baixo";
  };

  const nivelDoIncidente = (i: Incidente) => {
    const severidadeTexto = extrairSeveridadeDoTexto(i.case_description);
    if (severidadeTexto) return severidadeTexto;

    const manual = detectarNivelPorNome(i.case_name || "");
    if (manual) return manual;

    return mapNivelPorClassificationId(i.classification_id);
  };

  /* ===================================== */

  useEffect(() => {
    if (loading || !tenantAtivo) return;

    let ativo = true;

    async function fetch() {
      try {
        setCarregando(true);
        setErro(null);
        setAnimReady(false);

        const tenant = await getTenant();
        if (!ativo) return;
        setIrisUrl(tenant.iris_url);

        const response = await getTodosCasos(token);
        const data: Incidente[] =
          Array.isArray(response) ? response : response.data;

        const hoje = new Date();
        const limite = new Date();
        limite.setDate(hoje.getDate() - filtroDias);

        const filtrado = data.filter((incidente) => {
          const [mes, dia, ano] = incidente.case_open_date.split("/");
          const dataIncidente = new Date(`${ano}-${mes}-${dia}`);

          if (filtroDias === 0) {
            return incidente.client_name === tenant.cliente_name;
          }

          return (
            dataIncidente >= limite &&
            incidente.client_name === tenant.cliente_name
          );
        });

        const ordenado = filtrado.sort((a, b) => b.case_id - a.case_id);

        if (!ativo) return;
        const top7 = ordenado.slice(0, 7);
        setIncidentes(top7);
        onDadosCarregados?.(top7.map((inc) => ({
          id: inc.case_id,
          nome: formatCaseName(inc.case_name),
          severidade: nivelDoIncidente(inc),
          data: formatDateBR(inc.case_open_date),
        })));
        setTimeout(() => ativo && setAnimReady(true), 50);
      } catch (e: any) {
        if (!ativo) return;
        setErro(e?.message ?? "Erro ao carregar incidentes");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    fetch();
    return () => {
      ativo = false;
    };
  }, [token, filtroDias, tenantAtivo]);

  /* =====================================
     VISUAL — MESMAS CORES ORIGINAIS
  ===================================== */

  const getCorBadge = (nivel: string) => {
    switch (nivel) {
      case "Crítica": return "badge-pink";
      case "Alta": return "badge-high";
      case "Média": return "badge-darkpink";
      case "Baixo": return "badge-green";
      default: return "badge-darkpink";
    }
  };

  const getCorBarra = (nivel: string) => {
    switch (nivel) {
      case "Crítica": return "bg-pink-500";
      case "Alta": return "bg-purple-400";
      case "Média": return "bg-indigo-400";
      case "Baixo": return "bg-emerald-400";
      default: return "bg-indigo-400";
    }
  };

  const getQtdPreenchida = (nivel: string) => {
    switch (nivel) {
      case "Baixo": return 1;
      case "Média": return 2;
      case "Alta": return 3;
      case "Crítica": return 4;
      default: return 2;
    }
  };

  return (
    <div className="cards p-6 rounded-2xl shadow-lg flex-grow">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <GripVertical size={18} className="text-white/50" />
          <h3 className="text-sm text-white">Últimos Incidentes</h3>
        </div>

        <select
          className="bg-[#0d0c22] text-white mr-5 text-xs px-2 py-1 rounded-md border border-[#cacaca31]"
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

      {carregando ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-10 bg-[#ffffff0f] rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className={`flex flex-col gap-2 divide-y divide-[#ffffff1e] transition-opacity duration-300 ${animReady ? "opacity-100" : "opacity-0"}`}>
          {incidentes.map((incidente) => {
            const nivel = nivelDoIncidente(incidente);
            const qtd = getQtdPreenchida(nivel);

            return (
              <div key={incidente.case_id} className="group flex flex-col text-sm text-gray-300 px-2 py-2 hover:bg-[#ffffff0a] rounded-md transition-all">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-gray-400">
                    {formatDateBR(incidente.case_open_date)}
                  </span>

                  <div className="flex items-center gap-4">
                    <span className={`text-[11px] px-2 py-0.5 rounded-md badge ${getCorBadge(nivel)}`}>
                      {sentenceCase(nivel)}
                    </span>

                    <div className="flex gap-1">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <span
                          key={j}
                          className={`w-1.5 h-3 rounded-sm ${
                            j < qtd ? getCorBarra(nivel) : "bg-[#2b2b3a]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-1">
                  <span className="font-medium text-gray-400 truncate max-w-[220px]">
                    #{incidente.case_id} - {formatCaseName(incidente.case_name)}
                  </span>

                  {irisUrl && (
                    <button
                      onClick={() => navigate(`/incidentes?open=${incidente.case_id}`)}
                      className="px-1 py-1 btn hover:bg-purple-600 text-[11px] text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      Ver →
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
