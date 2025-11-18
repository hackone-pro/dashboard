// src/pages/MonitoriaSOC.tsx

import { Link } from "react-router-dom";
import LayoutModel from '../componentes/LayoutModel';

export default function MonitoriaSOC() {

    return (
        <LayoutModel titulo="Monitoria NGSOC">
            
            {/* Cards principais */}
            <section className="grid grid-cols-1 gap-6">
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
                            <Link
                                to="/service/trafego-seguro"
                                className="px-3 py-2 btn card text-[11px] text-white rounded-md transition-all duration-300 hover:text-purple-300"
                            >
                                Acessar Serviço →
                            </Link>
                        </div>
                        <div className="mt-3">
                            <p className="text-lg text-white font-normal">Tráfego Seguro e Controle de Acesso</p>
                            <p className="text-sm text-gray-400 font-thin">Tráfego seguro e visibilidade de aplicações.</p>
                        </div>

                    </header>
                </div>
            </section>
        </LayoutModel>
    );
}
