// src/components/IaHumans.tsx
import { useEffect, useState } from "react";
import GraficoAreaSpline from "../graficos/GraficoAreaSpline";
import { getTodosCasos } from "../../services/iris/cases.service";

interface Incidente {
    case_id: number;
    case_name: string;
    case_description: string;
    case_open_date: string;
    classification_id: number;
    classification: string;
    opened_by: string;
}

interface Props {
    token: string;
    range?: string; // padrão "5d"
}

export default function IaHumans({ token }: Props) {
    const [series, setSeries] = useState<{ name: string; data: number[] }[]>([]);
    const [categoriasX, setCategoriasX] = useState<string[]>([]);
    const [totalIa, setTotalIa] = useState(0);
    const [totalHumanos, setTotalHumanos] = useState(0);
    const [filtroDias, setFiltroDias] = useState(7); // valor padrão

    useEffect(() => {
        async function fetch() {
            const response = await getTodosCasos(token);
            // @ts-ignore
            const data: Incidente[] = Array.isArray(response) ? response : response.data;
            // console.log("Incidentes recebidos:", data);

            // 🔄 Aplica filtro por dias antes de agrupar
            const hoje = new Date();
            const limite = new Date();
            limite.setDate(hoje.getDate() - filtroDias);

            const dataFiltrada = data.filter((incidente) => {
                const [mes, dia, ano] = incidente.case_open_date.split("/");
                const dataIncidente = new Date(`${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`);
                return dataIncidente >= limite;
            });

            const agrupado = agruparPorDia(dataFiltrada, filtroDias);
            console.log("Agrupado:", agrupado);

            setSeries(agrupado.series);
            setCategoriasX(agrupado.categoriasX);

            setTotalIa(agrupado.series[0].data.reduce((a, b) => a + b, 0));
            setTotalHumanos(agrupado.series[1].data.reduce((a, b) => a + b, 0));
        }

        fetch();
    }, [token, filtroDias]); // 👈 agora depende também de filtroDias


    return (
        <>
            <div className="flex justify-between items-start mb-4">
                {/* Esquerda: Título + subtítulos + números */}
                <div>
                    {/* Título principal */}
                    <h3 className="text-sm text-white">Tendência de Volume de Casos</h3>

                    {/* Subtítulos + números abaixo */}
                    <div className="flex gap-10 text-sm mt-4">
                        {/* Casos atribuídos */}
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-gray-400">IA vs Humanos</span>
                            </div>
                        </div>

                        {/* Casos de IA */}
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                                <span className="text-gray-400">Casos de IA</span>
                            </div>
                            <span className="text-white text-lg font-semibold">{totalIa}</span>
                        </div>

                        {/* Casos de Humanos */}
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                                <span className="text-gray-400">Casos de Humanos</span>
                            </div>
                            <span className="text-white text-lg font-semibold">{totalHumanos}</span>
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
            <div>
                <GraficoAreaSpline
                    series={series}
                    categoriasX={categoriasX}
                    cores={['#744CD8', '#ED35FB']}
                />
            </div>
        </>
    );

}

// função auxiliar de agrupamento por dia
function agruparPorDia(incidentes: Incidente[], dias: number) {
    const contagemIA: Record<string, number> = {};
    const contagemHumanos: Record<string, number> = {};

    // Corrige formato das datas e contabiliza
    incidentes.forEach((incidente) => {
        const [mes, dia, ano] = incidente.case_open_date.split("/");
        const data = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;

        if (incidente.opened_by === "automation_n8n") {
            contagemIA[data] = (contagemIA[data] || 0) + 1;
        } else {
            contagemHumanos[data] = (contagemHumanos[data] || 0) + 1;
        }
    });

    // 🔥 Garante os últimos 15 dias no gráfico, mesmo sem casos
    const hoje = new Date();
    const diasOrdenados: string[] = Array.from({ length: dias }).map((_, i) => {
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

    console.log("Total IA:", ia.reduce((a, b) => a + b, 0));
    console.log("Total Humanos:", humanos.reduce((a, b) => a + b, 0));

    return {
        categoriasX,
        series: [
            { name: "IA", data: ia },
            { name: "Humanos", data: humanos },
        ],
    };
}
