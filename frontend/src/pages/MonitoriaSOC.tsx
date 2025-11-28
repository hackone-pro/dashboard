// src/pages/MonitoriaSOC.tsx

import { useRef, useEffect, useState } from "react";
import { useTenant } from "../context/TenantContext";
import LayoutModel from "../componentes/LayoutModel";
import GraficoVolume from "../componentes/graficos/GraficoVolume";

// Cards
import FirewallCard, { FirewallCardRef } from "../componentes/wazuh/Monitoria/FirewallCard";
import ServidoresCard, { ServidoresCardRef } from "../componentes/wazuh/Monitoria/ServidoresCard";
import EdrCard, { EdrCardRef } from "../componentes/wazuh/Monitoria/EdrCard";

import { getStorageState, getStorageInternal } from "../services/storage/storage.service";
import { getToken } from "../utils/auth";

export default function MonitoriaSOC() {

    const { tenantAtivo } = useTenant();

    const firewallRef = useRef<FirewallCardRef>(null);
    const servidoresRef = useRef<ServidoresCardRef>(null);
    const edrRef = useRef<EdrCardRef>(null);

    // STORAGE PRINCIPAL
    const [storage, setStorage] = useState<any>(null);
    const [loadingStorage, setLoadingStorage] = useState(true);

    // STORAGE INTERNAL (DESCARTES)
    const [internal, setInternal] = useState<any>(null);
    const [loadingInternal, setLoadingInternal] = useState(true);


    // ============================
    // 🔵 CARREGA STORAGE PRINCIPAL
    // ============================
    const carregarStorage = async () => {
        try {
            setLoadingStorage(true);
            const token = getToken() ?? undefined;
            const dados = await getStorageState(token);
            setStorage(dados);
        } catch (err) {
            console.error("Erro ao carregar storage:", err);
        } finally {
            setLoadingStorage(false);
        }
    };


    // ============================
    // 🔵 CARREGA INTERNAL (DESCARTES)
    // ============================
    const carregarInternal = async () => {
        try {
            setLoadingInternal(true);
            const token = getToken() ?? undefined;
            const dados = await getStorageInternal(token);
            setInternal(dados);
        } catch (err) {
            console.error("Erro ao carregar storage/internal:", err);
        } finally {
            setLoadingInternal(false);
        }
    };


    // ============================
    // 🔵 Quando muda o tenant
    // ============================
    useEffect(() => {
        carregarStorage();
        carregarInternal();
        firewallRef.current?.carregar();
        servidoresRef.current?.carregar();
    }, [tenantAtivo]);


    // Conversão MB/GB/TB → GB
    function parseValor(valor: string): number {
        if (!valor) return 0;
        const n = parseFloat(valor.replace(",", "."));
        if (valor.includes("TB")) return n * 1024;
        if (valor.includes("GB")) return n;
        if (valor.includes("MB")) return n / 1024;
        return n;
    }

    // GRÁFICO
    const categoriasX = [
        "0 GB", "100 GB", "200 GB", "300 GB", "400 GB",
        "500 GB", "600 GB", "700 GB", "800 GB"
    ];

    const totalTB = 1024;

    function gerarCurvaInterpolada(valorFinal: number, pontos: number) {
        const arr = [];
        const passo = valorFinal / (pontos - 1);
        for (let i = 0; i < pontos; i++) arr.push(passo * i);
        return arr;
    }

    let dadosUtil: number[] = [];
    let dadosTotal: number[] = Array(categoriasX.length).fill(totalTB);

    let totalUsado = 0;
    let totalDisponivel = 1024;

    if (storage?.dados) {
        totalUsado = parseValor(storage.dados["Em uso"]);
        totalDisponivel = Math.max(1024 - totalUsado, 0);
        dadosUtil = gerarCurvaInterpolada(totalUsado, categoriasX.length);
    }

    // ===============================
    // 🔵 DESCARTES — FILTRAR PELO TENANT
    // ===============================

    let descartesLista: any[] = [];

    if (internal?.deleted && tenantAtivo) {
        const clienteAtual = tenantAtivo?.cliente_name?.toLowerCase() ?? "";

        const chaveMatch = Object.keys(internal.deleted).find(
            (key) => key.toLowerCase() === clienteAtual
        );

        if (chaveMatch) {
            descartesLista = internal.deleted[chaveMatch] ?? [];
        }
    }

    // Função para comparar datas dd/mm/yyyy
    function normalizarData(d: string) {
        if (!d || !d.includes("/")) return d;
        const [dia, mes, ano] = d.split("/");
        return `${ano}-${mes}-${dia}`;
    }

    // Ordenar por data desc
    descartesLista = descartesLista
        .sort((a, b) => {
            const d1 = new Date(normalizarData(a.data)).getTime();
            const d2 = new Date(normalizarData(b.data)).getTime();
            return d2 - d1;
        })
        .slice(0, 3);

    const descartesFinal = [
        descartesLista[0] ?? { volume: 0, data: "--" },
        descartesLista[1] ?? { volume: 0, data: "--" },
        descartesLista[2] ?? { volume: 0, data: "--" },
    ];


    // Botão "Atualizar tudo"
    const atualizarTudo = () => {
        firewallRef.current?.carregar();
        servidoresRef.current?.carregar();
        carregarStorage();
        carregarInternal();
    };

    return (
        <LayoutModel titulo="Monitoria NG-SOC">

            <section className="grid grid-cols-1 gap-6">

                {/* CARD — Volume de Dados Coletados */}
                <div className="cards rounded-2xl flex flex-col">

                    {/* Header */}
                    <header className="p-6 pb-2">
                        <h2 className="text-white text-lg">Volume de dados coletados</h2>

                        <div className="flex items-center gap-4 mt-4 flex-wrap">
                            <span className="fundo-dashboard text-gray-400 px-3 py-2 rounded-md text-xs">
                                Total: <span className="font-bold">1 TB</span>
                            </span>

                            <span className="text-[#6366F1] badge-darkpink px-3 py-2 rounded-md text-xs">
                                Usado: <span className="font-bold">{totalUsado.toFixed(2)} GB</span>
                            </span>

                            <span className="text-pink-500 badge-pink px-3 py-2 rounded-md text-xs">
                                Disponível: <span className="font-bold">{totalDisponivel.toFixed(2)} GB</span>
                            </span>
                        </div>
                    </header>

                    {/* Gráfico */}
                    <div
                        className="mt-4 mx-6 rounded-xl p-6"
                        style={{
                            backgroundImage: "url('/assets/img/bg-grafico.png')",
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            minHeight: "300px",
                            border: "1px solid rgba(255,255,255,0.06)"
                        }}
                    >
                        {loadingStorage ? (
                            <div className="text-gray-400 text-xs">Carregando dados...</div>
                        ) : (
                            <GraficoVolume
                                series={[
                                    {
                                        name: "Volume utilizado",
                                        data: dadosUtil,
                                        // @ts-ignore
                                        marker: { size: 6, colors: ["#A78BFA"] }
                                    },
                                    {
                                        name: "Volume total",
                                        data: dadosTotal,
                                        // @ts-ignore
                                        marker: { size: 0 }
                                    }
                                ]}
                                categoriasX={categoriasX}
                                height={320}
                            />
                        )}
                    </div>

                    {/* Últimos descartes */}
                    <div className="p-6 pt-4">
                        <h3 className="text-gray-400 text-sm mb-3">Últimos Descartes</h3>

                        {loadingInternal ? (
                            <p className="text-gray-500 text-xs">Carregando descartes...</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                {descartesFinal.map((item, idx) => (
                                    <div key={idx} className="fundo-dashboard p-3 rounded-lg border border-white/10 text-xs text-gray-400">
                                        <div className="flex justify-between">
                                            <p>
                                                <span className="font-bold">Descarte {idx + 1}:</span> {item.data}
                                            </p>
                                            <p>
                                                <span className="font-bold">Volume:</span> {item.volume.toFixed(2)} GB
                                            </p>
                                        </div>
                                    </div>
                                ))}

                            </div>
                        )}
                    </div>
                </div>

                {/* ====== CARDS DE MONITORAMENTO ====== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* FIREWALL */}
                    <FirewallCard ref={firewallRef} />

                    {/* SERVIDORES */}
                    <ServidoresCard ref={servidoresRef} />

                    {/* EDR */}
                    <EdrCard ref={edrRef} />

                    {/* OUTROS COLETORES */}
                    <div className="cards rounded-2xl p-6">
                        <h3 className="text-white text-sm mb-4">Outros Coletores</h3>
                        <table className="w-full text-xs text-gray-400">
                            <thead className="fundo-dashboard">
                                <tr className="text-white">
                                    <th className="text-left py-2 px-3">Origem</th>
                                    <th className="text-center py-2">Status</th>
                                    <th className="text-center py-2">Último Log</th>
                                </tr>
                            </thead>

                            <tbody>
                                <tr className="border-b border-white/5">
                                    <td
                                        colSpan={3}
                                        className="text-center py-6 text-gray-500"
                                    >
                                        Nenhuma dado de coletores encontrado
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>

            </section>
        </LayoutModel>
    );
}
