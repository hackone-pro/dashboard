import { useEffect, useState } from "react";
import { getTodosCasos } from "../../services/iris/cases.service";
import GraficoAreaSpline from "../graficos/GraficoAreaSpline";

interface Incidente {
    case_id: number;
    case_name: string;
    case_description: string;
    case_open_date: string;
    state_name: string;
    owner: string;
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
    const [filtroDias, setFiltroDias] = useState(7);

    useEffect(() => {
        async function fetch() {
            const response = await getTodosCasos(token);
            // @ts-ignore
            const data: Incidente[] = Array.isArray(response) ? response : response.data;

            // 🔄 Aplica filtro por dias antes de agrupar
            const hoje = new Date();
            const limite = new Date();
            limite.setDate(hoje.getDate() - filtroDias);

            const abertos = data.filter((c) => c.state_name === "Open").length;
            const atribuidos = data.filter((c) => c.owner === "Roberto Maioli").length;

            setTotalAbertos(abertos);
            setTotalAtribuidos(atribuidos);
            setTotalCasos(data.length);

            const agrupado = agruparPorDia(data);
            setSeries(agrupado.series);
            setCategoriasX(agrupado.categoriasX);
        }

        fetch();
    }, [token]);

    return (
        <>
            <div className="flex justify-between items-start mb-4">
                {/* Esquerda: Título + subtítulos + números */}
                <div>
                    <h3 className="text-sm text-white font-semibold mb-4">
                        Fluxo de Incidentes no IRIS
                    </h3>

                    <div className="flex gap-10 text-sm">
                        {/* Casos Abertos */}
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                                <span className="text-gray-400">Casos abertos</span>
                            </div>
                            <span className="text-white text-lg font-semibold">
                                {totalAbertos}
                                <span className="text-gray-500 text-base font-normal"> / {totalCasos}</span>
                            </span>
                        </div>

                        {/* Casos Atribuídos */}
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                                <span className="text-gray-400">Casos atribuídos</span>
                            </div>
                            <span className="text-white text-lg font-semibold">{totalAtribuidos}</span>
                        </div>
                    </div>
                </div>
                {/* Direita: Select */}
                <div className="min-w-fit">
                    <select
                        className="bg-[#0d0c22] text-white text-xs px-2 py-1 rounded-sm border border-[#1D1929]"
                        value={filtroDias}
                        onChange={(e) => setFiltroDias(Number(e.target.value))}
                    >
                        <option value={1}>24 horas</option>
                        <option value={7}>7 dias</option>
                        <option value={15}>15 dias</option>
                        <option value={30}>30 dias</option>
                    </select>
                </div>
            </div>

            {/* Gráfico */}
            <GraficoAreaSpline
                series={series}
                categoriasX={categoriasX}
                cores={["#A855F7", "#EC4899"]}
                hideXAxisLabels
            />
        </>
    );
}

// Agrupar casos por dia (sem filtro de intervalo)
function agruparPorDia(incidentes: Incidente[]) {
    const contagemAbertos: Record<string, number> = {};
    const contagemAtribuidos: Record<string, number> = {};

    incidentes.forEach((incidente) => {
        const [mes, dia, ano] = incidente.case_open_date.split("/");
        const data = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;

        if (incidente.state_name === "Open") {
            contagemAbertos[data] = (contagemAbertos[data] || 0) + 1;
        }

        if (incidente.owner === "Roberto Maioli") {
            contagemAtribuidos[data] = (contagemAtribuidos[data] || 0) + 1;
        }
    });

    // Ordena datas cronologicamente
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
