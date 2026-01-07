// src/pages/ArchivesIntegrity.tsx

import { useRef, useState } from "react";
import LayoutModel from "../componentes/LayoutModel";
import DateRangePicker from "../componentes/DataRangePicker";

// importa cada card + o tipo de referência
import OvertimeCard, { OvertimeCardRef } from "../componentes/wazuh/OvertimeCard";
import TopAgentsDonutCard, { TopAgentsDonutCardRef } from "../componentes/wazuh/TopAgentsDonutCard";
import EventosSummaryCard, { EventosSummaryCardRef } from "../componentes/wazuh/EventosSummaryCard";
import RuleDistributionCard, { RuleDistributionCardRef } from "../componentes/wazuh/RuleDistributionCard";
import DistribuicaoAcoesCard, { DistribuicaoAcoesCardRef } from "../componentes/wazuh/DistribuicoesAcoesCard";
import TopUsersCard, { TopUsersCardRef } from "../componentes/wazuh/TopUsersCard";

import { FiRotateCcw } from "react-icons/fi";

export default function ArchivesIntegrity() {
    // refs para cada card
    const overtimeRef = useRef<OvertimeCardRef>(null);
    const topusersRef = useRef<TopUsersCardRef>(null);
    const topAgentsRef = useRef<TopAgentsDonutCardRef>(null);
    const eventosSummaryRef = useRef<EventosSummaryCardRef>(null);
    const ruleDistributionRef = useRef<RuleDistributionCardRef>(null);
    const distribuicoesAcoesRef = useRef<DistribuicaoAcoesCardRef>(null);

    // estado do período
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    type PeriodoRapido = "24h" | "48h" | "7d" | "15d" | "30d" | null;

    const [periodoRapido, setPeriodoRapido] = useState<PeriodoRapido>("24h");

    // aplicar período SOMENTE no OvertimeCard
    const aplicarPeriodo = () => {
        let from: Date;
        let to: Date;

        if (periodoRapido) {
            ({ from, to } = calcularPeriodo(periodoRapido));
        }
        else if (startDate && endDate) {
            from = new Date(startDate);
            from.setHours(0, 0, 0, 0);

            to = new Date(endDate);
            to.setHours(23, 59, 59, 999);
        }
        else {
            ({ from, to } = calcularPeriodo("24h"));
        }

        const payload = {
            from: from.toISOString(),
            to: to.toISOString(),
        };

        overtimeRef.current?.carregar(payload);
        topAgentsRef.current?.carregar(payload);
        eventosSummaryRef.current?.carregar(payload);
        ruleDistributionRef.current?.carregar(payload);
        distribuicoesAcoesRef.current?.carregar(payload);
        topusersRef.current?.carregar(payload);
    };

    const limparFiltros = () => {
        const { from, to } = calcularPeriodo("24h");

        setPeriodoRapido("24h");
        setStartDate(null);
        setEndDate(null);

        const payload = {
            from: from.toISOString(),
            to: to.toISOString(),
        };

        overtimeRef.current?.carregar(payload);
        topAgentsRef.current?.carregar(payload);
        eventosSummaryRef.current?.carregar(payload);
        ruleDistributionRef.current?.carregar(payload);
        distribuicoesAcoesRef.current?.carregar(payload);
        topusersRef.current?.carregar(payload);
    };

    function calcularPeriodo(periodo: Exclude<PeriodoRapido, null>) {
        const agora = new Date();

        const mapa: Record<string, number> = {
            "24h": 1,
            "48h": 2,
            "7d": 7,
            "15d": 15,
            "30d": 30,
        };

        const dias = mapa[periodo];
        const from = new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000);

        return { from, to: agora };
    }

    return (
        <LayoutModel titulo="Integridade dos arquivos">
            {/* Primeira section - gráfico principal */}
            <div className="flex justify-end mt-5 mb-3 px-6">
                
                <DateRangePicker
                    onApply={(payload) => {
                        overtimeRef.current?.carregar(payload);
                        topAgentsRef.current?.carregar(payload);
                        eventosSummaryRef.current?.carregar(payload);
                        ruleDistributionRef.current?.carregar(payload);
                        distribuicoesAcoesRef.current?.carregar(payload);
                        topusersRef.current?.carregar(payload);
                    }}
                />
                <button
                    onClick={limparFiltros}
                    className="flex items-center gap-1 text-[14px] text-purple-400 hover:text-purple-200 transition-colors ml-3"
                >
                    {/* @ts-ignore */}
                    <FiRotateCcw className="w-4 h-4" />
                    Limpar filtros
                </button>
            </div>

            <section className="cards p-6 rounded-2xl shadow-lg">
                <div className="flex flex-wrap justify-between items-start mb-6">
                    <div className="flex flex-col">
                        <h3 className="text-white text-base font-semibold">
                            Alertas por tipo de ação ao longo do tempo
                        </h3>
                    </div>
                </div>

                {/* Gráfico superior */}
                <OvertimeCard ref={overtimeRef} />
            </section>

            {/* Segunda section - Top Agentes + Resumo */}
            <section className="rounded-2xl shadow-lg my-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                    <div className="cards rounded-xl p-6">
                        <h4 className="text-white text-sm font-semibold mb-4">
                            Top 5 Hosts
                        </h4>
                        <div className="h-64 flex items-center justify-center rounded-xl">
                            <TopAgentsDonutCard ref={topAgentsRef} />
                        </div>
                    </div>

                    <div className="cards rounded-xl p-6 md:col-span-2">
                        <h4 className="text-white text-sm font-semibold mb-4">
                            Resumo de Eventos
                        </h4>
                        <EventosSummaryCard ref={eventosSummaryRef} />
                    </div>
                </div>
            </section>

            {/* Terceira section - Distribuições + Top Usuários */}
            <section className="rounded-2xl shadow-lg my-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                    <div className="cards rounded-xl p-6">
                        <h4 className="text-white text-sm font-semibold mb-4">
                            Distribuição de Regras
                        </h4>
                        <RuleDistributionCard ref={ruleDistributionRef} />
                    </div>

                    <div className="cards rounded-xl p-6">
                        <h4 className="text-white text-sm font-semibold mb-4">
                            Distribuição de Ações
                        </h4>
                        <DistribuicaoAcoesCard ref={distribuicoesAcoesRef} />
                    </div>

                    <div className="cards rounded-xl p-6">
                        <h4 className="text-white text-sm font-semibold mb-4">
                            Top 5 Usuários
                        </h4>
                        <TopUsersCard ref={topusersRef} />
                    </div>
                </div>
            </section>
        </LayoutModel>
    );
}
