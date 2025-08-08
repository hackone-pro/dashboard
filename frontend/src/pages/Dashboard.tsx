// src/pages/Dashboard.tsx

import { useState, useEffect } from 'react'
import { logout } from "../utils/auth"
import { useNavigate } from "react-router-dom"
import { toastSuccess } from "../utils/toast"
import GraficoLinha24h from "../componentes/graficos/GraficoLinha"
import GraficoBarraEmpilhada from "../componentes/graficos/GraficoBarrasEmpilhadas"
import GraficoDonut from "../componentes/graficos/GraficoDonut"
import Contador from "../componentes/Contador"
import { FiSun, FiMoon } from 'react-icons/fi'
import RiskLevelCard from '../componentes/RiskLevelCard';
import MapaIncidentes from "../componentes/graficos/MapaIncidentes"
import GeoHitsMap from '../componentes/graficos/GeoHitsMap'


//Grafico Linha 24h
const seriesLinha24h = [
    {
        name: 'Alertas',
        data: [5, 8, 6, 10, 7, 12, 15, 20, 25, 23, 18, 14, 17, 22, 30, 28, 26, 20, 18, 15, 10, 8, 6, 4]
    }
];
const categoriasHoras = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

//Tendência de Alertas
const seriesTendencia = [
    {
        name: "Último mês",
        data: [15, 17, 19, 22, 24, 27, 30, 28, 26, 29, 32, 35],
    },
    {
        name: "Última Semana",
        data: [30, 28, 32, 25, 29, 34, 27, 30, 33, 36, 32, 31],
    },
]

const categoriasTendencia = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
]

//Alertas vs Incidentes Abertos
const seriesAlertas = [
    {
        name: "Alertas Gerados",
        data: [80, 76, 73, 82, 51, 75, 58, 79, 80, 73, 82, 51],
    },
    {
        name: "Incidentes Abertos",
        data: [20, 24, 27, 18, 49, 25, 42, 21, 20, 27, 18, 49],
    },
]

const categoriasMeses = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]

//Agentes
const seriesAgentes = [
    {
        name: "Wazuh",
        data: [44, 55, 41, 22, 43, 26],
    },
    {
        name: "Iris",
        data: [13, 23, 20, 13, 27, 41],
    },
]

const categoriasDatas = [
    "Jan '23", "03 Jan", "04 Jan", "05 Jan", "06 Jan", "07 Jan"
]


//Top 5
const donutSeries = [45, 25, 15, 10, 5]
const donutLabels = ["Wazuh", "Iris", "PX-VR", "Shuffle", "Outros"]



