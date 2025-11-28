import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CiSettings, CiMap, CiHome, CiGlobe } from "react-icons/ci";
import { PiNotebook, PiWarningLight, PiSkullLight, PiShareNetworkDuotone, PiLockKeyLight } from "react-icons/pi";
import { HiOutlineBars3, HiOutlineIdentification } from "react-icons/hi2";
import { VscSearchFuzzy, VscFileSymlinkDirectory } from "react-icons/vsc";
import { TbChartInfographic, TbHeartRateMonitor, TbCloudLock } from "react-icons/tb";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { GoShieldLock } from "react-icons/go";
import { AiOutlineAim } from "react-icons/ai";
import { BsDatabaseLock } from "react-icons/bs";

import clsx from 'clsx';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [isNgsocOpen, setIsNgsocOpen] = useState(false);
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);

    return (
        <div className={clsx(
            "bg-[#161125] text-white min-h-screen p-3 transition-all duration-300 flex flex-col",
            isOpen ? "w-64" : "w-16"
        )}>

            {/* LOGO */}
            <div className="mb-8 transition-all duration-300">
                <a
                    href="https://securityone.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {isOpen ? (
                        <img
                            src="/assets/img/Logo-Security-One-Positivo.png"
                            alt="Logo Completa"
                            className="h-10"
                        />
                    ) : (
                        <img
                            src="/assets/img/icone-logo.png"
                            alt="Logo Ícone"
                        />
                    )}
                </a>
            </div>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "text-xl mb-8 transition-all duration-300",
                    isOpen ? "ml-2" : "mx-auto"
                )}
            >
                {/* @ts-ignore */}
                <HiOutlineBars3 className='bars bg-[#4B06DD] rounded-sm p-1' />
            </button>
            <ul
                className={clsx(
                    "space-y-6 w-full transition-all duration-300",
                    isOpen ? "items-start pl-2" : "items-center"
                )}
                style={{ display: "flex", flexDirection: "column" }}
            >
                <li>
                    <Link to="/dashboard" className={clsx(
                        "flex items-center gap-3 hover:text-purple-400 cursor-pointer transition-all duration-300",
                        isOpen ? "justify-start" : "justify-center"
                    )}>
                        {/* @ts-ignore */}
                        <CiHome />
                        {isOpen && <span>Home</span>}
                    </Link>
                </li>

                <li
                    className="w-full relative group ngsoc-item"
                    onMouseEnter={() => {
                        if (!isOpen) {
                            clearTimeout((window as any).ngsocTimer);
                            setIsNgsocOpen(true);
                        }
                    }}
                    onMouseLeave={() => {
                        if (!isOpen) {
                            (window as any).ngsocTimer = setTimeout(() => setIsNgsocOpen(false), 250);
                        }
                    }}
                >
                    {/* BOTÃO PRINCIPAL */}
                    <button
                        onClick={() => isOpen && setIsNgsocOpen(!isNgsocOpen)}
                        className={clsx(
                            "flex items-center gap-3 w-full transition-all duration-300 rounded-lg",
                            isOpen ? "justify-start" : "justify-center",
                            isNgsocOpen
                                ? "bg-[#4B06DD]/20 text-purple-300 py-2 pl-1"
                                : "hover:text-purple-400"
                        )}
                    >
                        {/* @ts-ignore */}
                        <TbChartInfographic className="text-[18px]" />
                        {isOpen && (
                            <div className="flex justify-between items-center w-full pr-2">
                                <span>Next Generation SOC</span>
                                <svg
                                    className={clsx(
                                        "w-3 h-3 transform transition-transform duration-300",
                                        isNgsocOpen ? "rotate-90 text-purple-400" : "text-gray-400"
                                    )}
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        )}
                    </button>

                    {/* SUBITENS — NORMAL (quando expandido) */}
                    <div
                        className={clsx(
                            "overflow-hidden transition-all duration-500 ease-in-out",
                            isOpen && isNgsocOpen ? "opacity-100 mt-2" : "max-h-0 opacity-0"
                        )}
                    >
                        <ul className=" pr-2 space-y-1 text-sm text-gray-300">
                            {[
                                // @ts-ignore
                                { to: "/risk-level", icon: <PiWarningLight className="text-[16px]" />, label: "Risk Level" },
                                // @ts-ignore
                                { to: "/incidentes", icon: <PiSkullLight className="text-[16px]" />, label: "Incidentes" },
                                // @ts-ignore
                                { to: "/threat-map", icon: <CiMap className="text-[16px]" />, label: "Threat Map" },
                                // @ts-ignore
                                { to: "/vulnerabilities-detections", icon: <VscSearchFuzzy className="text-[16px]" />, label: "Detecção de Vulnerabilidades" },
                                // @ts-ignore
                                { to: "/archives-integrity", icon: <VscFileSymlinkDirectory className="text-[16px]" />, label: "Integridade de Arquivos" },
                                // @ts-ignore
                                { to: "/monitoria-ngsoc", icon: <TbHeartRateMonitor className="text-[16px]" />, label: "Monitoria NG-SOC" },
                            ].map((item, idx) => (
                                <li key={idx} className="py-1">
                                    <Link
                                        to={item.to}
                                        className={clsx(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300",
                                            "hover:bg-[#4B06DD]/20 hover:text-purple-300 border-1 border-[#282335]"
                                        )}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* SUBITENS — HOVER (quando recolhida) */}
                    {!isOpen && (
                        <div
                            onMouseEnter={() => {
                                clearTimeout((window as any).ngsocTimer);
                                setIsNgsocOpen(true);
                            }}
                            onMouseLeave={() => {
                                (window as any).ngsocTimer = setTimeout(() => setIsNgsocOpen(false), 250);
                            }}
                            className={clsx(
                                "absolute left-full top-0 ml-3 py-3 px-3 bg-[#1e1735]/95 backdrop-blur-sm shadow-lg border border-[#4B06DD]/30 text-sm text-gray-200 transition-all duration-300 z-50 w-56",
                                isNgsocOpen
                                    ? "opacity-100 translate-x-0 pointer-events-auto"
                                    : "opacity-0 pointer-events-none -translate-x-2"
                            )}
                        >
                            <ul className="space-y-2">
                                <li>
                                    <div style={{ color: "#fff" }} className='text-white border-b-2 border-[#282335] pb-2'>
                                        <Link to="/risk-level">
                                            Next Generation SOC
                                        </Link>
                                    </div>
                                    <Link
                                        to="/risk-level"
                                        className="flex items-center gap-3 px-2 py-1 pt-2 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <PiWarningLight className="text-[16px]" /> Risk Level
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/incidentes"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <PiSkullLight className="text-[16px]" /> Incidentes
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/threat-map"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <CiMap className="text-[16px]" /> Threat Map
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/vulnerabilities-detections"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <VscSearchFuzzy className="text-[16px]" /> Detecção de Vulnerabilidades
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/archives-integrity"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <VscFileSymlinkDirectory className="text-[16px]" /> Integridade de Arquivos
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/monitoria-ngsoc"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <TbHeartRateMonitor className="text-[16px]" /> Monitoria NG-SOC
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    )}
                </li>

                <li
                    className="w-full relative group catalog-item"
                    onMouseEnter={() => {
                        if (!isOpen) {
                            clearTimeout((window as any).catalogTimer);
                            setIsCatalogOpen(true);
                        }
                    }}
                    onMouseLeave={() => {
                        if (!isOpen) {
                            (window as any).catalogTimer = setTimeout(() => setIsCatalogOpen(false), 250);
                        }
                    }}
                >
                    {/* BOTÃO PRINCIPAL */}
                    <div
                        className={clsx(
                            "flex items-center gap-3 w-full transition-all duration-300 rounded-lg",
                            isOpen ? "justify-start" : "justify-center",
                            isCatalogOpen
                                ? "bg-[#4B06DD]/20 text-purple-300 py-2 pl-1"
                                : "hover:text-purple-400"
                        )}
                    >
                        {/* ÍCONE PRINCIPAL */}
                        {!isOpen ? (
                            // 🔹 Quando menu está recolhido → ícone é link para /services-catalog
                            <Link to="/services-catalog" className="flex items-center justify-center">
                                {/* @ts-ignore */}
                                <PiNotebook className="text-[18px]" />
                            </Link>
                        ) : (
                            // 🔹 Quando menu está expandido → ícone normal (sem link)
                            // @ts-ignore
                            <PiNotebook className="text-[18px]" />
                        )}

                        {/* CONTEÚDO (aparece só quando expandido) */}
                        {isOpen && (
                            <div className="flex justify-between items-center w-full pr-2">
                                {/* TEXTO CLICÁVEL */}
                                <Link
                                    to="/services-catalog"
                                    className="flex-1 text-[15px] hover:text-purple-400 transition-colors"
                                >
                                    Catálogo de Serviços de Cibersegurança
                                </Link>

                                {/* BOTÃO DA SETA */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // evita acionar o link
                                        setIsCatalogOpen(!isCatalogOpen);
                                    }}
                                    className="ml-2 flex items-center justify-center w-5 h-5 rounded-md hover:bg-[#4B06DD]/30 transition-all duration-300"
                                >
                                    <svg
                                        className={clsx(
                                            "w-3 h-3 transform transition-transform duration-300",
                                            isCatalogOpen ? "rotate-90 text-purple-400" : "text-gray-400"
                                        )}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>


                    {/* SUBITENS — NORMAL (quando expandido) */}
                    <div
                        className={clsx(
                            "overflow-hidden transition-all duration-500 ease-in-out",
                            isOpen && isCatalogOpen ? "max-h-150 opacity-100 mt-2" : "max-h-0 opacity-0"
                        )}
                    >
                        <ul className=" pr-2 space-y-1 text-sm text-gray-300">
                            {[
                                // @ts-ignore
                                { to: "/service/trafego-seguro", icon: <GoShieldLock className="text-[16px]" />, label: "Tráfego Seguro" },
                                // @ts-ignore
                                { to: "/service/defesa-endpoints", icon: <PiShareNetworkDuotone className="text-[16px]" />, label: "Defesa de Endpoints" },
                                // @ts-ignore
                                { to: "/service/identidade-e-acesso", icon: <HiOutlineIdentification className="text-[16px]" />, label: "Identidade e Acesso" },
                                // @ts-ignore
                                { to: "/service/vulnerabilidades", icon: <AiOutlineAim className="text-[16px]" />, label: "Vulnerabilidades" },
                                // @ts-ignore
                                { to: "/service/protecao-de-aplicacoes", icon: <CiGlobe className="text-[16px]" />, label: "Proteção de Aplicações" },
                                // @ts-ignore
                                { to: "/service/protecao-de-dados", icon: <BsDatabaseLock className="text-[16px]" />, label: "Proteção de Dados" },
                                // @ts-ignore
                                { to: "/service/teste-de-intrusao", icon: <PiLockKeyLight className="text-[16px]" />, label: "Teste de Intrusão" },
                                // @ts-ignore
                                { to: "/service/monitoria", icon: <TbHeartRateMonitor className="text-[16px]" />, label: "Monitoria" },
                                // @ts-ignore
                                { to: "/service/cloud-security", icon: <TbCloudLock className="text-[16px]" />, label: "Cloud Security" },
                            ].map((item, idx) => (
                                <li key={idx} className="py-1">
                                    <Link
                                        to={item.to}
                                        className={clsx(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300",
                                            "hover:bg-[#4B06DD]/20 hover:text-purple-300 border-1 border-[#282335]"
                                        )}
                                    >
                                        {item.icon}
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* SUBITENS — HOVER (quando recolhida) */}
                    {!isOpen && (
                        <div
                            onMouseEnter={() => {
                                clearTimeout((window as any).catalogTimer);
                                setIsCatalogOpen(true);
                            }}
                            onMouseLeave={() => {
                                (window as any).catalogTimer = setTimeout(() => setIsCatalogOpen(false), 250);
                            }}
                            className={clsx(
                                "absolute left-full top-0 ml-3 py-3 px-3 bg-[#1e1735]/95 backdrop-blur-sm shadow-lg border border-[#4B06DD]/30 text-sm text-gray-200 transition-all duration-300 z-50 w-56",
                                isCatalogOpen
                                    ? "opacity-100 translate-x-0 pointer-events-auto"
                                    : "opacity-0 pointer-events-none -translate-x-2"
                            )}
                        >
                            <ul className="space-y-2">
                                <li style={{ color: "#fff" }} className='text-white border-b-2 border-[#282335] pb-2'>
                                    <Link to="/services-catalog">
                                        Catálogo de Serviços de Cibersegurança
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/service/trafego-seguro"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <GoShieldLock className="text-[16px]" /> Tráfego Seguro
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/service/defesa-endpoints"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <PiShareNetworkDuotone className="text-[16px]" /> Defesa de Endpoints
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/service/identidade-e-acesso"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <HiOutlineIdentification className="text-[16px]" /> Identidade e Acesso
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/service/vulnerabilidades"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <AiOutlineAim className="text-[16px]" /> Vulnerabilidades
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/service/protecao-de-aplicacoes"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <CiGlobe className="text-[16px]" /> Proteção de Aplicações Web
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/service/protecao-de-dados"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <BsDatabaseLock className="text-[16px]" /> Proteção de Dados
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/service/teste-de-intrusao"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <PiLockKeyLight className="text-[16px]" /> Teste de Intrusão
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/service/monitoria"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <TbHeartRateMonitor className="text-[16px]" /> Monitoria
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/service/cloud-security"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <TbCloudLock className="text-[16px]" /> Cloud Security
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    )}
                </li>

                <li className={clsx(
                    "flex items-center gap-3 hover:text-purple-400 cursor-pointer transition-all duration-300",
                    isOpen ? "justify-start" : "justify-center"
                )}>
                    <Link to="/config" className={clsx(
                        "flex items-center gap-3 hover:text-purple-400 cursor-pointer transition-all duration-300",
                        isOpen ? "justify-start" : "justify-center"
                    )}>
                        {/* @ts-ignore */}
                        <CiSettings />
                        {isOpen && <span>Configurações</span>}
                    </Link>
                </li>

            </ul>
        </div>
    );
}