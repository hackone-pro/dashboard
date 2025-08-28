// src/components/wazuh/FirewallDonutCard.tsx
import { useEffect, useMemo, useState } from "react";
import { getTopFirewalls, TopFirewallItem } from "../../services/wazuh/topfirewall.service";
import GraficoDonut from "../graficos/GraficoDonut";

export default function FirewallDonutCard() {
    const [dias, setDias] = useState("todos");
    const [dados, setDados] = useState<TopFirewallItem[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        let ativo = true;
        async function fetch() {
            try {
                setCarregando(true);
                setErro(null);
                const res = await getTopFirewalls(dias);
                if (!ativo) return;
                setDados(res); // pode limitar no service ou aqui; donut soma tudo
            } catch (e: any) {
                if (!ativo) return;
                setErro(e?.message ?? "Erro ao carregar dados de firewall");
            } finally {
                if (ativo) setCarregando(false);
            }
        }
        fetch();
        return () => { ativo = false; };
    }, [dias]);

    // Soma por severidade
    const { baixo, medio, alto, critico, total } = useMemo(() => {
        const agg = { baixo: 0, medio: 0, alto: 0, critico: 0, total: 0 };
        for (const it of dados) {
            agg.baixo += it.severidade.baixo || 0;
            agg.medio += it.severidade.medio || 0;
            agg.alto += it.severidade.alto || 0;
            agg.critico += it.severidade.critico || 0;
            agg.total += it.total || 0;
        }
        return agg;
    }, [dados]);

    const labels = ["Crítico", "Alto", "Médio", "Baixo"];
    const series = [critico, alto, medio, baixo];
    const cores = ["#EC4899", "#6A55DC", "#6301F4", "#1DD69A"];

    return (
        <div className="mb-4">
            <div className="cards rounded-xl p-6 shadow-md h-full flex flex-col justify-between">
                {/* Header com seletor */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm text-white">Regras de Firewall</h3>
                    <select
                        className="bg-[#0d0c22] text-white text-xs px-2 py-1 rounded-md border border-[#cacaca31]"
                        value={dias}
                        onChange={(e) => setDias(e.target.value)}
                    >
                        <option value="todos">Todos</option>
                        <option value="1">24 horas</option>
                        <option value="7">7 dias</option>
                        <option value="15">15 dias</option>
                        <option value="30">30 dias</option>
                    </select>
                </div>

                {/* Conteúdo */}
                {erro && (
                    <div className="text-xs text-red-400 bg-red-950/30 border border-red-900 rounded-md p-2 mb-3">
                        {erro}
                    </div>
                )}

                {carregando ? (
                    <div className="w-full h-52 rounded-xl bg-[#ffffff0a] animate-pulse" />
                ) : total === 0 ? (
                    <div className="text-xs text-gray-400">Nenhum dado para exibir.</div>
                ) : (
                    <GraficoDonut
                        labels={["Crítico", "Alto", "Médio", "Baixo"]}
                        series={[critico, alto, medio, baixo]}
                        cores={["#EC4899", "#6A55DC", "#6301F4", "#1DD69A"]}
                        height={220}
                        descricaoTotal="Alertas de Firewall"
                    />
                )}
            </div>
        </div>
    );
}