export default function Dashboard() {
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        toastSuccess('Logout realizado com sucesso!')
        navigate('/login')
    }

    const [temaClaro, setTemaClaro] = useState<boolean | undefined>(undefined);

    // Quando o componente montar, verificar tema salvo no localStorage
    useEffect(() => {
        const temaSalvo = localStorage.getItem('tema') === 'claro';
        setTemaClaro(temaSalvo);
        document.body.classList.remove('tema-claro', 'tema-escuro');
        document.body.classList.add(temaSalvo ? 'tema-claro' : 'tema-escuro');
    }, []);

    // Alternar entre claro e escuro
    const alternarTema = () => {
        const novoTemaClaro = !temaClaro;
        setTemaClaro(novoTemaClaro);
        localStorage.setItem('tema', novoTemaClaro ? 'claro' : 'escuro');
        document.body.classList.remove('tema-claro', 'tema-escuro');
        document.body.classList.add(novoTemaClaro ? 'tema-claro' : 'tema-escuro');
    };

    // Evita renderizar antes de saber o tema
    if (temaClaro === undefined) return null;

    return (
        <div className="min-h-screen px-6 py-4 fundo-dashboard texto-dashboard transition-colors duration-300">
            {/* Header */}
            <header className="flex items-center py-4 px-6 rounded-xl justify-between mb-8">
                <div className="flex items-center gap-2">
                    <img
                        src={temaClaro ? '/assets/img/SecurityOne_dark.png' : '/assets/img/SecurityOne.png'}
                        alt="Hackone"
                        className="h-15 transition-all duration-300"
                    />
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={alternarTema}
                        className="p-2 rounded-full transition"
                        title={temaClaro ? 'Modo Escuro' : 'Modo Claro'}
                    >
                        {temaClaro ? (
                            // @ts-ignore
                            <FiMoon className="text-purple-600 w-5 h-5" />
                        ) : (
                            // @ts-ignore
                            <FiSun className="text-white w-5 h-5" />
                        )}
                    </button>
                    <button onClick={handleLogout} className="logout font-semibold px-4 py-2 rounded-md transition-all">
                        Sair
                    </button>
                </div>
            </header>

            {/* Bloco: Bem-vindo + Gráfico + Cards */}

            <section className="grid md:grid-cols-5 gap-3 mb-8 items-start">
                {/* COLUNA 1 - menor */}
                <div className="flex flex-col gap-3">
                    <RiskLevelCard level="Medium" value={74} />
                    {/* Cards empilhados */}
                    <div className="grid gap-3 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                        <div className="cards p-6 rounded-sm shadow-lg w-full">
                            <h3 className="text-lg font-semibold text-white">Top Incidentes</h3>
                            <table className="w-full text-sm text-left text-gray-300">
                                <thead className="text-xs uppercase text-gray-400 border-b border-[#3B2A70]">
                                    <tr>
                                        <th className="px-4 py-2">Incidente</th>
                                        <th className="px-4 py-2">Severidade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#342470]">
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-white">INC-2354</td>
                                        <td className="px-4 py-3 text-yellow-400">Baixo</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-white">INC-2357</td>
                                        <td className="px-4 py-3 text-red-400">Alto</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-white">INC-2358</td>
                                        <td className="px-4 py-3 text-orange-400">Médio</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-white">INC-2360</td>
                                        <td className="px-4 py-3 text-yellow-400">Baixo</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-white">INC-2358</td>
                                        <td className="px-4 py-3 text-orange-400">Médio</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-white">INC-2354</td>
                                        <td className="px-4 py-3 text-yellow-400">Baixo</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-white">INC-2358</td>
                                        <td className="px-4 py-3 text-orange-400">Médio</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-white">INC-2358</td>
                                        <td className="px-4 py-3 text-orange-400">Médio</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-white">INC-2357</td>
                                        <td className="px-4 py-3 text-red-400">Alto</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-3 font-medium text-white">INC-2360</td>
                                        <td className="px-4 py-3 text-yellow-400">Baixo</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* COLUNA 2 - grande */}
                <div className="flex flex-col gap-3 md:col-span-2">
                    {/* Primeiro card */}
                    <div className="cards p-2 md:p-2 rounded-sm shadow-lg card-dashboard transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                        <h3 className="text-lg font-semibold text-white mb-4 uppercase pt-3 md:px-6 md:pt-3">Incidentes Globais</h3>
                        <GeoHitsMap />
                    </div>
                    {/* Segundo card (abaixo do primeiro, na mesma coluna) */}
                    <div className="cards p-6 md:p-8 rounded-sm shadow-lg card-dashboard transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                        <h3 className="text-lg font-semibold text-white mb-4 uppercase">Alertas Gerados vs Incidentes Abertos</h3>
                        <GraficoBarraEmpilhada
                            titulo="Alertas Gerados vs Incidentes Abertos"
                            series={seriesAlertas}
                            categories={categoriasMeses}
                        />
                    </div>
                </div>

                {/* COLUNA 3 - grande, agora com duas seções/cards */}
                <div className="flex flex-col gap-3 md:col-span-2">
                    {/* Primeiro card */}
                    <div className="cards p-6 md:px-8 rounded-sm shadow-lg card-dashboard transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                        <h3 className="text-lg font-semibold text-white mb-4 uppercase">
                            Current Risk
                        </h3>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-transparent text-center p-3 border border-[#3B2A70] rounded-sm">
                                <Contador valor={74} color="text-yellow-500" />
                                <p className="text-xs text-white uppercase">Overall Risk</p>
                            </div>
                            <div className="bg-transparent text-center p-3 border border-[#3B2A70] rounded-sm">
                                <Contador valor={20} color="text-red-500" />
                                <p className="text-xs text-white uppercase">High Risk Devices</p>
                            </div>
                            <div className="bg-transparent text-center p-3 border border-[#3B2A70] rounded-sm">
                                <Contador valor={7} color="text-red-500" />
                                <p className="text-xs text-white uppercase">High Risk Users</p>
                            </div>
                        </div>
                        <div className="flex justify-between">
                            <span className='text-white text-sm uppercase'>Tempo de Atualização:</span>
                            <span className='text-white text-sm'>24 HORAS</span>
                        </div>
                    </div>
                    {/* Segundo card (nova seção abaixo dos incidentes ativos) */}
                    <div className="cards px-6 pb-0 pt-6  rounded-sm shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                        <h3 className="text-lg font-semibold text-white mb-4 uppercase">Alertas nas Últimas 24 Horas</h3>
                        <GraficoLinha24h series={seriesLinha24h} categories={categoriasHoras} />
                    </div>
                    <div className="cards p-6 md:p-8 rounded-sm shadow-lg card-dashboard transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                        <h3 className="text-lg font-semibold text-white mb-4 uppercase">
                            Top 5 Agentes - Threat Hunting
                        </h3>
                        <GraficoDonut
                            titulo="Alertas - Últimas 24 Horas"
                            series={donutSeries}
                            labels={donutLabels}
                        />
                    </div>
                </div>
            </section>

            {/* Rodapé */}
            <footer className="text-center text-xs text-gray-500 mt-6 cards p-6 rounded-sm shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                © 2025 Hackone. Desenvolvido por Hackone.
            </footer>
        </div>
    )
}