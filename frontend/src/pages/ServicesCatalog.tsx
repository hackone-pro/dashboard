// src/pages/ServicesCatalog.tsx

import { Link } from "react-router-dom";
import LayoutModel from '../componentes/LayoutModel';

import { GoShieldLock } from "react-icons/go";
import { PiShareNetworkDuotone, PiLockKeyLight } from "react-icons/pi";
import { HiOutlineIdentification } from "react-icons/hi2";
import { AiOutlineAim } from "react-icons/ai";
import { CiGlobe } from "react-icons/ci";
import { BsDatabaseLock } from "react-icons/bs";
import { TbHeartRateMonitor, TbCloudLock } from "react-icons/tb";

export default function ServicesCatalog() {

    return (
        <LayoutModel titulo="CSC">
            {/* Header */}
            <section className="p-6 rounded-2xl shadow-lg mb-3 flex justify-between items-center">
                <h2 className="text-white text-2xl">
                    CSC - Catálogo de Serviços de Cibersegurança
                </h2>
            </section>

            {/* Cards principais */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CARD 1 */}
                <div className="cards rounded-2xl flex flex-col justify-between">
                    <header
                        className="p-5 rounded-t-xl relative overflow-hidden"
                        style={{
                            background:
                                "radial-gradient(circle at top left, rgba(64, 32, 105, 1) 0%, rgba(30, 10, 49, 1) 48%, rgba(10, 6, 23, 1) 87%)",
                        }}
                    >
                        {/* Linha superior: ícone à esquerda, botão à direita */}
                        <div className="flex items-start justify-between">
                            {/* @ts-ignore */}
                            <GoShieldLock className="w-[40px] h-[40px] text-[#744CD8] flex-shrink-0" />
                            <Link
                                to="/service/trafego-seguro"
                                className="px-3 py-2 btn card text-[11px] text-white rounded-md transition-all duration-300 hover:text-purple-300"
                            >
                                Acessar Serviço →
                            </Link>
                        </div>
                        <div className="mt-3">
                            {/* @ts-ignore */}
                            <p className="text-lg text-white font-normal">Tráfego Seguro e Controle de Acesso</p>
                            <p className="text-sm text-gray-400 font-thin">Tráfego seguro e visibilidade de aplicações.</p>
                        </div>

                    </header>


                    <div className="flex flex-col gap-8 mt-4 py-5">
                        <div className="flex justify-between border-b border-[#cacaca33]">
                            {/* Coluna 1 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">96%</span> <br />
                                Taxa de Tráfego Bloqueado <br />
                                <img
                                    src="/assets/img/barras.jpg"
                                    alt="Barras"
                                    className="py-5 w-full object-contain"
                                />
                            </div>

                            {/* Divisor vertical */}
                            <span className="h-full w-px bg-[#cacaca33] mx-2"></span>

                            {/* Coluna 2 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">12,5 tb/dia</span> <br />
                                Tráfego analisado <br />
                                <img
                                    src="/assets/img/grafico-line.jpg"
                                    alt="Gráfico Line"
                                    className="py-5 w-full object-contain"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between pb-5">
                            {/* Coluna 1 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">560</span> <br />
                                Tentativas de intrusão por severidade <br />
                                <div className="flex gap-3 flex-wrap text-[12px] mt-4 text-gray-400">
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#1DD69A] rounded-xs"></span> Baixo</div>
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#6366F1] rounded-xs"></span> Médio</div>
                                </div>
                                <div className="flex gap-3 flex-wrap text-[12px] mt-2 text-gray-400">
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#A855F7] rounded-xs"></span> Alto</div>
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#F914AD] rounded-xs"></span> Crítico</div>
                                </div>
                            </div>

                            {/* Coluna 2 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <img
                                    src="/assets/img/donut.jpg"
                                    alt="Gráfico Line"
                                    className="py-5 w-[220px] object-contain px-3"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CARD 2 */}
                <div className="cards rounded-2xl flex flex-col justify-between">
                    <header
                        className="p-5 rounded-t-xl relative overflow-hidden"
                        style={{
                            background:
                                "radial-gradient(circle at top left, rgba(64, 32, 105, 1) 0%, rgba(30, 10, 49, 1) 48%, rgba(10, 6, 23, 1) 87%)",
                        }}
                    >
                        {/* Linha superior: ícone à esquerda, botão à direita */}
                        <div className="flex items-start justify-between">
                            {/* @ts-ignore */}
                            <PiShareNetworkDuotone className="w-[40px] h-[40px] text-[#744CD8] flex-shrink-0" />
                            <Link
                                to="/service/defesa-endpoints"
                                className="px-3 py-2 btn card text-[11px] text-white rounded-md transition-all duration-300 hover:text-purple-300"
                            >
                                Acessar Serviço →
                            </Link>
                        </div>
                        <div className="mt-3">
                            {/* @ts-ignore */}

                            <p className="text-lg text-white font-normal">Defesa de Endpoints (EDR/XDR)</p>
                            <p className="text-sm text-gray-400 font-thin">Detecção e Resposta avançada em dispositivos.</p>
                        </div>

                    </header>


                    <div className="flex flex-col gap-8 py-6">
                        <div className="flex justify-between border-b border-[#cacaca33]">
                            {/* Coluna 1 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">Top 5</span> <br />
                                Malwares detectados <br />
                                <img
                                    src="/assets/img/top5.jpg"
                                    alt="Barras"
                                    className="py-5 w-[200px] object-contain"
                                />
                            </div>

                            {/* Divisor vertical */}
                            <span className="h-full w-px bg-[#cacaca33] mx-2"></span>

                            {/* Coluna 2 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">1.254</span> <br />
                                Endpoints monitorados <br />
                                <img
                                    src="/assets/img/grafico-line2.jpg"
                                    alt="Gráfico Line"
                                    className="py-5 w-full object-contain"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between pb-5">
                            {/* Coluna 1 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">1.065</span> <br />
                                Incidentes detectados por gravidade <br />
                                <div className="flex gap-3 flex-wrap text-[12px] mt-4 text-gray-400">
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#1DD69A] rounded-xs"></span> Baixo</div>
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#6366F1] rounded-xs"></span> Médio</div>
                                </div>
                                <div className="flex gap-3 flex-wrap text-[12px] mt-2 text-gray-400">
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#A855F7] rounded-xs"></span> Alto</div>
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#F914AD] rounded-xs"></span> Crítico</div>
                                </div>
                            </div>

                            {/* Coluna 2 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <img
                                    src="/assets/img/barras2.jpg"
                                    alt="Gráfico Line"
                                    className="py-5 w-[220px] object-contain px-3"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CARD 3 */}
                <div className="cards rounded-2xl flex flex-col justify-between">
                    <header
                        className="p-5 rounded-t-xl relative overflow-hidden"
                        style={{
                            background:
                                "radial-gradient(circle at top left, rgba(64, 32, 105, 1) 0%, rgba(30, 10, 49, 1) 48%, rgba(10, 6, 23, 1) 87%)",
                        }}
                    >
                        {/* Linha superior: ícone à esquerda, botão à direita */}
                        <div className="flex items-start justify-between">
                            {/* @ts-ignore */}
                            <HiOutlineIdentification className="w-[40px] h-[40px] text-[#744CD8] flex-shrink-0" />

                            <Link
                                to="/service/identidade-e-acesso"
                                className="px-3 py-2 btn card text-[11px] text-white rounded-md transition-all duration-300 hover:text-purple-300 "
                            >
                                Acessar Serviço →
                            </Link>
                        </div>

                        {/* Bloco de textos em full width abaixo */}
                        <div className="mt-3">
                            <p className="text-lg text-white font-normal">Identidade e Acesso</p>
                            <p className="text-sm text-gray-400 font-thin">
                                Controle de Identidade, Autenticação e Acessos.
                            </p>
                        </div>
                    </header>



                    <div className="flex flex-col gap-4 mt-4 py-5">
                        <div className="flex justify-between border-b border-[#cacaca33]">
                            {/* Coluna 1 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">96%</span> <br />
                                Tentativas de acesso mal-sucedidas <br />
                                <img
                                    src="/assets/img/barras.jpg"
                                    alt="Barras"
                                    className="py-5 w-full h- object-contain"
                                />
                            </div>

                            {/* Divisor vertical */}
                            <span className="h-full w-px bg-[#cacaca33] mx-2"></span>

                            {/* Coluna 2 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">5.200</span> <br />
                                Logins monitorados/dia <br />
                                <img
                                    src="/assets/img/grafico-line2.jpg"
                                    alt="Gráfico Line"
                                    className="py-5 w-full h-[88px] object-contain"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between py-3">
                            {/* Coluna 1 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">Top 5</span> <br />
                                Usuários com mais tentativas de login suspeitas <br />
                            </div>

                            {/* Coluna 2 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <img
                                    src="/assets/img/users-top5.jpg"
                                    alt="Gráfico Line"
                                    className="py-5 w-full object-contain px-3"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CARD 4 */}
                <div className="cards rounded-2xl flex flex-col justify-between">
                    <header
                        className="p-5 rounded-t-xl relative overflow-hidden"
                        style={{
                            background:
                                "radial-gradient(circle at top left, rgba(64, 32, 105, 1) 0%, rgba(30, 10, 49, 1) 48%, rgba(10, 6, 23, 1) 87%)",
                        }}
                    >
                        {/* Linha superior: ícone à esquerda, botão à direita */}
                        <div className="flex items-start justify-between">
                            {/* @ts-ignore */}
                            <AiOutlineAim className="w-[40px] h-[40px] text-[#744CD8] flex-shrink-0" />
                            <Link
                                to="/service/vulnerabilidades"
                                className="px-3 py-2 btn card text-[11px] text-white rounded-md transition-all duration-300 hover:text-purple-300"
                            >
                                Acessar Serviço →
                            </Link>
                        </div>
                        <div className="mt-3">
                            {/* @ts-ignore */}
                            <p className="text-lg text-white font-normal">Vulnerabilidades</p>
                            <p className="text-sm text-gray-400 font-thin">Exposição de sistemas a falhas conhecidas.</p>
                        </div>
                    </header>


                    <div className="flex flex-col gap-4 mt-4 py-5">
                        <div className="flex justify-between border-b border-[#cacaca33]">
                            {/* Coluna 1 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">Top 5</span> <br />
                                Ativos com mais vulnerabilidades detectadas <br />
                                <img
                                    src="/assets/img/top5.jpg"
                                    alt="Barras"
                                    className="py-5 w-[180px] object-contain"
                                />
                            </div>

                            {/* Divisor vertical */}
                            <span className="h-full w-px bg-[#cacaca33] mx-2"></span>

                            {/* Coluna 2 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">430</span> <br />
                                Vulnerabilidades detectadas <br />
                                <img
                                    src="/assets/img/grafico-line.jpg"
                                    alt="Gráfico Line"
                                    className="py-5 w-full object-contain"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between py-3">
                            {/* Coluna 1 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">560</span> <br />
                                Vulnerabilidades por severidade <br />
                                <div className="flex gap-3 flex-wrap text-[12px] mt-4 text-gray-400">
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#1DD69A] rounded-xs"></span> Baixo</div>
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#6366F1] rounded-xs"></span> Médio</div>
                                </div>
                                <div className="flex gap-3 flex-wrap text-[12px] mt-2 text-gray-400">
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#A855F7] rounded-xs"></span> Alto</div>
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#F914AD] rounded-xs"></span> Crítico</div>
                                </div>
                            </div>

                            {/* Coluna 2 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <img
                                    src="/assets/img/donut.jpg"
                                    alt="Gráfico Line"
                                    className="py-5 w-[220px] object-contain px-3"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CARD 5 */}
                <div className="cards rounded-2xl flex flex-col justify-between">
                    <header
                        className="p-5 rounded-t-xl relative overflow-hidden"
                        style={{
                            background:
                                "radial-gradient(circle at top left, rgba(64, 32, 105, 1) 0%, rgba(30, 10, 49, 1) 48%, rgba(10, 6, 23, 1) 87%)",
                        }}
                    >
                        {/* Linha superior: ícone à esquerda, botão à direita */}
                        <div className="flex items-start justify-between">
                            {/* @ts-ignore */}
                            <CiGlobe className="w-[40px] h-[40px] text-[#744CD8] flex-shrink-0" />

                            <Link
                                to="/service/protecao-de-aplicacoes"
                                className="px-3 py-2 btn card text-[11px] text-white rounded-md transition-all duration-300 hover:text-purple-300"
                            >
                                Acessar Serviço →
                            </Link>
                        </div>
                        <div className="mt-3">
                            {/* @ts-ignore */}
                            <p className="text-lg text-white font-normal">Proteção de Aplicações Web (WAF/WAAP)</p>
                            <p className="text-sm text-gray-400 font-thin">Defesa contra ataques Web e APIs.</p>
                        </div>

                    </header>


                    <div className="flex flex-col gap-4 mt-4 py-5">
                        <div className="flex justify-between border-b border-[#cacaca33]">
                            {/* Coluna 1 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">92%</span> <br />
                                Taxa de bloqueio <br />
                                <img
                                    src="/assets/img/barras.jpg"
                                    alt="Barras"
                                    className="py-5 w-full object-contain"
                                />
                            </div>

                            {/* Divisor vertical */}
                            <span className="h-full w-px bg-[#cacaca33] mx-2"></span>

                            {/* Coluna 2 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">1500</span> <br />
                                Requisições bloqueadas/dia <br />
                                <img
                                    src="/assets/img/grafico-line.jpg"
                                    alt="Gráfico Line"
                                    className="py-5 w-full object-contain"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between py-3">
                            {/* Coluna 1 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">Top 5</span> <br />
                                Principais ataques bloqueados <br />
                                <div className="flex gap-3 flex-wrap text-[12px] mt-4 text-gray-400">
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#1DD69A] rounded-xs"></span> Baixo</div>
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#6366F1] rounded-xs"></span> Médio</div>
                                </div>
                                <div className="flex gap-3 flex-wrap text-[12px] mt-2 text-gray-400">
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#A855F7] rounded-xs"></span> Alto</div>
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#F914AD] rounded-xs"></span> Crítico</div>
                                </div>
                            </div>

                            {/* Coluna 2 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <img
                                    src="/assets/img/injections-top5.jpg"
                                    alt="Gráfico Line"
                                    className="py-5 w-[220px] object-contain px-3"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CARD 6 */}
                <div className="cards rounded-2xl flex flex-col justify-between">
                    <header
                        className="p-5 rounded-t-xl relative overflow-hidden"
                        style={{
                            background:
                                "radial-gradient(circle at top left, rgba(64, 32, 105, 1) 0%, rgba(30, 10, 49, 1) 48%, rgba(10, 6, 23, 1) 87%)",
                        }}
                    >
                        {/* Linha superior: ícone à esquerda, botão à direita */}
                        <div className="flex items-start justify-between">
                            {/* @ts-ignore */}
                            <BsDatabaseLock className="w-[40px] h-[40px] text-[#744CD8] flex-shrink-0" />

                            <Link
                                to="/service/protecao-de-dados"
                                className="px-3 py-2 btn card text-[11px] text-white rounded-md transition-all duration-300 hover:text-purple-300"
                            >
                                Acessar Serviço →
                            </Link>
                        </div>
                        <div className="mt-3">
                            {/* @ts-ignore */}
                            <p className="text-lg text-white font-normal">Proteção de Dados</p>
                            <p className="text-sm text-gray-400 font-thin">Prevenção contra vazamento de informações.</p>
                        </div>
                    </header>


                    <div className="flex flex-col gap-4 mt-4 py-5">
                        <div className="flex justify-between border-b border-[#cacaca33]">
                            {/* Coluna 1 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">87%</span> <br />
                                Conformidade em políticas <br />
                                <img
                                    src="/assets/img/barras.jpg"
                                    alt="Barras"
                                    className="py-5 w-full object-contain"
                                />
                            </div>

                            {/* Divisor vertical */}
                            <span className="h-full w-px bg-[#cacaca33] mx-2"></span>

                            {/* Coluna 2 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">2.1 tb</span> <br />
                                Dados monitorados <br />
                                <img
                                    src="/assets/img/grafico-line.jpg"
                                    alt="Gráfico Line"
                                    className="py-5 w-full object-contain"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between py-3">
                            {/* Coluna 1 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">340</span> <br />
                                Incidentes de vazamento por nível <br />
                                <div className="flex gap-3 flex-wrap text-[12px] mt-4 text-gray-400">
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#1DD69A] rounded-xs"></span> Baixo</div>
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#6366F1] rounded-xs"></span> Médio</div>
                                </div>
                                <div className="flex gap-3 flex-wrap text-[12px] mt-2 text-gray-400">
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#A855F7] rounded-xs"></span> Alto</div>
                                    <div className="flex items-center gap-1 text-gray-500"><span className="w-3 h-3 bg-[#F914AD] rounded-xs"></span> Crítico</div>
                                </div>
                            </div>

                            {/* Coluna 2 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <img
                                    src="/assets/img/donut-incidentes.jpg"
                                    alt="Gráfico Line"
                                    className="py-5 w-[220px] object-contain px-3"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CARD 7 */}
                <div className="cards rounded-2xl flex flex-col justify-start">
                    <header
                        className="p-5 rounded-t-xl relative overflow-hidden"
                        style={{
                            background:
                                "radial-gradient(circle at top left, rgba(64, 32, 105, 1) 0%, rgba(30, 10, 49, 1) 48%, rgba(10, 6, 23, 1) 87%)",
                        }}
                    >
                        {/* Linha superior: ícone à esquerda, botão à direita */}
                        <div className="flex items-start justify-between">
                            {/* @ts-ignore */}
                            <PiLockKeyLight className="w-[40px] h-[40px] text-[#744CD8] flex-shrink-0" />
                            <Link
                                to="/service/teste-de-intrusao"
                                className="px-3 py-2 btn card text-[11px] text-white rounded-md transition-all duration-300 hover:text-purple-300"
                            >
                                Acessar Serviço →
                            </Link>
                        </div>
                        <div className="mt-3">
                            {/* @ts-ignore */}
                            <p className="text-lg text-white font-normal">Teste de Intrusão (Pentest)</p>
                            <p className="text-sm text-gray-400 font-thin">Teste de intrusão em ambientes críticos.</p>
                        </div>
                    </header>


                    <div className="flex flex-col gap-4 mt-4 py-5">
                        <div className="flex justify-between border-b border-[#cacaca33]">
                            {/* Coluna 1 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">Vetores</span> <br />
                                Principais vetores <br /> de exploração <br />
                                <img
                                    src="/assets/img/vetores.jpg"
                                    alt="Barras"
                                    className="py-5 pt-6 w-[210px] object-contain"
                                />
                            </div>

                            {/* Divisor vertical */}
                            <span className="h-full w-px bg-[#cacaca33] mx-2"></span>

                            {/* Coluna 2 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 px-4">
                                <span className="text-[#744CD8] text-3xl">Brechas</span> <br />
                                Brechas detectadas por severidade <br />
                                <img
                                    src="/assets/img/vetores-severidade.jpg"
                                    alt="Gráfico Line"
                                    className="py-5 w-[200px] object-contain"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between py-3">
                            {/* Coluna 1 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">Nível de risco</span> <br />
                                Nível de risco geral <br />
                            </div>

                            {/* Coluna 2 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <img
                                    src="/assets/img/vetores-risco.jpg"
                                    alt="Gráfico Line"
                                    className="py-5 w-full object-contain px-3"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CARD 8 */}
                <div className="cards rounded-2xl flex flex-col justify-start">
                    <header
                        className="p-5 rounded-t-xl relative overflow-hidden"
                        style={{
                            background:
                                "radial-gradient(circle at top left, rgba(64, 32, 105, 1) 0%, rgba(30, 10, 49, 1) 48%, rgba(10, 6, 23, 1) 87%)",
                        }}
                    >
                        {/* Linha superior: ícone à esquerda, botão à direita */}
                        <div className="flex items-start justify-between">
                            {/* @ts-ignore */}
                            <TbHeartRateMonitor className="w-[40px] h-[40px] text-[#744CD8] flex-shrink-0" />

                            <Link
                                to="/service/monitoria"
                                className="px-3 py-2 btn card text-[11px] text-white rounded-md transition-all duration-300 hover:text-purple-300"
                            >
                                Acessar Serviço →
                            </Link>
                        </div>
                        <div className="mt-3">
                            {/* @ts-ignore */}
                            <p className="text-lg text-white font-normal">Monitoria</p>
                            <p className="text-sm text-gray-400 font-thin">Monitoramento do ambiente.</p>
                        </div>
                    </header>


                    <div className="flex flex-col gap-4 mt-4 py-5">
                        <div className="flex justify-between border-b border-[#cacaca33]">
                            {/* Coluna 1 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">Firewall</span> <br />
                                Status dos Firewalls <br />
                                <img
                                    src="/assets/img/barras-firewall.jpg"
                                    alt="Barras"
                                    className="py-5 w-[220px] object-contain"
                                />
                            </div>

                            {/* Divisor vertical */}
                            <span className="h-full w-px bg-[#cacaca33] mx-2"></span>

                            {/* Coluna 2 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 px-4">
                                <span className="text-[#744CD8] text-3xl">CPU e Memória</span> <br />
                                Uso médio por servidor <br />
                                <img
                                    src="/assets/img/barras-cpu.jpg"
                                    alt="Gráfico Line"
                                    className="py-5 w-[220px] object-contain"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between py-3">
                            {/* Coluna 1 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">VPN</span> <br />
                                Status e volume de tráfego<br /> por VPN <br />
                            </div>

                            {/* Coluna 2 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <img
                                    src="/assets/img/vpn.jpg"
                                    alt="Gráfico Line"
                                    className="py-5 w-full object-contain px-3"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CARD 9 */}
                <div className="cards rounded-2xl flex flex-col justify-between">
                    <header
                        className="p-5 rounded-t-xl relative overflow-hidden"
                        style={{
                            background:
                                "radial-gradient(circle at top left, rgba(64, 32, 105, 1) 0%, rgba(30, 10, 49, 1) 48%, rgba(10, 6, 23, 1) 87%)",
                        }}
                    >
                        {/* Linha superior: ícone à esquerda, botão à direita */}
                        <div className="flex items-start justify-between">
                            {/* @ts-ignore */}
                            <TbCloudLock className="w-[40px] h-[40px] text-[#744CD8] flex-shrink-0" />

                            <Link
                                to="/service/cloud-security"
                                className="px-3 py-2 btn card text-[11px] text-white rounded-md transition-all duration-300 hover:text-purple-300"
                            >
                                Acessar Serviço →
                            </Link>
                        </div>
                        <div className="mt-3">
                            {/* @ts-ignore */}
                            <p className="text-lg text-white font-normal">Cloud Security</p>
                            <p className="text-sm text-gray-400 font-thin">Análise das vulnerabilidades e alertas em cloud</p>
                        </div>
                    </header>


                    <div className="flex flex-col gap-4 mt-4 py-5">
                        <div className="flex justify-between border-b border-[#cacaca33]">
                            {/* Coluna 1 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">Shadow IT</span> <br />
                                Aplicações em uso e nível<br /> de risco 
                                <img
                                    src="/assets/img/shadow-it.jpg"
                                    alt="Barras"
                                    className="py-5 w-[200px] object-contain"
                                />
                            </div>

                            {/* Divisor vertical */}
                            <span className="h-full w-px bg-[#cacaca33] mx-2"></span>

                            {/* Coluna 2 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 px-4">
                                <span className="text-[#744CD8] text-3xl">Controle de Acesso</span> <br />
                                Score de risco global <br />
                                <img
                                    src="/assets/img/dispositivos.jpg"
                                    alt="Gráfico Line"
                                    className="py-5 w-[220px] object-contain"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between py-3">
                            {/* Coluna 1 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <span className="text-[#744CD8] text-3xl">Intercloud</span> <br />
                                Top fluxos bloqueados por<br /> origem → destino <br />
                            </div>

                            {/* Coluna 2 */}
                            <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                <img
                                    src="/assets/img/azure.jpg"
                                    alt="Gráfico Line"
                                    className="py-5 w-full object-contain px-3"
                                />
                            </div>
                        </div>
                    </div>
                </div>

            </section>
        </LayoutModel>
    );
}
