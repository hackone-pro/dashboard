import { useState, useEffect } from "react";
import LayoutModel from "../componentes/LayoutModel";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getTopAgents, TopAgentItem } from "../services/wazuh/topagents.service";
import { getTopAgentsCis, TopAgentCisItem } from "../services/wazuh/topagentscis";
import { getTenant } from "../services/wazuh/tenant.service";
import { getVulnSeveridades } from "../services/wazuh/vulnseveridades.service";
import { getTopOSVulnerabilidades } from "../services/wazuh/topsovulnerabilidades.service";
import { getTopUsers } from "../services/wazuh/topusers.service";
import { getOvertimeEventos } from "../services/wazuh/overtimeeventos.service";
import { getReportData } from "../services/reports/report.service";
import { getToken } from "../utils/auth";


interface RelatorioGerado {
    id: string;
    nome: string;
    data: string;
    tenant: string;
    periodo: string;
    dados: TopAgentItem[];
}

export default function Reports() {
    const [periodo, setPeriodo] = useState("15");
    const [gerando, setGerando] = useState(false);
    const [relatoriosGerados, setRelatoriosGerados] = useState<RelatorioGerado[]>([]);

    // 🔹 Carrega relatórios salvos
    useEffect(() => {
        const armazenados = localStorage.getItem("relatoriosGerados");
        if (armazenados) setRelatoriosGerados(JSON.parse(armazenados));
    }, []);

    // 🔹 Atualiza localStorage automaticamente
    useEffect(() => {
        localStorage.setItem("relatoriosGerados", JSON.stringify(relatoriosGerados));
    }, [relatoriosGerados]);

    // 🔹 Gera relatório e adiciona à lista
    const gerarRelatorio = async () => {
        setGerando(true);
        try {
            const tenant = await getTenant();
            if (!tenant || !tenant.wazuh_client_name) {
                console.error("Tenant inválido ou sem client_name.");
                return;
            }

            const dados = await getTopAgents(periodo);
            const dataAtual = new Date();
            const nomeArquivo = `relatorio${String(relatoriosGerados.length + 1).padStart(
                2,
                "0"
            )}-${dataAtual.toLocaleDateString("pt-BR").replace(/\//g, "")}`;

            const novoRelatorio: RelatorioGerado = {
                id: crypto.randomUUID(),
                nome: nomeArquivo,
                data: dataAtual.toLocaleString("pt-BR"),
                tenant: tenant.cliente_name || tenant.wazuh_client_name,
                periodo,
                dados: Array.isArray(dados) ? dados : [],
            };

            setRelatoriosGerados((prev) => [...prev, novoRelatorio]);
        } catch (err) {
            console.error("Erro ao gerar relatório:", err);
        } finally {
            setGerando(false);
        }
    };

    // 🔹 Exporta PDF escuro e formatado com Top Hosts + Top CIS
    const exportarRelatorioTopHosts = async (relatorio: RelatorioGerado) => {
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();

        // 🔸 Fundo escuro
        pdf.setFillColor("#0A0617");
        pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F");

        // 🔸 Cabeçalho
        pdf.setTextColor("#ffffff");
        pdf.setFontSize(16);
        pdf.text("TOP Hosts por nível de alertas", 14, 20);

        pdf.setFontSize(10);
        pdf.setTextColor("#bbbbbb");
        pdf.text(
            "Lista os ativos com maior volume de alertas de segurança registrados. Essa visibilidade permite priorizar investigações em hosts potencialmente comprometidos, identificar tendências de ataques e otimizar a resposta a incidentes conforme o impacto operacional.",
            14,
            28,
            { maxWidth: 180 }
        );

        // pdf.setTextColor("#999999");
        // pdf.setFontSize(8);
        // pdf.text(
        //     `Tenant: ${relatorio.tenant}  |  Período: ${relatorio.periodo} dias  |  ${relatorio.data}`,
        //     14,
        //     47
        // );

        const colunas = ["Host", "Alertas", "Crítico", "Alto", "Médio", "Baixo", "Score"];
        let linhas: any[][] = [];

        if (relatorio.dados.length > 0) {
            linhas = relatorio.dados.map((item) => [
                item.agent_name,
                item.total_alertas,
                item.severidade.Crítico,
                item.severidade.Alto,
                item.severidade.Médio,
                item.severidade.Baixo,
                `${item.score}%`,
            ]);
        }

        autoTable(pdf, {
            startY: 45,
            head: [colunas],
            body: linhas,
            theme: "grid",
            pageBreak: "auto",
            styles: {
                fillColor: "#1a1a1a",
                textColor: "#ffffff",
                lineColor: "#333333",
                lineWidth: 0.1,
                fontSize: 9,
            },
            headStyles: {
                fillColor: "#222222",
                textColor: "#ffffff",
            },
            alternateRowStyles: {
                fillColor: "#151515",
            },
            didDrawPage: (data) => {
                if (relatorio.dados.length === 0) {
                    const startY = data.cursor?.y || 60;
                    pdf.setTextColor("#bbbbbb");
                    pdf.setFontSize(10);
                    pdf.text(
                        "Nenhum dado encontrado para este período",
                        pageWidth / 2,
                        startY + 10,
                        { align: "center" }
                    );
                }
            },
        });

        // ========================================================
        // 🔹 Página: Top Acessos (URLs mais acessadas)
        // ========================================================

        try {
            // 🔸 Busca os dados do relatório (sem token)
            const dadosReport = await getReportData(relatorio.tenant, relatorio.periodo);

            // 👉 Força ser a primeira página do relatório
            pdf.addPage();
            pdf.setFillColor("#0A0617");
            pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F");

            pdf.setTextColor("#ffffff");
            pdf.setFontSize(16);
            pdf.text("Top Acessos (URLs mais acessadas)", 14, 20);

            pdf.setFontSize(10);
            pdf.setTextColor("#bbbbbb");
            pdf.text(
                "URLs mais acessadas no período, com o total de ocorrências registradas nos logs de tráfego. Útil para identificar padrões de navegação e possíveis conexões anômalas.",
                14,
                28,
                { maxWidth: 180 }
            );

            if (dadosReport?.topUrls?.length) {
                // 🔹 Ordena e limita aos 10 principais
                const topUrls = [...dadosReport.topUrls]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10);

                const colunas = ["URL: Destino", "Ocorrências"];
                const linhas = topUrls.map(([url, ocorrencias]) => [
                    url,
                    ocorrencias.toLocaleString("pt-BR"),
                ]);

                autoTable(pdf, {
                    startY: 40,
                    head: [colunas],
                    body: linhas,
                    theme: "grid",
                    styles: {
                        fillColor: "#1a1a1a",
                        textColor: "#ffffff",
                        lineColor: "#333333",
                        lineWidth: 0.1,
                        fontSize: 9,
                    },
                    headStyles: {
                        fillColor: "#222222",
                        textColor: "#ffffff",
                    },
                    alternateRowStyles: {
                        fillColor: "#151515",
                    },
                });
            } else {
                pdf.setFontSize(10);
                pdf.setTextColor("#bbbbbb");
                pdf.text("Nenhum dado encontrado para este período", 14, 40);
            }
        } catch (err) {
            pdf.setFontSize(10);
            pdf.setTextColor("#ff5555");
            pdf.text("Erro ao carregar dados de Top Acessos", 14, 40);
        }


        // ========================================================
        // 🔹 Adiciona seção "Vulnerabilidade severidades" logo abaixo da tabela anterior
        // ========================================================
        const proxY = (pdf as any).lastAutoTable?.finalY
            ? (pdf as any).lastAutoTable.finalY + 10
            : 100;

        pdf.setFontSize(16);
        pdf.setTextColor("#ffffff");
        pdf.text("Nível de segurança dos servidores", 14, proxY + 10);

        pdf.setFontSize(10);
        pdf.setTextColor("#bbbbbb");
        pdf.text(
            "Exibe a avaliação do nível de proteção e conformidade dos servidores monitorados. Com base em políticas de segurança, patches aplicados e configurações avaliadas, o indicador mostra o grau de exposição de cada sistema e direciona esforços de correção.",
            14,
            proxY + 17,
            { maxWidth: 180 }
        );

        try {
            let topCIS: TopAgentCisItem[] = await getTopAgentsCis(relatorio.periodo);

            topCIS = topCIS.sort((a, b) => b.score_cis_percent - a.score_cis_percent);

            const colunasCis = ["Agente", "Eventos", "Score CIS (%)"];
            let linhasCis: any[][] = [];

            if (topCIS.length > 0) {
                linhasCis = topCIS.map((item) => [
                    item.agent_name,
                    item.total_eventos,
                    `${item.score_cis_percent}%`,
                ]);
            }

            autoTable(pdf, {
                startY: proxY + 33,
                head: [colunasCis],
                body: linhasCis,
                theme: "grid",
                pageBreak: "auto",
                styles: {
                    fillColor: "#1a1a1a",
                    textColor: "#ffffff",
                    lineColor: "#333333",
                    lineWidth: 0.1,
                    fontSize: 9,
                },
                headStyles: {
                    fillColor: "#222222",
                    textColor: "#ffffff",
                },
                alternateRowStyles: {
                    fillColor: "#151515",
                },
                didDrawPage: (data) => {
                    if (topCIS.length === 0) {
                        const startY = data.cursor?.y || proxY + 45;
                        pdf.setTextColor("#bbbbbb");
                        pdf.setFontSize(10);
                        pdf.text(
                            "Nenhum dado encontrado para este período",
                            pageWidth / 2,
                            startY + 10,
                            { align: "center" }
                        );
                    }
                },
            });
        } catch (e) {
            pdf.setTextColor("#ff5555");
            pdf.text("Erro ao carregar dados CIS", 14, proxY + 40);
        }

        // 🔹 Nova seção: Detecção de Vulnerabilidades
        const vuln = await getVulnSeveridades();

        // Continua logo abaixo da tabela anterior
        const startY = (pdf as any).lastAutoTable?.finalY
            ? (pdf as any).lastAutoTable.finalY + 20
            : proxY + 60;

        pdf.setTextColor("#ffffff");
        pdf.setFontSize(16);
        pdf.text("Detecção de Vulnerabilidades", 14, startY);

        pdf.setFontSize(10);
        pdf.setTextColor("#bbbbbb");
        pdf.text(
            "Mostra o total de vulnerabilidades identificadas, classificadas por criticidade (baixa, média, alta, crítica). Essa visão ajuda a mensurar o risco cibernético atual e priorizar correções com base na probabilidade de exploração e impacto sobre os ativos de negócio.",
            14,
            startY + 8,
            { maxWidth: 180 },
        );


        // 🔸 Define cores por severidade
        const severidades = [
            { nome: "Crítica", valor: vuln.critical, cor: "#F914AD" },
            { nome: "Alta", valor: vuln.high, cor: "#A855F7" },
            { nome: "Média", valor: vuln.medium, cor: "#6366F1" },
            { nome: "Baixa", valor: vuln.low, cor: "#1DD69A" },
            { nome: "Pendentes (Avaliação)", valor: vuln.pending, cor: "#BBBBBB" },
        ];

        // 🔸 Layout em linha
        let x = 14;
        const yBase = startY + 22;
        const boxWidth = 35;

        pdf.setFontSize(22);
        severidades.forEach((s, i) => {
            pdf.setTextColor(s.cor);
            pdf.text(`${vuln.total ? s.valor.toLocaleString("pt-BR") : 0}`, x, yBase);
            pdf.setFontSize(10);
            pdf.setTextColor("#cccccc");
            pdf.text(s.nome, x, yBase + 7);
            x += boxWidth + 15;
            pdf.setFontSize(22);
        });

        pdf.setTextColor("#bbbbbb");
        pdf.setFontSize(10);
        pdf.text(`Total: ${vuln.total?.toLocaleString("pt-BR") ?? 0}`, 14, yBase + 20);



        // ========================================================
        // 🔹 Integridade de Arquivos (File Integrity Monitoring)
        // ========================================================

        // 👉 Força nova página para esta seção
        pdf.addPage();

        // Fundo escuro da nova página
        pdf.setFillColor("#0A0617");
        pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F");

        try {
            const topAgents = await getTopAgents(relatorio.periodo);

            // Ordena do maior para o menor total de alertas
            const top5FIM = topAgents
                .map((a) => ({
                    nome: a.agent_name || a.agente || "Desconhecido",
                    modified: a.modified ?? 0,
                    added: a.added ?? 0,
                    deleted: a.deleted ?? 0,
                    total: a.total_alertas ?? 0,
                }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 5);

            const colunasFim = ["Agente", "Modificados", "Adicionados", "Deletados", "Total"];
            const linhasFim = top5FIM.map((a) => [
                a.nome,
                a.modified,
                a.added,
                a.deleted,
                a.total,
            ]);

            // Cabeçalho da nova página
            pdf.setFontSize(16);
            pdf.setTextColor("#ffffff");
            pdf.text("Integridade de Arquivos", 14, 20);

            pdf.setFontSize(10);
            pdf.setTextColor("#bbbbbb");
            pdf.text(
                "Ativos com maiores alterações detectadas (arquivos modificados, adicionados ou deletados).",
                14,
                28
            );

            // Tabela
            autoTable(pdf, {
                startY: 40,
                head: [colunasFim],
                body: linhasFim,
                theme: "grid",
                pageBreak: "auto",
                styles: {
                    fillColor: "#1a1a1a",
                    textColor: "#ffffff",
                    lineColor: "#333333",
                    lineWidth: 0.1,
                    fontSize: 9,
                },
                headStyles: {
                    fillColor: "#222222",
                    textColor: "#ffffff",
                },
                alternateRowStyles: {
                    fillColor: "#151515",
                },
                didDrawPage: (data) => {
                    if (top5FIM.length === 0) {
                        const startY = data.cursor?.y || 60;
                        pdf.setTextColor("#bbbbbb");
                        pdf.setFontSize(10);
                        pdf.text(
                            "Nenhum dado encontrado para este período",
                            pageWidth / 2,
                            startY + 10,
                            { align: "center" }
                        );
                    }
                },
            });
        } catch (e) {
            pdf.setTextColor("#ff5555");
            pdf.setFontSize(10);
            pdf.text("Erro ao carregar Integridade de Arquivos", 14, 40);
        }


        // ========================================================
        // 🔹 Top Sistemas Operacionais Vulneráveis
        // ========================================================

        const proxYOS = (pdf as any).lastAutoTable?.finalY || 100;

        try {
            const topOS = await getTopOSVulnerabilidades(5, relatorio.periodo);

            // Ordena (caso necessário)
            const top5OS = [...topOS].sort((a, b) => b.total - a.total).slice(0, 5);

            const colunasOS = ["Sistema Operacional", "Total"];
            const linhasOS = top5OS.map((item) => [item.os, item.total]);

            // Cabeçalho da seção
            pdf.setFontSize(14);
            pdf.setTextColor("#ffffff");
            pdf.text("Top Sistemas Operacionais Vulneráveis", 14, proxYOS + 20);

            pdf.setFontSize(9);
            pdf.setTextColor("#bbbbbb");
            pdf.text(
                "Lista dos sistemas operacionais com maior número de vulnerabilidades detectadas.",
                14,
                proxYOS + 27,
                { maxWidth: 180 } // ✅ quebra automática
            );

            if (top5OS.length === 0) {
                pdf.setTextColor("#bbbbbb");
                pdf.setFontSize(10);
                pdf.text(
                    "Nenhum dado encontrado para este período",
                    pageWidth / 2,
                    proxYOS + 40,
                    { align: "center" }
                );
            } else {
                // Tabela
                autoTable(pdf, {
                    startY: proxYOS + 35,
                    head: [colunasOS],
                    body: linhasOS,
                    theme: "grid",
                    pageBreak: "auto",
                    styles: {
                        fillColor: "#1a1a1a",
                        textColor: "#ffffff",
                        lineColor: "#333333",
                        lineWidth: 0.1,
                        fontSize: 9,
                    },
                    headStyles: {
                        fillColor: "#222222",
                        textColor: "#ffffff",
                    },
                    alternateRowStyles: {
                        fillColor: "#151515",
                    },
                    didDrawPage: (data) => {
                        if (top5OS.length === 0) {
                            const startY = data.cursor?.y || proxYOS + 45;
                            pdf.setTextColor("#bbbbbb");
                            pdf.setFontSize(10);
                            pdf.text(
                                "Nenhum dado encontrado para este período",
                                pageWidth / 2,
                                startY + 10,
                                { align: "center" }
                            );
                        }
                    },
                });
            }
        } catch (e) {
            pdf.setTextColor("#ff5555");
            pdf.setFontSize(10);
            pdf.text("Erro ao carregar dados de Top OS.", 14, proxYOS + 40);
        }



        // ========================================================
        // 🔹 Top Usuários (User Activity)
        // ========================================================

        const proxYUsers = (pdf as any).lastAutoTable?.finalY || 100;

        try {
            const topUsers = await getTopUsers(relatorio.periodo);

            // Ordena e pega top 10
            const top10Users = [...topUsers].sort((a, b) => b.count - a.count).slice(0, 10);

            const colunasUsers = ["Usuário", "ID do Host", "Nome do Host", "Contagem"];
            const linhasUsers = top10Users.map((u) => [
                u.user,
                u.agent_id,
                u.agent_name,
                u.count.toLocaleString("pt-BR"),
            ]);

            pdf.setFontSize(14);
            pdf.setTextColor("#ffffff");
            pdf.text("Top Usuários", 14, proxYUsers + 20);

            pdf.setFontSize(9);
            pdf.setTextColor("#bbbbbb");
            pdf.text(
                "Usuários mais frequentes em eventos de segurança, agrupados por host e agente.",
                14,
                proxYUsers + 27
            );

            autoTable(pdf, {
                startY: proxYUsers + 33,
                head: [colunasUsers],
                body: linhasUsers,
                theme: "grid",
                pageBreak: "auto",
                styles: {
                    fillColor: "#1a1a1a",
                    textColor: "#ffffff",
                    lineColor: "#333333",
                    lineWidth: 0.1,
                    fontSize: 9,
                },
                headStyles: {
                    fillColor: "#222222",
                    textColor: "#ffffff",
                },
                alternateRowStyles: {
                    fillColor: "#151515",
                },
                didDrawPage: (data) => {
                    if (top10Users.length === 0) {
                        const startY = data.cursor?.y || proxYUsers + 45;
                        pdf.setTextColor("#bbbbbb");
                        pdf.setFontSize(10);
                        pdf.text(
                            "Nenhum dado encontrado para este período",
                            pageWidth / 2,
                            startY + 10,
                            { align: "center" }
                        );
                    }
                },
            });
        } catch (e) {
            pdf.setTextColor("#ff5555");
            pdf.setFontSize(10);
            pdf.text("Erro ao carregar Top Usuários", 14, proxYUsers + 40);
        }


        // ========================================================
        // 🔹 Distribuição de Ações (Overtime Events)
        // ========================================================

        const proxYAcoes = (pdf as any).lastAutoTable?.finalY || 100;

        try {
            const overtime = await getOvertimeEventos(relatorio.periodo);

            // 🔸 Extrai total de eventos por ação
            const totais =
                overtime?.datasets?.map((ds: any) => ({
                    name: ds.name,
                    total: ds.data.reduce((acc: number, n: number) => acc + (n || 0), 0),
                })) ?? [];

            // 🔸 Ordena por total decrescente e pega top 5
            const topAcoes = totais.sort((a, b) => b.total - a.total).slice(0, 5);

            pdf.setFontSize(14);
            pdf.setTextColor("#ffffff");
            pdf.text("Distribuição de Ações", 14, proxYAcoes + 20);

            pdf.setFontSize(9);
            pdf.setTextColor("#bbbbbb");
            pdf.text(
                "Principais ações registradas nos eventos de segurança, agrupadas por tipo e volume.",
                14,
                proxYAcoes + 27
            );

            if (topAcoes.length === 0) {
                pdf.setTextColor("#bbbbbb");
                pdf.setFontSize(10);
                pdf.text(
                    "Nenhum dado encontrado para este período",
                    pageWidth / 2,
                    proxYAcoes + 40,
                    { align: "center" }
                );
            } else {
                const colunasAcoes = ["Ação", "Total"];
                const linhasAcoes = topAcoes.map((a) => [a.name, a.total.toLocaleString("pt-BR")]);

                autoTable(pdf, {
                    startY: proxYAcoes + 33,
                    head: [colunasAcoes],
                    body: linhasAcoes,
                    theme: "grid",
                    pageBreak: "auto",
                    styles: {
                        fillColor: "#1a1a1a",
                        textColor: "#ffffff",
                        lineColor: "#333333",
                        lineWidth: 0.1,
                        fontSize: 9,
                    },
                    headStyles: {
                        fillColor: "#222222",
                        textColor: "#ffffff",
                    },
                    alternateRowStyles: {
                        fillColor: "#151515",
                    },
                });
            }
        } catch (e) {
            pdf.setTextColor("#ff5555");
            pdf.setFontSize(10);
            pdf.text("Erro ao carregar Distribuição de Ações", 14, proxYAcoes + 40);
        }



        // 🔹 Rodapé (corrigido TS)
        const totalPages = (pdf as any).internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            (pdf as any).setPage(i);
            pdf.setFontSize(8);
            pdf.setTextColor("#777");
            pdf.text(
                `Página ${i} de ${totalPages}  •  SecurityOne Dashboard`,
                pageWidth / 2,
                (pdf.internal as any).pageSize.height - 10,
                { align: "center" }
            );
        }

        pdf.save(`${relatorio.nome}.pdf`);
    };

    // ========================================================
    // 🔹 Layout visual (inalterado)
    // ========================================================
    return (
        <LayoutModel titulo="Relatórios">
            <section className="cards p-6 rounded-2xl shadow-lg flex gap-8">
                {/* Sidebar */}
                <aside className="w-48 border-r border-[#2c2450] pr-4">
                    <ul className="space-y-2 text-sm text-gray-300">
                        <li>
                            <button className="w-full text-left px-3 py-2 rounded-lg bg-violet-600 text-white">
                                Novo Relatório
                            </button>
                        </li>
                    </ul>
                </aside>

                {/* Conteúdo */}
                <div className="flex-1">
                    <div className="max-w-3xl">
                        <h2 className="text-white text-xl font-semibold mb-6">
                            Gerar Relatório
                        </h2>

                        {/* Select + botão (mantido) */}
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                            <p className="text-gray-400 text-sm">
                                Escolha o período e gere um relatório em PDF.
                            </p>

                            <div className="flex items-center gap-3">
                                <select
                                    value={periodo}
                                    onChange={(e) => setPeriodo(e.target.value)}
                                    className="bg-[#1a1530] border border-[#2c2450] text-gray-300 text-sm rounded-lg px-3 py-2 focus:outline-none"
                                >
                                    <option value="5">Últimos 5 dias</option>
                                    <option value="15">Últimos 15 dias</option>
                                    <option value="30">Últimos 30 dias</option>
                                </select>

                                <button
                                    onClick={gerarRelatorio}
                                    disabled={gerando}
                                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg transition-all disabled:bg-gray-600"
                                >
                                    {gerando ? "Gerando..." : "Gerar Relatório"}
                                </button>

                            </div>
                        </div>

                        {/* Lista de relatórios (mantida) */}
                        {/* Lista dos relatórios gerados */}
                        <div id="relatorio-tophosts" className="space-y-4 mb-6 bg-[#0A0617] p-4 rounded-xl">
                            {relatoriosGerados.length > 0 ? (
                                relatoriosGerados.map((r) => (
                                    <div
                                        key={r.id}
                                        className="flex justify-between items-center bg-[#1a1530] border border-[#2c2450] rounded-xl p-4 hover:border-purple-600 transition-all"
                                    >
                                        <div>
                                            <h3 className="text-white text-sm font-medium">{r.nome}</h3>
                                            <p className="text-gray-400 text-xs mt-1">
                                                {r.data} • Tenant: {r.tenant} • Período: {r.periodo} dias
                                            </p>
                                        </div>

                                        <div className="flex gap-3">
                                            {/* 🔸 Enviar para n8n */}
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const response = await fetch("http://10.0.99.22:5678/webhook/report", {
                                                            method: "POST",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({
                                                                customer: r.tenant,
                                                                period: r.periodo,
                                                            }),
                                                        });

                                                        if (!response.ok) throw new Error("Falha ao enviar webhook");
                                                        alert("✅ Relatório enviado ao Discord via n8n!");
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert("❌ Erro ao enviar relatório para o n8n");
                                                    }
                                                }}
                                                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-all text-xs border border-blue-400 rounded-lg px-2 py-1"
                                            >
                                                🚀 Enviar n8n
                                            </button>

                                            {/* 🔹 Baixar PDF */}
                                            <button
                                                onClick={() => exportarRelatorioTopHosts(r)}
                                                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-all text-xs border border-purple-400 rounded-lg px-2 py-1"
                                            >
                                                <Download size={12} /> Baixar PDF
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-400 py-10">
                                    <p>Nenhum relatório gerado até o momento.</p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </section>
        </LayoutModel>
    );
}
