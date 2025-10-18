// src/pages/ServicesModel.tsx

import { useParams, Link } from "react-router-dom";
import LayoutModel from '../componentes/LayoutModel';

import { GoShieldLock } from "react-icons/go";
import { PiShareNetworkDuotone, PiLockKeyLight } from "react-icons/pi";
import { HiOutlineIdentification } from "react-icons/hi2";
import { AiOutlineAim } from "react-icons/ai";
import { CiGlobe } from "react-icons/ci";
import { BsDatabaseLock } from "react-icons/bs";

export default function ServiceModel() {

    const { nome } = useParams<{ nome: string }>();

    // 🔹 Títulos customizados com acentos, maiúsculas e espaços definidos manualmente
    const titulos: Record<string, string> = {
        "trafego-seguro": "Tráfego Seguro e Controle de Acesso",
        "defesa-endpoints": "Defesa de Endpoints (EDR/XDR)",
        "identidade-e-acesso": "Identidade e Acesso",
        "vulnerabilidades": "Vulnerabilidades",
        "protecao-de-aplicacoes": "Proteção de Aplicações",
        "protecao-de-dados": "Proteção de Dados",
        "teste-de-intrusao": "Teste de Intrusão (Pentest)",
        "monitoria": "Monitoria",
        "cloud-security": "Cloud Security",
    };

    // 🔹 Puxa o título certo ou gera um fallback
    const serviceTitle = titulos[nome || ""] || "Serviço de Cibersegurança";
    const pageTitle = `CSC - ${serviceTitle}`;

    // 🔹 Link do botão (pode ser dinâmico depois)
    const buttonLink = `/agendar/${nome}`;

    return (
        <LayoutModel titulo={pageTitle}>

            {/* Body principal com overlay */}
            <div className="relative overflow-hidden">
                {/* Camada dos cards com blur */}
                <div className="relative z-0 opacity-40 blur-sm pointer-events-none select-none">
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* CARD 1 */}
                        <div className="cards rounded-2xl flex flex-col justify-between">
                            <header
                                className="flex justify-between items-start p-5 rounded-t-xl relative overflow-hidden"
                                style={{
                                    background:
                                        "radial-gradient(circle at top left, rgba(64,32,105,1) 0%, rgba(30,10,49,1) 48%, rgba(10,6,23,1) 87%)",
                                }}
                            >
                                <div>
                                    {/* @ts-ignore */}
                                    <GoShieldLock className="w-[40px] h-[40px] text-[#744CD8] mb-3" />
                                    <p className="text-md text-white font-normal">
                                        Tráfego Seguro e Controle de Acesso
                                    </p>
                                    <p className="text-sm text-gray-400 font-thin">
                                        Tráfego seguro e visibilidade de aplicações.
                                    </p>
                                </div>
                                <button className="px-2 py-2 btn card text-[11px] text-white rounded-md transition-all duration-300">
                                    Acessar Serviço →
                                </button>
                            </header>

                            <div className="flex flex-col gap-4 mt-4 py-5">
                                <div className="flex justify-between border-b border-[#cacaca33]">
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <span className="text-[#744CD8] text-3xl">96%</span>
                                        <br />
                                        Taxa de Tráfego Bloqueado
                                        <br />
                                        <img
                                            src="/assets/img/barras.jpg"
                                            alt="Barras"
                                            className="py-5 w-full object-contain"
                                        />
                                    </div>
                                    <span className="h-full w-px bg-[#cacaca33] mx-2"></span>
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <span className="text-[#744CD8] text-3xl">12,5 tb/dia</span>
                                        <br />
                                        Tráfego analisado
                                        <br />
                                        <img
                                            src="/assets/img/grafico-line.jpg"
                                            alt="Gráfico Line"
                                            className="py-5 w-full object-contain"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between py-3">
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <span className="text-[#744CD8] text-3xl">560</span>
                                        <br />
                                        Tentativas de intrusão por severidade
                                        <br />
                                        <div className="flex gap-3 flex-wrap text-[10px] mt-4 text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#1DD69A] rounded-xs"></span>
                                                Baixo
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#6366F1] rounded-xs"></span>
                                                Médio
                                            </div>
                                        </div>
                                        <div className="flex gap-3 flex-wrap text-[10px] mt-2 text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#A855F7] rounded-xs"></span>
                                                Alto
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#F914AD] rounded-xs"></span>
                                                Crítico
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <img
                                            src="/assets/img/donut.jpg"
                                            alt="Gráfico Line"
                                            className="py-5 w-full object-contain px-3"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CARD 2 */}
                        <div className="cards rounded-2xl flex flex-col justify-between">
                            <header
                                className="flex justify-between items-start p-5 rounded-t-xl relative overflow-hidden"
                                style={{
                                    background:
                                        "radial-gradient(circle at top left, rgba(64,32,105,1) 0%, rgba(30,10,49,1) 48%, rgba(10,6,23,1) 87%)",
                                }}
                            >
                                <div>
                                    {/* @ts-ignore */}
                                    <PiShareNetworkDuotone className="w-[40px] h-[40px] text-[#744CD8] mb-3" />
                                    <p className="text-md text-white font-normal">
                                        Defesa de Endpoints (EDR/XDR)
                                    </p>
                                    <p className="text-sm text-gray-400 font-thin">
                                        Detecção e Resposta avançada em dispositivos.
                                    </p>
                                </div>
                                <button className="px-2 py-2 btn card text-[11px] text-white rounded-md transition-all duration-300">
                                    Acessar Serviço →
                                </button>
                            </header>

                            <div className="flex flex-col gap-4 mt-4 py-5">
                                <div className="flex justify-between border-b border-[#cacaca33]">
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <span className="text-[#744CD8] text-3xl">Top 5</span>
                                        <br />
                                        Malwares detectados
                                        <br />
                                        <img
                                            src="/assets/img/top5.jpg"
                                            alt="Barras"
                                            className="py-5 w-[180px] object-contain"
                                        />
                                    </div>
                                    <span className="h-full w-px bg-[#cacaca33] mx-2"></span>
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <span className="text-[#744CD8] text-3xl">1.254</span>
                                        <br />
                                        Endpoints monitorados
                                        <br />
                                        <img
                                            src="/assets/img/grafico-line2.jpg"
                                            alt="Gráfico Line"
                                            className="py-5 w-full h-[88px] object-contain"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between py-3">
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <span className="text-[#744CD8] text-3xl">1.065</span>
                                        <br />
                                        Incidentes detectados por gravidade
                                        <br />
                                        <div className="flex gap-3 flex-wrap text-[10px] mt-4 text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#1DD69A] rounded-xs"></span>
                                                Baixo
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#6366F1] rounded-xs"></span>
                                                Médio
                                            </div>
                                        </div>
                                        <div className="flex gap-3 flex-wrap text-[10px] mt-2 text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#A855F7] rounded-xs"></span>
                                                Alto
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#F914AD] rounded-xs"></span>
                                                Crítico
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <img
                                            src="/assets/img/barras2.jpg"
                                            alt="Gráfico Line"
                                            className="py-5 w-full object-contain px-3"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CARD 3 */}
                        <div className="cards rounded-2xl flex flex-col justify-between">
                            <header
                                className="flex justify-between items-start p-5 rounded-t-xl relative overflow-hidden"
                                style={{
                                    background:
                                        "radial-gradient(circle at top left, rgba(64,32,105,1) 0%, rgba(30,10,49,1) 48%, rgba(10,6,23,1) 87%)",
                                }}
                            >
                                <div>
                                    {/* @ts-ignore */}
                                    <HiOutlineIdentification className="w-[40px] h-[40px] text-[#744CD8] mb-3" />
                                    <p className="text-md text-white font-normal">Identidade e Acesso</p>
                                    <p className="text-sm text-gray-400 font-thin">
                                        Controle de Identidade, Autenticação e Acessos.
                                    </p>
                                </div>
                                <button className="px-2 py-2 btn card text-[11px] text-white rounded-md transition-all duration-300">
                                    Acessar Serviço →
                                </button>
                            </header>

                            <div className="flex flex-col gap-4 mt-4 py-5">
                                <div className="flex justify-between border-b border-[#cacaca33]">
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <span className="text-[#744CD8] text-3xl">96%</span>
                                        <br />
                                        Tentativas de acesso mal-sucedidas
                                        <br />
                                        <img
                                            src="/assets/img/barras.jpg"
                                            alt="Barras"
                                            className="py-5 w-full object-contain"
                                        />
                                    </div>
                                    <span className="h-full w-px bg-[#cacaca33] mx-2"></span>
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <span className="text-[#744CD8] text-3xl">5.200</span>
                                        <br />
                                        Logins monitorados/dia
                                        <br />
                                        <img
                                            src="/assets/img/grafico-line2.jpg"
                                            alt="Gráfico Line"
                                            className="py-5 w-full h-[88px] object-contain"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between py-3">
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <span className="text-[#744CD8] text-3xl">Top 5</span>
                                        <br />
                                        Usuários com mais tentativas de login suspeitas
                                        <br />
                                    </div>
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
                                className="flex justify-between items-start p-5 rounded-t-xl relative overflow-hidden"
                                style={{
                                    background:
                                        "radial-gradient(circle at top left, rgba(64,32,105,1) 0%, rgba(30,10,49,1) 48%, rgba(10,6,23,1) 87%)",
                                }}
                            >
                                <div>
                                    {/* @ts-ignore */}
                                    <AiOutlineAim className="w-[40px] h-[40px] text-[#744CD8] mb-3" />
                                    <p className="text-md text-white font-normal">Vulnerabilidades</p>
                                    <p className="text-sm text-gray-400 font-thin">
                                        Exposição de sistemas a falhas conhecidas.
                                    </p>
                                </div>
                                <button className="px-2 py-2 btn card text-[11px] text-white rounded-md transition-all duration-300">
                                    Acessar Serviço →
                                </button>
                            </header>

                            <div className="flex flex-col gap-4 mt-4 py-5">
                                <div className="flex justify-between border-b border-[#cacaca33]">
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <span className="text-[#744CD8] text-3xl">Top 5</span>
                                        <br />
                                        Ativos com mais vulnerabilidades detectadas
                                        <br />
                                        <img
                                            src="/assets/img/top5.jpg"
                                            alt="Barras"
                                            className="py-5 w-[180px] object-contain"
                                        />
                                    </div>
                                    <span className="h-full w-px bg-[#cacaca33] mx-2"></span>
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <span className="text-[#744CD8] text-3xl">430</span>
                                        <br />
                                        Vulnerabilidades detectadas
                                        <br />
                                        <img
                                            src="/assets/img/grafico-line.jpg"
                                            alt="Gráfico Line"
                                            className="py-5 w-full object-contain"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between py-3">
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <span className="text-[#744CD8] text-3xl">560</span>
                                        <br />
                                        Vulnerabilidades por severidade
                                        <br />
                                        <div className="flex gap-3 flex-wrap text-[10px] mt-4 text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#1DD69A] rounded-xs"></span>
                                                Baixo
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#6366F1] rounded-xs"></span>
                                                Médio
                                            </div>
                                        </div>
                                        <div className="flex gap-3 flex-wrap text-[10px] mt-2 text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#A855F7] rounded-xs"></span>
                                                Alto
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#F914AD] rounded-xs"></span>
                                                Crítico
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <img
                                            src="/assets/img/donut.jpg"
                                            alt="Gráfico Line"
                                            className="py-5 w-full object-contain px-3"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CARD 5 */}
                        <div className="cards rounded-2xl flex flex-col justify-between">
                            <header
                                className="flex justify-between items-start p-5 rounded-t-xl relative overflow-hidden"
                                style={{
                                    background:
                                        "radial-gradient(circle at top left, rgba(64,32,105,1) 0%, rgba(30,10,49,1) 48%, rgba(10,6,23,1) 87%)",
                                }}
                            >
                                <div>
                                    {/* @ts-ignore */}
                                    <CiGlobe className="w-[40px] h-[40px] text-[#744CD8] mb-3" />
                                    <p className="text-md text-white font-normal">
                                        Proteção de Aplicações Web (WAF/WAAP)
                                    </p>
                                    <p className="text-sm text-gray-400 font-thin">
                                        Defesa contra ataques Web e APIs.
                                    </p>
                                </div>
                                <button className="px-2 py-2 btn card text-[11px] text-white rounded-md transition-all duration-300">
                                    Acessar Serviço →
                                </button>
                            </header>

                            <div className="flex flex-col gap-4 mt-4 py-5">
                                <div className="flex justify-between border-b border-[#cacaca33]">
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <span className="text-[#744CD8] text-3xl">92%</span>
                                        <br />
                                        Taxa de bloqueio
                                        <br />
                                        <img
                                            src="/assets/img/barras.jpg"
                                            alt="Barras"
                                            className="py-5 w-full object-contain"
                                        />
                                    </div>
                                    <span className="h-full w-px bg-[#cacaca33] mx-2"></span>
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <span className="text-[#744CD8] text-3xl">1500</span>
                                        <br />
                                        Requisições bloqueadas/dia
                                        <br />
                                        <img
                                            src="/assets/img/grafico-line.jpg"
                                            alt="Gráfico Line"
                                            className="py-5 w-full object-contain"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between py-3">
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <span className="text-[#744CD8] text-3xl">Top 5</span>
                                        <br />
                                        Principais ataques bloqueados
                                        <br />
                                        <div className="flex gap-3 flex-wrap text-[10px] mt-4 text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#1DD69A] rounded-xs"></span>
                                                Baixo
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#6366F1] rounded-xs"></span>
                                                Médio
                                            </div>
                                        </div>
                                        <div className="flex gap-3 flex-wrap text-[10px] mt-2 text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#A855F7] rounded-xs"></span>
                                                Alto
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#F914AD] rounded-xs"></span>
                                                Crítico
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <img
                                            src="/assets/img/injections-top5.jpg"
                                            alt="Gráfico Line"
                                            className="py-5 w-full object-contain px-3"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* CARD 6 */}
                        <div className="cards rounded-2xl flex flex-col justify-between">
                            <header
                                className="flex justify-between items-start p-5 rounded-t-xl relative overflow-hidden"
                                style={{
                                    background:
                                        "radial-gradient(circle at top left, rgba(64,32,105,1) 0%, rgba(30,10,49,1) 48%, rgba(10,6,23,1) 87%)",
                                }}
                            >
                                <div>
                                    {/* @ts-ignore */}
                                    <BsDatabaseLock className="w-[40px] h-[40px] text-[#744CD8] mb-3" />
                                    <p className="text-md text-white font-normal">Proteção de Dados</p>
                                    <p className="text-sm text-gray-400 font-thin">
                                        Prevenção contra vazamento de informações.
                                    </p>
                                </div>
                                <button className="px-2 py-2 btn card text-[11px] text-white rounded-md transition-all duration-300">
                                    Acessar Serviço →
                                </button>
                            </header>

                            <div className="flex flex-col gap-4 mt-4 py-5">
                                <div className="flex justify-between border-b border-[#cacaca33]">
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <span className="text-[#744CD8] text-3xl">87%</span>
                                        <br />
                                        Conformidade em políticas
                                        <br />
                                        <img
                                            src="/assets/img/barras.jpg"
                                            alt="Barras"
                                            className="py-5 w-full object-contain"
                                        />
                                    </div>
                                    <span className="h-full w-px bg-[#cacaca33] mx-2"></span>
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <span className="text-[#744CD8] text-3xl">2.1 tb</span>
                                        <br />
                                        Dados monitorados
                                        <br />
                                        <img
                                            src="/assets/img/grafico-line.jpg"
                                            alt="Gráfico Line"
                                            className="py-5 w-full object-contain"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between py-3">
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <span className="text-[#744CD8] text-3xl">340</span>
                                        <br />
                                        Incidentes de vazamento por nível
                                        <br />
                                        <div className="flex gap-3 flex-wrap text-[10px] mt-4 text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#1DD69A] rounded-xs"></span>
                                                Baixo
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#6366F1] rounded-xs"></span>
                                                Médio
                                            </div>
                                        </div>
                                        <div className="flex gap-3 flex-wrap text-[10px] mt-2 text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#A855F7] rounded-xs"></span>
                                                Alto
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="w-3 h-3 bg-[#F914AD] rounded-xs"></span>
                                                Crítico
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col text-left text-gray-300 pl-4">
                                        <img
                                            src="/assets/img/donut-incidentes.jpg"
                                            alt="Gráfico Line"
                                            className="py-5 w-full object-contain px-3"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Overlay dinâmico no topo */}
                <div className="absolute top-0 left-0 w-full flex justify-center z-10 mt-40">
                    <div className="relative z-20 text-center max-w-xl bg-[#0f0b1c]/80 backdrop-blur-md rounded-2xl p-10 shadow-2xl border border-[#ffffff1a] animate-fadeIn">
                        <h2 className="text-white text-2xl font-semibold mb-4">
                            Agende uma sessão para conhecer o serviço “{serviceTitle}”
                        </h2>
                        <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                            Clique no botão abaixo e desbloqueie o serviço em seu tenant.
                        </p>

                        <div className="flex justify-center gap-4">
                            <Link
                                // to={buttonLink}
                                to={"#"}
                                className="bg-[#744CD8] hover:bg-[#8B5CF6] text-white px-6 py-2 rounded-lg text-sm font-medium transition-all"
                            >
                                Quero Agendar Agora
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Remove rolagem da página */}
            <style>{`
        html, body {
          overflow: hidden !important;
          height: 100vh;
        }
      `}</style>
        </LayoutModel>
    );
}