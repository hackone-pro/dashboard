import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CiWarning, CiSettings, CiMap, CiHome } from "react-icons/ci";
import { PiSkullThin } from "react-icons/pi";
import { HiOutlineBars3 } from "react-icons/hi2";
import { VscSearchFuzzy, VscFileSymlinkDirectory } from "react-icons/vsc";
import { TbChartInfographic } from "react-icons/tb";

import clsx from 'clsx';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);
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
                    className="w-full relative group"
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
                    <button
                        onClick={() => isOpen && setIsCatalogOpen(!isCatalogOpen)}
                        className={clsx(
                            "flex items-center gap-3 w-full transition-all duration-300 rounded-lg px-2 py-2",
                            isOpen ? "justify-start pl-1" : "justify-center",
                            isCatalogOpen
                                ? "bg-[#4B06DD]/20 text-purple-300"
                                : "hover:text-purple-400"
                        )}
                    >
                        {/* @ts-ignore */}
                        <TbChartInfographic className="text-[18px]" />
                        {isOpen && (
                            <div className="flex justify-between items-center w-full pr-2">
                                <span>NG SOC</span>
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
                            </div>
                        )}
                    </button>

                    {/* SUBITENS — NORMAL (quando expandido) */}
                    <div
                        className={clsx(
                            "overflow-hidden transition-all duration-500 ease-in-out",
                            isOpen && isCatalogOpen ? "max-h-80 opacity-100 mt-2" : "max-h-0 opacity-0"
                        )}
                    >
                        <ul className=" pr-2 space-y-1 text-sm text-gray-300">
                            {[
                                // @ts-ignore
                                { to: "/risk-level", icon: <CiWarning className="text-[16px]" />, label: "Risk Level" },
                                // @ts-ignore
                                { to: "/incidentes", icon: <PiSkullThin className="text-[16px]" />, label: "Incidentes" },
                                // @ts-ignore
                                { to: "/threat-map", icon: <CiMap className="text-[16px]" />, label: "Threat Map" },
                                // @ts-ignore
                                { to: "/vulnerabilities-detections", icon: <VscSearchFuzzy className="text-[16px]" />, label: "Detecção de Vulnerabilidades" },
                                // @ts-ignore
                                { to: "/archives-integrity", icon: <VscFileSymlinkDirectory className="text-[16px]" />, label: "Integridade de Arquivos" },
                            ].map((item, idx) => (
                                <li key={idx}>
                                    <Link
                                        to={item.to}
                                        className={clsx(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300",
                                            "hover:bg-[#4B06DD]/20 hover:text-purple-300"
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
                                <li>
                                    <Link
                                        to="/risk-level"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <CiWarning className="text-[16px]" /> Risk Level
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        to="/incidentes"
                                        className="flex items-center gap-3 px-2 py-1 rounded-md hover:bg-[#4B06DD]/20 hover:text-purple-300 transition-all duration-300"
                                    >
                                        {/* @ts-ignore */}
                                        <PiSkullThin className="text-[16px]" /> Incidentes
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