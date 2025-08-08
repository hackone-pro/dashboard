// src/pages/Dashboard.tsx

import { useState, useEffect } from 'react'
import { logout } from "../utils/auth"
import { useNavigate } from "react-router-dom"
import { toastSuccess } from "../utils/toast"
import GraficoLinha from "../componentes/graficos/GraficoLinha"
import GraficoBarraEmpilhada from "../componentes/graficos/GraficoBarrasEmpilhadas"
import GraficoBarrasEmpilhadas from "../componentes/graficos/GraficoBarrasEmpilahdasMes"
import GraficoDonut from "../componentes/graficos/GraficoDonut"
import GraficoRadialMultiplo from "../componentes/graficos/GraficoRadialMultiplo"
import Contador from "../componentes/Contador"
import { FiSun, FiMoon } from 'react-icons/fi'


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
                            <FiMoon className="text-purple-600 w-5 h-5" />
                        ) : (
                            <FiSun className="text-white w-5 h-5" />
                        )}
                    </button>
                    <button onClick={handleLogout} className="logout font-semibold px-4 py-2 rounded-md transition-all">
                        Sair
                    </button>
                </div>
            </header>

            {/* Bloco: Bem-vindo + Gráfico + Cards */}

            <section className="grid md:grid-cols-3 gap-6 mb-8">
                {/* COLUNA ESQUERDA: Bem-vindo + Cards */}
                <div className="md:col-span-2 flex flex-col gap-6">
                    {/* Bem-vindo */}
                    <div className="cards p-6 md:p-8 rounded-2xl shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg card-dashboard">
                        <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">
                            Bem-vindo, Usuário 🎉
                        </h2>
                        <p className="text-sm text-gray-300 mb-6">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent sodales nulla ut ultricies fringilla. Ut facilisis orci pretium velit vulputate, vitae egestas nisi mattis. Morbi vulputate purus justo, vitae ornare dui aliquam in.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-5 py-2 rounded-lg transition-all">
                                Acessar Wazuh
                            </button>
                            <button className="bg-purple-700 hover:bg-purple-500 text-white font-bold px-5 py-2 rounded-lg transition-all">
                                Acessar Iris
                            </button>
                        </div>
                    </div>

                    {/* Cards empilhados */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ">
                        <div className="cards p-6 rounded-2xl shadow-lg text-center transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                            <Contador valor={25} color="text-cyan-500" />
                            <div className="text-sm text-gray-300">Total de Incidentes</div>
                        </div>

                        <div className="cards p-6 rounded-2xl shadow-lg text-center transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                            <Contador valor={15} color="text-yellow-500" />
                            <div className="text-sm text-gray-300">Incidentes em Investigação</div>
                        </div>

                        <div className="cards p-6 rounded-2xl shadow-lg text-center transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                            <Contador valor={10} color="text-green-500" />
                            <div className="text-sm text-gray-300">Incidentes Resolvidos</div>
                        </div>

                        <div className="cards p-6 rounded-2xl shadow-lg text-center transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                            <Contador valor={3519} color="text-red-500" />
                            <div className="text-sm text-gray-300">Alertas de Segurança</div>
                        </div>
                    </div>
                </div>

                {/* Linha 1 - col-span-1: Tendência de Alertas */}
                <div className="cards p-6 md:p-8 rounded-2xl shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Tendência de alertas</h3>
                    <div className="flex justify-center items-center text-gray-400">
                        <GraficoLinha
                            titulo="Tendência de alertas"
                            series={seriesTendencia}
                            categories={categoriasTendencia}
                        />
                    </div>
                </div>
            </section>

            {/* Seção: Alertas Gerados + Alertas 24h + Agentes Conectados */}
            <section className="grid md:grid-cols-3 gap-6 mb-8">
                {/* Gráfico Barras - Alertas vs Incidentes */}
                <div className="md:col-span-2 cards p-6 md:p-8 rounded-2xl shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-10">
                        Alertas Gerados vs Incidentes Abertos
                    </h3>
                    <div className="flex justify-center items-center h-56 text-gray-400">
                        <GraficoBarraEmpilhada
                            titulo="Alertas Gerados vs Incidentes Abertos"
                            series={seriesAlertas}
                            categories={categoriasMeses}
                        />
                    </div>
                </div>

                {/* Coluna lateral direita */}
                <div className="flex flex-col gap-6 transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                    {/* Gráfico Donut - Alertas 24h */}
                    <div className="cards p-6 rounded-2xl shadow-lg">
                        <h3 className="text-lg font-semibold text-white mb-4">
                            Alertas - Últimas 24 Horas
                        </h3>
                        <div className="flex justify-center items-center text-gray-400">
                            <GraficoRadialMultiplo
                                series={[375, 300, 200]}
                                labels={["Alto", "Médio", "Baixo"]}
                                total={875}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Seção final: Incidentes + Donut + Vulnerabilidades + Barras */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Seus Principais Incidentes */}
                <div className="cards p-6 rounded-2xl shadow-md overflow-x-auto transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Seus Principais Incidentes</h3>

                    <table className="min-w-full text-sm text-left text-gray-300">
                        <thead className="text-xs uppercase text-gray-400 border-b border-[#3B2A70]">
                            <tr>
                                <th className="px-4 py-2">Incidente</th>
                                <th className="px-4 py-2">Severidade</th>
                                <th className="px-4 py-2">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#342470]">
                            <tr>
                                <td className="px-4 py-3 font-medium text-white">INC-2354</td>
                                <td className="px-4 py-3 text-yellow-400">Baixo</td>
                                <td className="px-4 py-3">Aguardando resposta</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-medium text-white">INC-2357</td>
                                <td className="px-4 py-3 text-red-400">Alto</td>
                                <td className="px-4 py-3">Em investigação</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-medium text-white">INC-2358</td>
                                <td className="px-4 py-3 text-orange-400">Médio</td>
                                <td className="px-4 py-3">Em investigação</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-medium text-white">INC-2360</td>
                                <td className="px-4 py-3 text-yellow-400">Baixo</td>
                                <td className="px-4 py-3">Aguardando resposta</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-medium text-white">INC-2358</td>
                                <td className="px-4 py-3 text-orange-400">Médio</td>
                                <td className="px-4 py-3">Em investigação</td>
                            </tr>
                            <tr>
                                <td className="px-4 py-3 font-medium text-white">INC-2354</td>
                                <td className="px-4 py-3 text-yellow-400">Baixo</td>
                                <td className="px-4 py-3">Aguardando resposta</td>
                            </tr>
                        </tbody>
                        <tr>
                            <td className="px-4 py-3 font-medium text-white">INC-2358</td>
                            <td className="px-4 py-3 text-orange-400">Médio</td>
                            <td className="px-4 py-3">Em investigação</td>
                        </tr>
                    </table>
                </div>

                {/* Donut Chart - Top 5 Agentes */}
                <div className="cards p-6 rounded-2xl shadow-lg flex flex-col transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Top 5 Agentes - Threat Hunting</h3>
                    <div className="flex-grow flex justify-center items-center text-gray-400 h-40">
                        <GraficoDonut
                            titulo="Alertas - Últimas 24 Horas"
                            series={donutSeries}
                            labels={donutLabels}
                        />
                    </div>
                </div>

                {/* Top 5 Vulnerabilidades */}
                <div className="cards p-6 rounded-2xl shadow-md transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Top 5 - Vulnerabilidades</h3>

                    {/* Indicadores de Severidade */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-transparent text-center p-3 border border-[#3B2A70] rounded-lg">
                            <Contador valor={90} color="text-red-500" />
                            <p className="text-xs text-white">Critical - Severity</p>
                        </div>
                        <div className="bg-transparent text-center p-3 border border-[#3B2A70] rounded-lg">
                            <Contador valor={15} color="text-yellow-500" />
                            <p className="text-xs text-white">High - Severity</p>
                        </div>
                        <div className="bg-transparent text-center p-3 border border-[#3B2A70] rounded-lg">
                            <Contador valor={0} color="text-cyan-500" />
                            <p className="text-xs text-white">Medium - Severity</p>
                        </div>
                        <div className="bg-transparent text-center p-3 border border-[#3B2A70] rounded-lg">
                            <Contador valor={5} color="text-gray-500" />
                            <p className="text-xs text-white">Low - Severity</p>
                        </div>
                    </div>

                    {/* Lista de CVEs */}
                    <ul className="divide-y divide-[#342470] text-sm text-gray-300">
                        <li className="flex justify-between py-2">
                            <span>CVE-2022-3219</span>
                            <span className="text-white">Count: 33</span>
                        </li>
                        <li className="flex justify-between py-2">
                            <span>CVE-2023-34969</span>
                            <span className="text-white">Count: 17</span>
                        </li>
                        <li className="flex justify-between py-2">
                            <span>CVE-2022-321900</span>
                            <span className="text-white">Count: 15</span>
                        </li>
                        <li className="flex justify-between py-2">
                            <span>CVE-2022-321900</span>
                            <span className="text-white">Count: 15</span>
                        </li>
                        <li className="flex justify-between py-2">
                            <span>CVE-2024-10041</span>
                            <span className="text-white">Count: 12</span>
                        </li>
                    </ul>
                </div>

                {/* Barras - Alertas dos Agentes */}
                <div className="cards p-6 rounded-2xl shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4">Alertas dos Agentes</h3>
                    <div className="flex justify-center items-center text-gray-400">
                        <GraficoBarrasEmpilhadas
                            series={seriesAgentes}
                            categories={categoriasDatas}
                        />
                    </div>
                </div>
            </section>

            {/* Rodapé */}
            <footer className="text-center text-xs text-gray-500 mt-6 cards p-6 rounded-2xl shadow-lg transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-lg">
                © 2025 Hackone. Desenvolvido por Hackone.
            </footer>
        </div>
    )
}