import { useState, useEffect } from "react";
import LayoutModel from "../componentes/LayoutModel";
import { LuBuilding2, LuMessageSquareText } from "react-icons/lu";
import { TbAntennaBars5 } from "react-icons/tb";
import { GoShieldCheck, GoDatabase } from "react-icons/go";

import { getAdminTenants } from "../services/multi-tenant/adminmultitenant.service";
import { getAdminSummary } from "../services/multi-tenant/summary.service";


import Slider from "../componentes/Swiper";

export default function MultiTenantManager() {

    const [tenantsSelecionados, setTenantsSelecionados] = useState<string[]>([]);

    const [dadosTenants, setDadosTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);


    const toggleTenant = (tenant: string) => {
        setTenantsSelecionados(prev =>
            prev.includes(tenant)
                ? prev.filter(t => t !== tenant)
                : [...prev, tenant]
        );
    };

    const tenantsFiltrados = dadosTenants.filter(t =>
        tenantsSelecionados.includes(t.nome)
    );

    useEffect(() => {
        async function carregarSummary() {
            try {
                setLoading(true);
    
                const summary = await getAdminSummary();
    
                const formatado = summary.map(t => ({
                    tenantId: t.tenantId,
                    nome: t.organizacao,
                    risco: t.risco,
                    incidentes_critico: t.incidentes_critico,
                    incidentes_alto: t.incidentes_alto,
                    ativos: t.ativos,
                    volume: t.volume_gb,
                    logs: "--"
                }));
    
                setDadosTenants(formatado);
    
            } catch (err) {
                console.error("Erro ao buscar summary:", err);
            } finally {
                setLoading(false);
            }
        }
    
        carregarSummary();
    }, []);

    return (
        <LayoutModel titulo="Gestão Multi-Tenant">
            <div className="space-y-6">

                {/* SECTION TENANTS */}
                <section
                    className="relative border border-[#2A1F40] rounded-2xl p-6 overflow-hidden min-w-0"
                    style={{
                        background:
                            "linear-gradient(82deg, rgba(22,17,37,1) 0%, rgba(34,14,84,1) 17%, rgba(39,6,117,1) 31%, rgba(48,8,140,1) 42%, rgba(39,13,103,1) 52%, rgba(22,17,37,1) 100%)"
                    }}
                >
                    <h3 className="text-white text-sm mb-6">
                        Selecione os Tenants para Visualizar
                    </h3>

                    {loading ? (
                        <div className="text-gray-400 text-sm py-6 text-center">
                            Carregando tenants...
                        </div>
                    ) : dadosTenants.length === 0 ? (
                        <div className="text-gray-500 text-sm py-6 text-center">
                            Nenhum tenant disponível.
                        </div>
                    ) : (
                        <Slider
                            slidesPerView={4.2}
                            spaceBetween={20}
                            breakpoints={{
                                0: { slidesPerView: 1.2 },
                                768: { slidesPerView: 2.2 },
                                1280: { slidesPerView: 4.2 }
                            }}
                        >
                            {dadosTenants.map((tenant) => (
                                <div
                                    key={tenant.tenantId ?? tenant.nome}
                                    onClick={() => toggleTenant(tenant.nome)}
                                    className={`relative cursor-pointer bg-[#0D081D] rounded-xl p-5 overflow-hidden transition-all border
                                        ${tenantsSelecionados.includes(tenant.nome)
                                            ? "border-purple-500 shadow-lg shadow-purple-500/20"
                                            : "border-[#2A1F40] hover:border-purple-400"
                                        }`}
                                >
                                    <div className="absolute inset-0 bg-purple-600/10 blur-2xl opacity-40" />

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#161125] border border-[#2A1F40] rounded-lg flex items-center justify-center text-purple-400">
                                                    {/* @ts-ignore */}
                                                    <LuBuilding2 className="text-[#744CD8] text-lg" />
                                                </div>
                                                <h4 className="text-white font-medium">
                                                    {tenant.nome}
                                                </h4>
                                            </div>

                                            <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all
                                                    ${tenantsSelecionados.includes(tenant.nome)
                                                        ? "bg-purple-600 text-white"
                                                        : "border border-[#3B2A70] text-transparent"
                                                    }`}
                                            >
                                                ✓
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <span className="px-3 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400">
                                                {Math.round(tenant.risco) ?? "--"}%
                                            </span>
                                        </div>

                                        <div className="mt-6 h-16 relative">
                                            <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Slider>
                    )}
                </section>


                {/* BOTÃO */}
                <div className="p-2 text-end">
                    <button className="bg-purple-600 hover:bg-purple-700 transition px-4 py-2 rounded-md text-xs text-white">
                        Customizar Métricas
                    </button>
                </div>

                {/* TABELA */}
                <div className="cards rounded-2xl overflow-hidden border border-[#1D1929]">

                    <div className="grid grid-cols-7 px-5 py-5 bg-[#0A0617] text-xs text-gray-300">

                        <div className="border-[#1D1929] border-r-2">
                            <div className="flex items-center justify-center gap-1">Tenant</div>
                        </div>
                        <div className="border-[#1D1929] border-r-2">
                            {/* @ts-ignore */}
                            <div className="flex items-center justify-center gap-1">Índice de Risco <TbAntennaBars5 className="text-[#744CD8] text-lg" /></div>
                        </div>
                        <div className="border-[#1D1929] border-r-2">
                            <div className="flex items-center justify-center gap-1">
                                Incidentes <span className="text-pink-500 badge-pink badge rounded-md py-0.5 px-2">Crítico</span>
                            </div>
                        </div>
                        <div className="border-[#1D1929] border-r-2">
                            <div className="flex items-center justify-center gap-1">
                                Incidentes <span className="text-[#A855F7] badge-high badge rounded-md py-0.5 px-3">Alto</span>
                            </div>
                        </div>
                        <div className="border-[#1D1929] border-r-2">
                            {/* @ts-ignore */}
                            <div className="flex items-center justify-center gap-1">Total de Ativos <GoShieldCheck className="text-[#744CD8] text-lg" /></div>
                        </div>
                        <div className="border-[#1D1929] border-r-2">
                            {/* @ts-ignore */}
                            <div className="flex items-center justify-center gap-1">Volume (GB) <GoDatabase className="text-[#744CD8] text-lg" /></div>
                        </div>
                        <div>
                            {/* @ts-ignore */}
                            <div className="flex items-center justify-center gap-1">Sem receber Logs (2h) <LuMessageSquareText className="text-[#744CD8] text-lg" /></div>
                        </div>

                    </div>

                    <div className="divide-y divide-[#ffffff12]">

                        {tenantsSelecionados.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                Nenhuma organização selecionada.
                            </div>
                        ) : (
                            tenantsFiltrados.map((tenant) => (
                                <div
                                    key={tenant.nome}
                                    className="grid grid-cols-7 px-5 py-4 items-center hover:bg-[#ffffff07] transition-colors"
                                >
                                    <div className="text-center text-sm text-white flex items-center justify-center gap-2">
                                        {/* @ts-ignore */}
                                        <LuBuilding2 className="text-[#744CD8] text-lg" /> {tenant.nome}
                                    </div>

                                    <div className="text-center text-white text-[15px]">
                                        {Math.round(tenant.risco)}%
                                    </div>

                                    <div className="text-center text-white text-[15px]">
                                        {tenant.incidentes_critico}
                                    </div>

                                    <div className="text-center text-white text-[15px]">
                                        {tenant.incidentes_alto}
                                    </div>

                                    <div className="text-center text-white text-[15px]">
                                        {tenant.ativos}
                                    </div>

                                    <div className="text-center text-white text-[15px]">
                                        {tenant.volume} GB
                                    </div>

                                    <div className="text-center text-white text-[15px]">
                                        {tenant.logs}
                                    </div>
                                </div>
                            ))
                        )}

                    </div>
                </div>
            </div>
        </LayoutModel>
    );
}
