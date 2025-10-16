import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CiWarning, CiSettings, CiMap, CiHome } from "react-icons/ci";
import { PiSkullThin } from "react-icons/pi";
import { HiOutlineBars3 } from "react-icons/hi2";


import { VscSearchFuzzy, VscFileSymlinkDirectory } from "react-icons/vsc";



import clsx from 'clsx';

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false);

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

                <li>
                    <Link to="/risk-level" className={clsx(
                        "flex items-center gap-3 hover:text-purple-400 cursor-pointer transition-all duration-300",
                        isOpen ? "justify-start" : "justify-center"
                    )}>
                        {/* @ts-ignore */}
                        <CiWarning />
                        {isOpen && <span>Risk Level</span>}
                    </Link>
                </li>

                <li className={clsx(
                    "flex items-center gap-3 hover:text-purple-400 cursor-pointer transition-all duration-300",
                    isOpen ? "justify-start" : "justify-center"
                )}>
                    <Link to="/incidentes" className={clsx(
                        "flex items-center gap-3 hover:text-purple-400 cursor-pointer transition-all duration-300",
                        isOpen ? "justify-start" : "justify-center"
                    )}>
                        {/* @ts-ignore */}
                        <PiSkullThin />
                        {isOpen && <span>Incidentes</span>}
                    </Link>
                </li>

                <li className={clsx(
                    "flex items-center gap-3 hover:text-purple-400 cursor-pointer transition-all duration-300",
                    isOpen ? "justify-start" : "justify-center"
                )}>
                    <Link to="/threat-map" className={clsx(
                        "flex items-center gap-3 hover:text-purple-400 cursor-pointer transition-all duration-300",
                        isOpen ? "justify-start" : "justify-center"
                    )}>
                        {/* @ts-ignore */}
                        <CiMap />
                        {isOpen && <span>Threat Map</span>}
                    </Link>
                </li>

                {/* <li className={clsx(
                    "flex items-center gap-3 hover:text-purple-400 cursor-pointer transition-all duration-300",
                    isOpen ? "justify-start" : "justify-center"
                )}>
                    <Link to="/vulnerabilities-detections" className={clsx(
                        "flex items-center gap-3 hover:text-purple-400 cursor-pointer transition-all duration-300",
                        isOpen ? "justify-start" : "justify-center"
                    )}>
                        
                        <VscSearchFuzzy />
                        {isOpen && <span>Detecção de Vulnerabilidades</span>}
                    </Link>
                </li> */}

                <li className={clsx(
                    "flex items-center gap-3 hover:text-purple-400 cursor-pointer transition-all duration-300",
                    isOpen ? "justify-start" : "justify-center"
                )}>
                    <Link to="/archives-integrity" className={clsx(
                        "flex items-center gap-3 hover:text-purple-400 cursor-pointer transition-all duration-300",
                        isOpen ? "justify-start" : "justify-center"
                    )}>
                        {/* @ts-ignore */}
                        <VscFileSymlinkDirectory />
                        {isOpen && <span>Integridade de Arquivos</span>}
                    </Link>
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