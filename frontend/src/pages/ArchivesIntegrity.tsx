// src/pages/ArchivesIntegrity.tsx

import { useRef } from "react";
import LayoutModel from '../componentes/LayoutModel';

// importa cada card + o tipo de referência
import OvertimeCard, { OvertimeCardRef } from "../componentes/wazuh/OvertimeCard"; 
import TopAgentsDonutCard, { TopAgentsDonutCardRef } from '../componentes/wazuh/TopAgentsDonutCard'; 
import EventosSummaryCard, { EventosSummaryCardRef } from '../componentes/wazuh/EventosSummaryCard'; 
import RuleDistributionCard, { RuleDistributionCardRef } from '../componentes/wazuh/RuleDistributionCard'; 
import DistribuicaoAcoesCard, { DistribuicaoAcoesCardRef } from '../componentes/wazuh/DistribuicoesAcoesCard'; 
import TopUsersCard, { TopUsersCardRef } from '../componentes/wazuh/TopUsersCard';

import { FaSyncAlt } from "react-icons/fa";

export default function ArchivesIntegrity() {
    // refs para cada card
    const overtimeRef = useRef<OvertimeCardRef>(null);
    const topusersRef = useRef<TopUsersCardRef>(null);
    const topAgentsRef = useRef<TopAgentsDonutCardRef>(null);
    const eventosSummaryRef = useRef<EventosSummaryCardRef>(null);
    const ruleDistributionRef = useRef<RuleDistributionCardRef>(null);
    const distribuicoesAcoesRef = useRef<DistribuicaoAcoesCardRef>(null);

    // função única para recarregar todos
    const atualizarTudo = () => {
        overtimeRef.current?.carregar();
        topAgentsRef.current?.carregar();
        topusersRef.current?.carregar();
        eventosSummaryRef.current?.carregar();
        ruleDistributionRef.current?.carregar();
        distribuicoesAcoesRef.current?.carregar();
    };

    return (
        <LayoutModel titulo="Integridade dos arquivos">
            {/* Primeira section - gráfico principal */}
            <section className="cards p-6 rounded-2xl shadow-lg">
                <div className="flex flex-wrap justify-between items-start mb-6">
                    <div className="flex flex-col">
                        <h3 className="text-white text-base font-semibold">
                            Alertas por tipo de ação ao longo do tempo
                        </h3>
                    </div>

                    <div className="flex items-end gap-3 flex-wrap">
                        <button
                            onClick={atualizarTudo}
                            className="flex items-center gap-2 text-md border border-[#1D1929] bg-[#0A0617] hover:bg-gray-700 text-gray-400 px-3 py-1 rounded-md transition"
                        >
                            {/* @ts-ignore */}
                            <FaSyncAlt className="w-4 h-4" />
                            Atualizar
                        </button>
                    </div>
                </div>

                {/* Gráfico superior */}
                <OvertimeCard ref={overtimeRef} />
            </section>

            {/* Segunda section - Top Agentes + Resumo */}
            <section className="rounded-2xl shadow-lg my-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                    {/* Coluna 1 - Top 5 agentes */}
                    <div className="cards rounded-xl p-6">
                        <h4 className="text-white text-sm font-semibold mb-4">Top 5 Hosts</h4>
                        <div className="h-64 flex items-center justify-center rounded-xl">
                            <TopAgentsDonutCard ref={topAgentsRef} />
                        </div>
                    </div>

                    {/* Coluna 2 e 3 - Resumo de eventos */}
                    <div className="cards rounded-xl p-6 md:col-span-2">
                        <h4 className="text-white text-sm font-semibold mb-4">Resumo de Eventos</h4>
                        <EventosSummaryCard ref={eventosSummaryRef} />
                    </div>
                </div>
            </section>

            {/* Terceira section - Distribuições + Top Usuários */}
            <section className="rounded-2xl shadow-lg my-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                    {/* Coluna 1 - Distribuição de regras */}
                    <div className="cards rounded-xl p-6">
                        <h4 className="text-white text-sm font-semibold mb-4">Distribuição de Regras</h4>
                        <RuleDistributionCard ref={ruleDistributionRef} />
                    </div>

                    {/* Coluna 2 - Distribuição de ações */}
                    <div className="cards rounded-xl p-6">
                        <h4 className="text-white text-sm font-semibold mb-4">Distribuição de Ações</h4>
                        <DistribuicaoAcoesCard ref={distribuicoesAcoesRef} />
                    </div>

                    {/* Coluna 3 - Top usuários */}
                    <div className="cards rounded-xl p-6">
                        <h4 className="text-white text-sm font-semibold mb-4">Top 5 Usuários</h4>
                        <TopUsersCard ref={topusersRef} />
                    </div>
                </div>
            </section>
        </LayoutModel>
    );
}
