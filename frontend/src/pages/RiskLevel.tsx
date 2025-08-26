// Exemplo de página usando o layout
import LayoutModel from "../componentes/LayoutModel";
import GraficoGauge from '../componentes/graficos/GraficoGauge';
import GraficoDonut from "../componentes/graficos/GraficoDonut";
import FluxoIncidentes from "../componentes/iris/FluxoIncidentes";
import { getToken } from "../utils/auth";

export default function RiskLevel() {

    const dados = [
        { nivel: "Crítico", valor: 120, cor: "text-pink-500", borda: "border-pink-500" },
        { nivel: "Alto", valor: 80, cor: "text-purple-400", borda: "border-purple-400" },
        { nivel: "Médio", valor: 110, cor: "text-blue-400", borda: "border-blue-400" },
        { nivel: "Baixo", valor: 55, cor: "text-emerald-400", borda: "border-emerald-400" },
    ];

    const token = getToken();

    return (
        <LayoutModel titulo="Risk Level">
            <section className="cards p-6 rounded-2xl shadow-lg">
                <div className="flex flex-wrap justify-between items-start mb-6">
                    {/* Título */}
                    <div className="flex flex-col">
                        <h2 className="text-white text-sm font-medium">Nível de alertas</h2>
                        <span className="text-xs text-gray-400">nas últimas 24h</span>
                    </div>

                    {/* Totais */}
                    <div className="flex items-end gap-3 flex-wrap">
                        <h3 className="text-white text-base font-semibold">0 alertas totais</h3>
                        <p className="text-xs text-pink-500">↓ 12% <span className="text-gray-400">comparado às 24h anteriores</span></p>
                    </div>

                    {/* Dropdown */}
                    {/* <select className="cards text-white text-sm px-3 py-1 rounded-md border border-[#3B2A70] outline-none">
                        <option value="24h">24 horas</option>
                        <option value="48h">48 horas</option>
                        <option value="7d">7 dias</option>
                    </select> */}
                </div>

                {/* Grid com 5 colunas */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-stretch">
                    {/* Coluna 1 - Gráfico central */}
                    <div className="cards rounded-xl p-4 flex flex-col justify-center relative">
                        {/* Substitua pelo seu gráfico */}
                        <GraficoGauge valor={30} cor="#B832F6" />
                        <img
                            src="/assets/img/icon-risk.png"
                            alt="Risco"
                            className="absolute z-20 w-6 h-6 top-1/3 left-1/2 -translate-x-1/2 -translate-y-[72%] pointer-events-none"
                        />
                        <div className="flex gap-3 text-xs text-gray-300 mt-4">
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-emerald-400 rounded-full"></span> Baixo
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-blue-400 rounded-full"></span> Médio
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-purple-400 rounded-full"></span> Alto
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="w-3 h-3 bg-pink-500 rounded-full"></span> Crítico
                            </div>
                        </div>
                    </div>

                    {/* Reutilizável para cada severidade */}
                    {[
                        {
                            nivel: "Crítico",
                            valor: 0,
                            corTexto: "text-pink-500",
                            corBarra: "bg-pink-500",
                            variacao: "0%",
                            corVariacao: "text-pink-500",
                        },
                        {
                            nivel: "Alto",
                            valor: 0,
                            corTexto: "text-purple-400",
                            corBarra: "bg-purple-400",
                            variacao: "0%",
                            corVariacao: "text-pink-500",
                        },
                        {
                            nivel: "Médio",
                            valor: 432,
                            corTexto: "text-blue-400",
                            corBarra: "bg-blue-400",
                            variacao: "+32%",
                            corVariacao: "text-green-400",
                        },
                        {
                            nivel: "Baixo",
                            valor: 766.635,
                            corTexto: "text-emerald-400",
                            corBarra: "bg-emerald-400",
                            variacao: "-12%",
                            corVariacao: "text-pink-500",
                        },
                    ].map((item, index) => (
                        <div
                            key={index}
                            className="cards rounded-xl p-4 flex flex-col justify-between"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-gray-400">Gravidade</span>
                                <span className={`text-xs font-semibold ${item.corTexto}`}>
                                    {item.nivel}
                                </span>
                            </div>

                            <div className="flex flex-col gap-2 mt-auto">
                                {/* Linha com número, texto e variação */}
                                <div className="flex items-center justify-between">
                                    <div className="text-white text-2xl font-bold">{item.valor}</div>
                                    <div className="text-xs text-gray-400">Alertas</div>
                                    <div className={`text-xs font-medium ${item.corVariacao}`}>{item.variacao}</div>
                                </div>

                                {/* Barras */}
                                <div className="flex gap-1">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-1.5 h-2 rounded-sm ${item.corBarra}`}
                                            style={{ opacity: i < Math.floor(item.valor / 15) ? 1 : 0.2 }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8 items-stretch">
                {/* Coluna 1 - Top 10 Agentes com vulnerabilidades */}
                <div className="cards rounded-xl p-6 shadow-md">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-white font-semibold text-sm">Top 10 Agentes com vulnerabilidades</h3>
                        </div>
                        <select className="bg-[#0d0c22] text-white text-xs px-2 py-1 rounded-md border border-[#3B2A70]">
                            <option>24 horas</option>
                        </select>
                    </div>

                    {/* Tabela exemplo */}
                    <div className="flex flex-col gap-2 mt-4 divide-y divide-[#ffffff1e]">
                        {[
                            { id: 'INC-2354', data: '12/15, 14:23', nivel: 'Crítico', cor: 'badge-pink', barras: 'bg-pink-500', texto: 'text-[#a758ff]'},
                            { id: 'INC-2355', data: '12/15, 14:23', nivel: 'Médio', cor: 'badge-darkpink', barras: 'bg-indigo-400', texto: 'text-[#a758ff]'},
                            { id: 'INC-2356', data: '12/15, 14:23', nivel: 'Baixo', cor: 'badge-green', barras: 'bg-emerald-400', texto: 'text-[#a758ff]'},
                            { id: 'INC-2357', data: '12/15, 14:23', nivel: 'Alto', cor: 'badge-high', barras: 'bg-purple-400', texto: 'text-[#a758ff]'},
                            { id: 'INC-2354', data: '12/15, 14:23', nivel: 'Crítico', cor: 'badge-pink', barras: 'bg-pink-500', texto: 'text-[#a758ff]'},
                            { id: 'INC-2355', data: '12/15, 14:23', nivel: 'Médio', cor: 'badge-darkpink', barras: 'bg-indigo-400', texto: 'text-[#a758ff]'},
                            { id: 'INC-2356', data: '12/15, 14:23', nivel: 'Baixo', cor: 'badge-green', barras: 'bg-emerald-400', texto: 'text-[#a758ff]'},
                            { id: 'INC-2357', data: '12/15, 14:23', nivel: 'Alto', cor: 'badge-high', barras: 'bg-purple-400', texto: 'text-[#a758ff]'},
                            { id: 'INC-2355', data: '12/15, 14:23', nivel: 'Médio', cor: 'badge-darkpink', barras: 'bg-indigo-400', texto: 'text-[#a758ff]'},
                            { id: 'INC-2356', data: '12/15, 14:23', nivel: 'Baixo', cor: 'badge-green', barras: 'bg-emerald-400', texto: 'text-[#a758ff]'},
                        ].map((incidente, i) => {
                            const getQtdPreenchida = (nivel: string) => {
                                switch (nivel) {
                                    case 'Baixo': return 1;
                                    case 'Médio': return 2;
                                    case 'Alto': return 3;
                                    case 'Crítico': return 4;
                                    default: return 1;
                                }
                            };

                            const total = 4;
                            const qtdPreenchida = getQtdPreenchida(incidente.nivel);

                            return (
                                <div key={i} className="flex justify-between items-center text-sm text-gray-300 px-2 py-2 hover:bg-[#ffffff0a] rounded-md transition-all">
                                    <div className="flex items-center gap-6">
                                        <span className="font-medium text-gray-400">{incidente.id}</span>
                                        <span className="text-[11px] text-gray-400">{incidente.data}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`text-xs px-2 py-0.5 badge rounded-md ${incidente.texto} ${incidente.cor} `}>
                                            {incidente.nivel}
                                        </span>
                                        <div className="flex gap-1">
                                            {Array.from({ length: total }).map((_, j) => (
                                                <span
                                                    key={j}
                                                    className={`w-1.5 h-3 rounded-sm ${j < qtdPreenchida ? incidente.barras : 'bg-[#2b2b3a]'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Coluna 2 - Top 10 agentes com menores scores de CIS */}
                <div className="cards rounded-xl p-6 shadow-md h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-white font-semibold text-sm">Top 10 agentes com menores scores de CIS</h3>
                        </div>
                        <select className=" text-white text-xs px-2 py-1 rounded-md border border-[#3B2A70]">
                            <option>24 horas</option>
                        </select>
                    </div>

                    {/* Legenda no topo */}
                    <div className="flex gap-4 text-xs text-gray-400 mb-6">
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#1dd69a]" />Bom
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#6f58e6]" />Médio
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#6700ff]" />Alto
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#fb35b9]" />Crítico
                        </div>
                    </div>

                    {/* Lista de agentes com barras */}
                    <div className="flex flex-col gap-3">
                        {[
                            { nome: 'DB-SRV-010', valor: 22, cor: 'badge-green', texto: 'text-[#1dd69a]', border: 'border-[#1dd69a73]' },
                            { nome: 'DB-SRV-010', valor: 28, cor: 'badge-green', texto: 'text-[#1dd69a]', border: 'border-[#1dd69a73]' },
                            { nome: 'DB-SRV-010', valor: 34, cor: 'badge-darkpink', texto: 'text-[#6f58e6]', border: 'border-[#6f58e678]' },
                            { nome: 'DB-SRV-010', valor: 37, cor: 'badge-darkpink', texto: 'text-[#6f58e6]', border: 'border-[#6f58e678]' },
                            { nome: 'DB-SRV-010', valor: 41, cor: 'badge-high', texto: 'text-[#a758ff]', border: 'border-[#f5f0f940]' },
                            { nome: 'DB-SRV-010', valor: 65, cor: 'badge-high', texto: 'text-[#a758ff]', border: 'border-[#f5f0f940]' },
                            { nome: 'DB-SRV-010', valor: 68, cor: 'badge-high', texto: 'text-[#a758ff]', border: 'border-[#f5f0f940]' },
                            { nome: 'DB-SRV-010', valor: 76, cor: 'badge-pink', texto: 'text-[#fb35b9]', border: 'border-[#fb35b994]' },
                            { nome: 'DB-SRV-010', valor: 80, cor: 'badge-pink', texto: 'text-[#fb35b9]', border: 'border-[#fb35b994]' },
                            { nome: 'DB-SRV-010', valor: 84, cor: 'badge-pink', texto: 'text-[#fb35b9]', border: 'border-[#fb35b994]' },

                        ].map((item, i) => (
                            <div className={`w-full h-8 rounded-md border-1 ${item.border} relative overflow-hidden`}>
                                <div
                                    className={`h-full rounded-md ${item.cor}`}
                                    style={{ width: `${100 - item.valor}%` }}
                                />
                                <div className="absolute inset-0 flex items-center justify-between px-3 text-sm text-white">
                                    <span className="text-gray-400">{item.nome}</span>
                                    <span className={`${item.texto}`}>{item.valor}%</span>
                                </div>
                            </div>

                        ))}
                    </div>
                </div>

                {/* Coluna 3 - Dois cards empilhados */}
                <div className="flex flex-col h-full">
                    {/* Card superior */}
                    <div className="mb-4">
                        <div className="cards rounded-xl p-6 shadow-md h-full flex flex-col justify-between">
                            <GraficoDonut
                                labels={["Crítico", "Alto", "Médio", "Baixo"]}
                                series={[132, 500, 1800, 2100]}
                                cores={["#EC4899", "#6A55DC", "#6301F4", "#1DD69A"]}
                                height={220}
                            />

                            {/* Legenda centralizada */}
                            <div className="mt-6">
                                <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-300">
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> Baixo
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-[#6301F4]" /> Médio
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-[#6A55DC]" /> Alto
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-[#EC4899]" /> Crítico
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card inferior */}
                    <div className="flex-1">
                        <div className="cards rounded-xl p-6 shadow-md h-full">
                            <FluxoIncidentes token={token || ""} />
                        </div>
                    </div>

                </div>
            </section>
        </LayoutModel>
    );
}