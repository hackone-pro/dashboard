//MODELO DE PÁGINA
import LayoutModel from '../componentes/LayoutModel';

export default function ArchivesIntegrity() {

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
                            className="flex items-center gap-2 text-md border border-[#1D1929] bg-[#0A0617] hover:bg-gray-700 text-gray-400 px-3 py-1 rounded-md transition"
                        >
                            {/* @ts-ignore */}
                            {/* <FaSyncAlt className="w-4 h-4" /> */}
                            Atualizar
                        </button>
                    </div>
                </div>

                {/* Gráfico superior */}
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4 items-stretch">
                    <div className="rounded-xl p-4 h-64 border border-white/5 flex items-center justify-center">
                        <span className="text-gray-400">[Gráfico de Linhas]</span>
                    </div>
                </div>
            </section>

            {/* Segunda section - Top Agentes + Resumo */}
            <section className="rounded-2xl shadow-lg my-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                    {/* Coluna 1 - Top 5 agentes */}
                    <div className="cards rounded-xl p-6">
                        <h4 className="text-white text-sm font-semibold mb-4">Top 5 Agentes</h4>
                        <div className="h-64 border border-white/5 flex items-center justify-center rounded-xl">
                            <span className="text-gray-400">[Gráfico de Donut]</span>
                        </div>
                    </div>

                    {/* Coluna 2 e 3 - Resumo de eventos */}
                    <div className="cards rounded-xl p-6 md:col-span-2">
                        <h4 className="text-white text-sm font-semibold mb-4">Resumo de eventos</h4>
                        <div className="h-64 border border-white/5 flex items-center justify-center rounded-xl">
                            <span className="text-gray-400">[Gráfico de Linha]</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Terceira section - Distribuições + Top Usuários */}
            <section className="rounded-2xl shadow-lg my-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                    {/* Coluna 1 - Distribuição de regras */}
                    <div className="cards rounded-xl p-6">
                        <h4 className="text-white text-sm font-semibold mb-4">Distribuição de regras</h4>
                        
                    </div>

                    {/* Coluna 2 - Distribuição de ações */}
                    <div className="cards rounded-xl p-6">
                        <h4 className="text-white text-sm font-semibold mb-4">Distribuição de ações</h4>
                        
                    </div>

                    {/* Coluna 3 - Top usuários */}
                    <div className="cards rounded-xl p-6">
                        <h4 className="text-white text-sm font-semibold mb-4">Top 5 Usuários</h4>
                        
                    </div>
                </div>
            </section>
        </LayoutModel>
    );
}