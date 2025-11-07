import { useState, useEffect } from "react";
import LayoutModel from "../componentes/LayoutModel";
import { Download, Loader2 } from "lucide-react";
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
import { getSeveridadeWazuh } from "../services/wazuh/severidade.service";
import ApexCharts from "apexcharts";


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
    const [baixando, setBaixando] = useState(false);

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

        // ========================================================
        // 🔹 Página: Top Acessos (URLs mais acessadas)
        // ========================================================

        try {
            // 🔸 Busca os dados do relatório
            const dadosReport = await getReportData(relatorio.tenant, relatorio.periodo);

            // 🔸 Fundo escuro (página inicial)
            pdf.setFillColor("#121212");
            pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F");

            // ========================================================
            // 🔹 Logo + Título "Relatório SecurityOne"
            // ========================================================
            const logoBase64 =
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGgAAABYCAYAAAAZZrIMAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyNpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDYuMC1jMDAyIDc5LjE2NDQ4OCwgMjAyMC8wNy8xMC0yMjowNjo1MyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIyLjAgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkVDQjkxM0I3OTQ5QjExRjA5OTZERDAwQUQ4MTY1Njg3IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkVDQjkxM0I4OTQ5QjExRjA5OTZERDAwQUQ4MTY1Njg3Ij4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6RUNCOTEzQjU5NDlCMTFGMDk5NkREMDBBRDgxNjU2ODciIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6RUNCOTEzQjY5NDlCMTFGMDk5NkREMDBBRDgxNjU2ODciLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6AQWP1AAAgwklEQVR42uxdB3xU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"; // substitua pelo seu base64 completo

            const logoWidth = 12;
            const logoHeight = 12;
            const logoX = 10;
            const logoY = 10;

            // Logo
            pdf.addImage(logoBase64, "PNG", logoX, logoY, logoWidth, logoHeight);

            // Texto ao lado do logo
            pdf.setFont("helvetica");
            pdf.setFontSize(22);
            pdf.setTextColor("#ffffff");
            const textY = logoY + logoHeight / 2 + 22 * 0.35 / 2;
            pdf.text("Relatório SecurityOne", logoX + logoWidth + 6, textY);

            // ========================================================
            // 🔹 Título: Top Acessos
            // ========================================================
            const tituloY = logoY + logoHeight + 18;

            pdf.setTextColor("#ffffff");
            pdf.setFontSize(16);
            pdf.text("Top Acessos", 14, tituloY);

            pdf.setFontSize(10);
            pdf.setTextColor("#bbbbbb");
            pdf.text(
                "Esta seção apresenta os principais destinos acessados pelos usuários corporativos. A análise permite identificar padrões de navegação, potenciais riscos de exposição a domínios suspeitos e consumo elevado de banda em aplicações não essenciais. Esses dados ajudam a orientar políticas de controle de acesso, priorização de tráfego e ações de conscientização dos usuários.",
                14,
                tituloY + 8,
                { maxWidth: 180 }
            );

            let finalY = tituloY + 25;

            if (dadosReport?.topUrls?.length) {
                // 🔹 Ordena e limita aos 10 principais
                const topUrls = [...dadosReport.topUrls]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10);

                // 🔹 Donut usa apenas top 3
                const top3 = topUrls.slice(0, 3);

                const colunas = ["URL: Destino", "Ocorrências"];
                const linhas = topUrls.map(([url, ocorrencias]) => [
                    url,
                    ocorrencias.toLocaleString("pt-BR"),
                ]);

                // ========================================================
                // 🔹 Cria gráfico DONUT (fundo transparente e alta resolução)
                // ========================================================
                const div = document.createElement("div");
                div.style.position = "absolute";
                div.style.left = "-9999px";
                div.style.top = "0";
                div.style.background = "#121212";
                div.style.boxShadow = "none";
                div.style.border = "none";
                document.body.appendChild(div);

                // 🟢 Renderiza o gráfico 3× maior para exportar com nitidez
                const chart = new ApexCharts(div, {
                    chart: {
                        type: "donut",
                        width: 240,    // antes 80 → 3x maior
                        height: 240,   // antes 80 → 3x maior
                        background: "#121212",
                        animations: { enabled: false },
                        toolbar: { show: false },
                    },
                    theme: { mode: "dark" },
                    series: top3.map(([_, ocorrencias]) => ocorrencias),
                    labels: top3.map(([url]) => url),
                    colors: ["#F914AD", "#6366F1", "#A855F7"],
                    legend: { show: false },
                    dataLabels: { enabled: false },
                    stroke: { width: 0 },
                    plotOptions: {
                        pie: {
                            donut: { size: "70%" },
                        },
                    },
                });

                await chart.render();

                // 🔹 Remove qualquer fundo branco gerado pelo ApexCharts
                div.querySelectorAll("svg, foreignObject").forEach((el) => {
                    (el as HTMLElement).style.background = "transparent";
                });

                // 🟢 Exporta o gráfico já em alta resolução
                const data = await chart.dataURI();

                // ========================================================
                // 🔹 Adiciona gráfico no PDF (lado esquerdo, tamanho real desejado)
                // ========================================================
                const xGraf = 14;
                const yGraf = finalY;
                const wGraf = 50;  // tamanho visual no PDF
                const hGraf = 50;

                if ("imgURI" in data) {
                    // o PNG é 3x maior, mas é redimensionado aqui
                    pdf.addImage(data.imgURI, "PNG", xGraf, yGraf, wGraf, hGraf);
                }

                // 🔹 Limpa elementos temporários
                chart.destroy();
                div.remove();


                // ========================================================
                // 🔹 Tabela ao lado do gráfico (estilo claro e limpo)
                // ========================================================
                autoTable(pdf, {
                    startY: finalY,
                    margin: { left: 75 },
                    head: [colunas],
                    body: linhas,
                    theme: "grid",
                    styles: {
                        fillColor: "#ffffff",        // fundo branco
                        textColor: "#1e1e1e",        // texto escuro
                        lineColor: "#e5e5e5",        // bordas suaves
                        lineWidth: 0.2,
                        fontSize: 9,
                        cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
                    },
                    headStyles: {
                        fillColor: "#f7f7f7",        // fundo levemente acinzentado no cabeçalho
                        textColor: "#111111",        // texto mais forte
                        lineColor: "#e5e5e5",
                        fontStyle: "bold",
                    },
                    alternateRowStyles: {
                        fillColor: "#fbfbfb",        // linhas alternadas quase brancas
                    },
                    tableLineColor: "#dddddd",     // borda geral mais suave
                    tableLineWidth: 0.1,
                });




                // Pega a posição final da tabela
                finalY = (pdf as any).lastAutoTable?.finalY || finalY + 80;

                // ========================================================
                // 🔹 Legenda (Top 3 URLs) — abaixo do gráfico, uma por linha
                // ========================================================
                let legendY = yGraf + hGraf + 5; // começa logo após o gráfico
                const legendX = 14; // mesma posição horizontal do gráfico
                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(8);

                top3.forEach(([url], i) => {
                    const cor = ["#F914AD", "#6366F1", "#A855F7"][i % 3];
                    pdf.setFillColor(cor);
                    pdf.rect(legendX, legendY, 3.5, 3.5, "F");
                    pdf.setTextColor("#bbbbbb");
                    pdf.text(url, legendX + 6, legendY + 3);
                    legendY += 6; // 🔸 avança verticalmente a cada item
                });
            } else {
                pdf.setFontSize(10);
                pdf.setTextColor("#bbbbbb");
                pdf.text("Nenhum dado encontrado para este período", 14, finalY);
                finalY = finalY + 20;
            }


            // ========================================================
            // 🔹 Sub-seção: Top Usuários (agora com gráfico centralizado e legendas abaixo)
            // ========================================================
            const topIps = dadosReport?.topIps || dadosReport?.output?.topIps || [];

            pdf.setFontSize(16);
            pdf.setTextColor("#ffffff");
            pdf.text("Top Usuários", 14, finalY + 20);

            pdf.setFontSize(10);
            pdf.setTextColor("#bbbbbb");
            pdf.text(
                "Aqui são exibidos os usuários com maior consumo de banda no período analisado. O objetivo é identificar comportamentos atípicos ou uso indevido dos recursos de rede, possibilitando intervenções preventivas ou ajustes de perfil de acesso. A correlação com políticas de uso aceitável reforça o alinhamento entre produtividade e segurança.",
                14,
                finalY + 28,
                { maxWidth: 180 }
            );

            if (topIps.length > 0) {
                // 🔹 Pega os top 10 IPs
                const top10Ips = [...topIps]
                    .sort((a, b) => Number(b.total) - Number(a.total))
                    .slice(0, 10);

                // 🔸 Total geral (em GB/TB)
                const totalBytes = top10Ips.reduce((acc, item) => acc + (item.total || 0), 0);
                let totalGBTexto = "";
                if (totalBytes >= 1024 ** 4) totalGBTexto = `${Math.round(totalBytes / 1024 ** 4)} TB`;
                else totalGBTexto = `${Math.round(totalBytes / 1024 ** 3)} GB`;

                // ========================================================
                // 🔹 Cria o gráfico DONUT centralizado
                // ========================================================
                const div = document.createElement("div");
                div.style.position = "absolute";
                div.style.left = "-9999px";
                div.style.top = "0";
                div.style.background = "#121212";
                document.body.appendChild(div);

                const chart = new ApexCharts(div, {
                    chart: {
                        type: "donut",
                        width: 240,
                        height: 240,
                        background: "#121212",
                        animations: { enabled: false },
                        toolbar: { show: false },
                    },
                    theme: { mode: "dark" },
                    series: top10Ips.map((ip) => ip.total || 0),
                    labels: top10Ips.map((ip) => ip.ip),
                    colors: [
                        "#F914AD", "#7C24FF", "#1492F9", "#F5E255", "#1DD69A",
                        "#5EC059", "#D0592E", "#BE2A2C", "#FF89D8", "#35049E",
                    ],
                    legend: { show: false },
                    dataLabels: { enabled: false },
                    stroke: { width: 0 },
                    plotOptions: {
                        pie: {
                            donut: {
                                size: "75%",
                                labels: {
                                    show: true,
                                    total: {
                                        show: true,
                                        label: "",
                                        color: "#ffffff",
                                        fontSize: "22px",
                                        fontWeight: 700,
                                        formatter: () => totalGBTexto,
                                    },
                                },
                            },
                        },
                    },
                });

                await chart.render();
                const data = await chart.dataURI();

                // ========================================================
                // 🔹 Adiciona gráfico centralizado no PDF
                // ========================================================
                const wGraf = 45;
                const hGraf = 45;
                const xGraf = (pageWidth - wGraf) / 2; // centraliza horizontalmente
                const yGraf = finalY + 45;

                if ("imgURI" in data) {
                    pdf.addImage(data.imgURI, "PNG", xGraf, yGraf, wGraf, hGraf);
                }

                chart.destroy();
                div.remove();

                // ========================================================
                // 🔹 Legendas (IP + consumo) — 2 colunas abaixo do gráfico
                // ========================================================
                const startY = yGraf + hGraf + 8;
                const colSpacing = 85; // distância horizontal entre colunas
                const col1X = 30;
                const col2X = col1X + colSpacing;
                const lineHeight = 6;
                const half = Math.ceil(top10Ips.length / 2);

                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(8);

                top10Ips.forEach((item, i) => {
                    const cor = [
                        "#F914AD", "#7C24FF", "#1492F9", "#F5E255", "#1DD69A",
                        "#5EC059", "#D0592E", "#BE2A2C", "#FF89D8", "#35049E",
                    ][i % 10];

                    const colX = i < half ? col1X : col2X;
                    const rowY = startY + (i % half) * lineHeight;

                    pdf.setFillColor(cor);
                    pdf.rect(colX, rowY, 3.5, 3.5, "F");
                    pdf.setTextColor("#bbbbbb");
                    pdf.text(`${item.ip} — ${item.fmt}`, colX + 6, rowY + 3);
                });

            } else {
                pdf.setFontSize(10);
                pdf.setTextColor("#bbbbbb");
                pdf.text("Nenhum dado encontrado para este período", 14, finalY + 40);
            }
        } catch (err) {
            pdf.setFontSize(10);
            pdf.setTextColor("#ff5555");
            pdf.text("Erro ao carregar dados de Top Acessos / Usuários", 14, 40);
        }


        // ========================================================
        // 🔹 Página: Top Aplicações — Protocolos e Serviços
        // ========================================================
        pdf.addPage();
        pdf.setFillColor("#121212");
        pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F");

        // 🔸 Cabeçalho
        pdf.setTextColor("#ffffff");
        pdf.setFontSize(16);
        pdf.text("Top Aplicações", 14, 20);

        pdf.setFontSize(10);
        pdf.setTextColor("#bbbbbb");
        pdf.text(
            "Mostra as aplicações mais utilizadas dentro do ambiente corporativo. Essa visão é essencial para compreender quais serviços demandam maior tráfego, avaliar riscos associados a softwares em nuvem, identificar shadow IT e otimizar o desempenho de rede. Também serve como base para priorizar inspeções de segurança em aplicações críticas.",
            14,
            28,
            { maxWidth: 180 }
        );

        try {
            const dadosReport = await getReportData(relatorio.tenant, relatorio.periodo);

            if (dadosReport?.topApps?.length) {
                // 🔹 Ordena e limita aos 10 principais
                const topApps = [...dadosReport.topApps]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10);

                const colunas = ["Aplicação", "Ocorrências"];
                const linhas = topApps.map(([app, ocorrencias]) => [
                    app,
                    ocorrencias.toLocaleString("pt-BR"),
                ]);

                autoTable(pdf, {
                    startY: 45,
                    head: [colunas],
                    body: linhas,
                    theme: "grid",
                    styles: {
                        fillColor: "#1a1a1a",
                        textColor: "#ffffff",
                        lineColor: "#333333",
                        lineWidth: 0,
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
                        if (topApps.length === 0) {
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
            } else {
                pdf.setFontSize(10);
                pdf.setTextColor("#bbbbbb");
                pdf.text("Nenhum dado de aplicações encontrado para este período", 14, 40);
            }
        } catch (err) {
            pdf.setFontSize(10);
            pdf.setTextColor("#ff5555");
            pdf.text("Erro ao carregar dados de Top Aplicações", 14, 40);
        }


        // ========================================================
        // 🔹 Sub-seção: Top Categorias — Tipos de Tráfego
        // ========================================================

        try {
            const dadosReport = await getReportData(relatorio.tenant, relatorio.periodo);

            // 🔹 Posição de início (abaixo do último autoTable)
            const finalY = (pdf as any).lastAutoTable?.finalY || 60;

            pdf.setFontSize(16);
            pdf.setTextColor("#ffffff");
            pdf.text("Top Categorias", 14, finalY + 15);

            pdf.setFontSize(10);
            pdf.setTextColor("#bbbbbb");
            pdf.text(
                "Apresenta o agrupamento de aplicações e sites por categoria (ex.: redes sociais, colaboração, entretenimento). Essa análise permite avaliar a aderência das atividades digitais às políticas corporativas e identificar possíveis vetores de risco ou desperdício de recursos de conectividade.",
                14,
                finalY + 23,
                { maxWidth: 180 }
            );

            if (dadosReport?.topCats?.length) {
                const topCats = [...dadosReport.topCats]
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10);

                const colunas = ["Categoria", "Ocorrências"];
                const linhas = topCats.map(([cat, ocorrencias]) => [
                    cat || "N/A",
                    ocorrencias.toLocaleString("pt-BR"),
                ]);

                autoTable(pdf, {
                    startY: finalY + 38,
                    head: [colunas],
                    body: linhas,
                    theme: "grid",
                    styles: {
                        fillColor: "#1a1a1a",
                        textColor: "#ffffff",
                        lineColor: "#333333",
                        lineWidth: 0,
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
                        if (topCats.length === 0) {
                            const startY = data.cursor?.y || finalY + 45;
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
            } else {
                pdf.setFontSize(10);
                pdf.setTextColor("#bbbbbb");
                pdf.text("Nenhum dado de categorias encontrado para este período", 14, finalY + 40);
            }
        } catch (err) {
            pdf.setFontSize(10);
            pdf.setTextColor("#ff5555");
            pdf.text("Erro ao carregar dados de Top Categorias", 14, 40);
        }


        // ========================================================
        // 🔹 Página: Top Usuários por Volume de Aplicação (dados reais)
        // ========================================================
        pdf.addPage();
        pdf.setFillColor("#121212");
        pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F");

        // 🔸 Cabeçalho
        pdf.setTextColor("#ffffff");
        pdf.setFontSize(16);
        pdf.text("Top Usuários por Volume de Aplicação", 14, 20);

        pdf.setFontSize(10);
        pdf.setTextColor("#bbbbbb");
        pdf.text(
            "Mostra o detalhamento dos usuários que mais consomem aplicações específicas, com origem, destino e volume trafegado. Essa métrica apoia a detecção de desvios de comportamento, como transferências anômalas de dados ou uso intensivo de serviços externos, auxiliando a priorização de investigações e alertas.",
            14,
            28,
            { maxWidth: 180 }
        );

        try {
            const dadosReport = await getReportData(relatorio.tenant, relatorio.periodo);

            // 🔹 Usa os dados reais da API
            const resumo = dadosReport?.tabelaResumo || [];

            if (resumo.length > 0) {
                const colunas = ["USUÁRIO", "APLICAÇÃO", "VOLUME DE DADOS"];
                const linhas = resumo.map((item) => [
                    item.user,
                    item.application,
                    item.total_bytes,
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
                        lineWidth: 0,
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
                pdf.text("Nenhum dado encontrado para este período", 14, 55);
            }
        } catch (err) {
            pdf.setFontSize(10);
            pdf.setTextColor("#ff5555");
            pdf.text("Erro ao carregar dados de Top Usuários por Volume de Aplicação", 14, 40);
        }


        // ========================================================
        // 🔹 Seção: Top Acesso Detalhado (na mesma página)
        // ========================================================
        let finalY = (pdf as any).lastAutoTable?.finalY || 100; // Pega onde parou a tabela anterior
        pdf.setFontSize(16);
        pdf.setTextColor("#ffffff");
        pdf.text("Top Acesso Detalhado", 14, finalY + 15);

        pdf.setFontSize(10);
        pdf.setTextColor("#bbbbbb");
        pdf.text(
            "Esta seção apresenta os principais destinos acessados pelos usuários corporativos. A análise permite identificar padrões de navegação, potenciais riscos de exposição a domínios suspeitos e consumo elevado de banda em aplicações não essenciais. Esses dados ajudam a orientar políticas de controle de acesso, priorização de tráfego e ações de conscientização dos usuários.",
            14,
            finalY + 22,
            { maxWidth: 180 }
        );

        try {
            const dadosReport = await getReportData(relatorio.tenant, relatorio.periodo);
            const tabela = dadosReport?.tabelaResumo || [];

            if (tabela.length > 0) {
                const colunas = ["#", "APPLICATION", "CATEGORY", "USER", "TOTAL BYTES"];
                const linhas = tabela.map((item) => [
                    item["#"],
                    item.application,
                    item.category,
                    item.user,
                    item.total_bytes,
                ]);

                autoTable(pdf, {
                    startY: finalY + 40,
                    head: [colunas],
                    body: linhas,
                    theme: "grid",
                    styles: {
                        fillColor: "#1a1a1a",
                        textColor: "#ffffff",
                        lineColor: "#333333",
                        lineWidth: 0,
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
                pdf.text("Nenhum dado encontrado para este período", 14, finalY + 30);
            }
        } catch (err) {
            pdf.setFontSize(10);
            pdf.setTextColor("#ff5555");
            pdf.text("Erro ao carregar dados de Top Acesso Detalhado", 14, finalY + 30);
        }


        // ========================================================
        // 🔹 Página: Risk Level + Top Hosts por Nível de Alertas
        // ========================================================
        try {
            console.log("🔹 Iniciando Risk Level...");
            const severidade = await getSeveridadeWazuh(relatorio.periodo);
            console.log("✅ Severidade:", severidade);

            // 🧮 Calcula índice de risco — mesma fórmula do backend
            const indiceRisco = Math.min(
                100,
                Math.round(
                    ((severidade.baixo * 0.2 +
                        severidade.medio * 0.6 +
                        severidade.alto * 0.8 +
                        severidade.critico * 1.0) /
                        (severidade.total || 1)) *
                    100
                )
            );

            const cor =
                indiceRisco <= 25
                    ? "#1DD69A"
                    : indiceRisco <= 50
                        ? "#6366F1"
                        : indiceRisco <= 75
                            ? "#A855F7"
                            : "#F914AD";

            // 👉 Cria página principal
            pdf.addPage();
            pdf.setFillColor("#121212");
            pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F");

            // 🔹 Cabeçalho principal
            pdf.setTextColor("#ffffff");
            pdf.setFontSize(16);
            pdf.text("Risk Level", 14, 20);

            pdf.setFontSize(10);
            pdf.setTextColor("#bbbbbb");
            pdf.text(
                "Apresenta a variação do nível de risco do ambiente por período escolhido, considerando eventos de segurança, vulnerabilidades e incidentes detectados. O acompanhamento dessas métricas demonstra a evolução da postura de segurança e a efetividade das ações mitigatórias aplicadas.",
                14,
                28,
                { maxWidth: 180 }
            );

            // ⚙️ Cria gauge de risco
            const div = document.createElement("div");
            div.style.position = "absolute";
            div.style.left = "-9999px";
            div.style.top = "0";
            div.style.background = "#121212";
            div.style.padding = "20px";
            document.body.appendChild(div);

            const chart = new ApexCharts(div, {
                chart: {
                    type: "radialBar",
                    height: 250,
                    width: 250,
                    background: "#121212",
                    animations: { enabled: false },
                },
                series: [indiceRisco],
                plotOptions: {
                    radialBar: {
                        startAngle: -120,
                        endAngle: 120,
                        hollow: { size: "70%", background: "#121212" },
                        track: { background: "#1e1e2d", strokeWidth: "100%", margin: 0 },
                        dataLabels: {
                            name: { show: false },
                            value: {
                                offsetY: 15,
                                color: "#ffffff",
                                fontSize: "36px",
                                fontWeight: 600,
                                formatter: (v: number) => `${Math.round(v)}%`,
                            },
                        },
                    },
                },
                fill: {
                    type: "gradient",
                    gradient: {
                        shade: "dark",
                        type: "horizontal",
                        gradientToColors: [cor],
                        stops: [0, 100],
                    },
                    colors: [cor],
                },
                stroke: { lineCap: "round" },
            });

            await chart.render();
            const data = await chart.dataURI();
            const xGraf = 70;
            const yGraf = 45;
            const wGraf = 70;
            const hGraf = 50;
            if ("imgURI" in data) {
                pdf.addImage(data.imgURI, "PNG", xGraf, yGraf, wGraf, hGraf);
            }
            chart.destroy();
            div.remove();

            // 🔹 Legenda abaixo do gráfico
            const yBase = yGraf + hGraf + 8;
            pdf.setFontSize(8);
            pdf.setTextColor("#cccccc");

            const legendas = [
                { cor: "#1DD69A", nome: "Baixo" },
                { cor: "#6366F1", nome: "Médio" },
                { cor: "#A855F7", nome: "Alto" },
                { cor: "#F914AD", nome: "Crítico" },
            ];

            let xLeg = xGraf + wGraf / 2 - (legendas.length * 20) / 2;
            legendas.forEach((leg) => {
                pdf.setFillColor(leg.cor);
                pdf.rect(xLeg, yBase, 3.5, 3.5, "F");
                pdf.text(leg.nome, xLeg + 6, yBase + 3);
                xLeg += 20;
            });

            // ========================================================
            // 🔹 Seção: Top Hosts por Nível de Alertas (mesma página)
            // ========================================================
            const yTopHosts = yBase + 25;

            pdf.setTextColor("#ffffff");
            pdf.setFontSize(16);
            pdf.text("Top Hosts por Nível de Alertas", 14, yTopHosts);

            pdf.setFontSize(10);
            pdf.setTextColor("#bbbbbb");
            pdf.text(
                "Lista os ativos com maior volume de alertas de segurança registrados. Essa visibilidade permite priorizar investigações em hosts potencialmente comprometidos, identificar tendências de ataques e otimizar a resposta a incidentes conforme o impacto operacional.",
                14,
                yTopHosts + 8,
                { maxWidth: 180 }
            );

            const colunas = ["Host", "Crítico", "Alto", "Médio", "Baixo", "Total"];
            let linhas: any[][] = [];

            if (relatorio.dados.length > 0) {
                linhas = relatorio.dados.map((item) => [
                    item.agent_name,
                    item.severidade.Crítico,
                    item.severidade.Alto,
                    item.severidade.Médio,
                    item.severidade.Baixo,
                    item.total_alertas,
                ]);
            }

            autoTable(pdf, {
                startY: yTopHosts + 25,
                head: [colunas],
                body: linhas,
                theme: "grid",
                styles: {
                    fillColor: "#1a1a1a",
                    textColor: "#ffffff",
                    lineColor: "#333333",
                    lineWidth: 0,
                    fontSize: 9,
                    halign: "center",
                },
                headStyles: { fillColor: "#222222" },
                alternateRowStyles: { fillColor: "#151515" },
                didParseCell: (data) => {
                    if (data.section === "body") {
                        const c = data.column.index;
                        switch (c) {
                            case 1:
                                data.cell.styles.textColor = "#F914AD";
                                break;
                            case 2:
                                data.cell.styles.textColor = "#A855F7";
                                break;
                            case 3:
                                data.cell.styles.textColor = "#6366F1";
                                break;
                            case 4:
                                data.cell.styles.textColor = "#1DD69A";
                                break;
                        }
                    }
                },
                didDrawPage: (data) => {
                    if (relatorio.dados.length === 0) {
                        const startY = data.cursor?.y || yTopHosts + 40;
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

        } catch (err) {
            pdf.setFontSize(10);
            pdf.setTextColor("#ff5555");
            pdf.text("Erro ao carregar Risk Level / Top Hosts", 14, 40);
        }

        // ========================================================
        // 🔹 Página: Detecção de Vulnerabilidades + Segurança dos Servidores + Top OS
        // ========================================================
        try {
            const vuln = await getVulnSeveridades();

            // 👉 Cria nova página única para todas as 3 seções
            pdf.addPage();
            pdf.setFillColor("#121212");
            pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F");

            // ========================================================
            // 🔹 1. Detecção de Vulnerabilidades (com legendas e índices centralizados)
            // ========================================================
            pdf.setTextColor("#ffffff");
            pdf.setFontSize(16);
            pdf.text("Detecção de Vulnerabilidades", 14, 20);

            pdf.setFontSize(10);
            pdf.setTextColor("#bbbbbb");
            pdf.text(
                "Mostra o total de vulnerabilidades identificadas, classificadas por criticidade (baixa, média, alta, crítica). Essa visão ajuda a mensurar o risco cibernético atual e priorizar correções com base na probabilidade de exploração e impacto sobre os ativos de negócio.",
                14,
                28,
                { maxWidth: 180 }
            );

            // 🔹 Total de alertas
            pdf.setFontSize(10);
            pdf.setTextColor("#bbbbbb");
            pdf.text(
                `Alertas totais: ${vuln.total?.toLocaleString("pt-BR") ?? 0}`,
                14,
                45
            );

            // ========================================================
            // 🔸 Legenda compacta colorida
            // ========================================================
            const legendasDec = [
                { nome: "Baixo", cor: "#1DD69A" },
                { nome: "Médio", cor: "#6366F1" },
                { nome: "Alto", cor: "#A855F7" },
                { nome: "Crítico", cor: "#F914AD" },
                { nome: "Pendentes", cor: "#BBBBBB" },
            ];

            let xLegend = 14;
            const yLegend = 53;

            pdf.setFontSize(8);
            legendasDec.forEach((leg) => {
                pdf.setFillColor(leg.cor);
                pdf.rect(xLegend, yLegend - 3, 3.5, 3.5, "F");
                pdf.setTextColor("#bbbbbb");
                pdf.text(leg.nome, xLegend + 6, yLegend);
                xLegend += 25;
            });

            // ========================================================
            // 🔸 Blocos de severidades (centralizados)
            // ========================================================
            const severidades = [
                { nome: "Severidade Crítica", valor: vuln.critical, cor: "#F914AD" },
                { nome: "Severidade Alta", valor: vuln.high, cor: "#A855F7" },
                { nome: "Severidade Média", valor: vuln.medium, cor: "#6366F1" },
                { nome: "Severidade Baixa", valor: vuln.low, cor: "#1DD69A" },
                { nome: "Pendentes (Avaliação)", valor: vuln.pending, cor: "#BBBBBB" },
            ];

            // 🔹 Centraliza os blocos horizontalmente
            const yStart = yLegend + 20;
            const boxWidth = 25;
            const spacing = 25;
            const perRow = 3; // 3 na primeira linha, 2 na segunda

            pdf.setFontSize(30);

            const totalRows = Math.ceil(severidades.length / perRow);

            for (let row = 0; row < totalRows; row++) {
                const startIndex = row * perRow;
                const endIndex = Math.min(startIndex + perRow, severidades.length);
                const rowItems = severidades.slice(startIndex, endIndex);

                // 🔹 Calcula centralização de cada linha
                const totalWidth = rowItems.length * (boxWidth + spacing);
                const xStart = (pageWidth - totalWidth) / 2;
                const yRow = yStart + row * 25;

                rowItems.forEach((s, i) => {
                    const xPos = xStart + i * (boxWidth + spacing);

                    // Número grande colorido
                    pdf.setTextColor(s.cor);
                    const numero = `${vuln.total ? s.valor.toLocaleString("pt-BR") : 0}`;
                    const numeroWidth = pdf.getTextWidth(numero);
                    pdf.text(numero, xPos + boxWidth / 2 - numeroWidth / 2, yRow);

                    // Nome da severidade logo abaixo
                    pdf.setFontSize(10);
                    pdf.setTextColor("#cccccc");
                    const labelWidth = pdf.getTextWidth(s.nome);
                    pdf.text(s.nome, xPos + boxWidth / 2 - labelWidth / 2, yRow + 7);

                    pdf.setFontSize(30); // restaura
                });
            }
            // 👉 Define ponto para a próxima seção
            const startCIS_Y = yStart + totalRows * 25 + 8;

            // ========================================================
            // 🔹 2. Nível de Segurança dos Servidores
            // ========================================================
            pdf.setFontSize(16);
            pdf.setTextColor("#ffffff");
            pdf.text("Nível de Segurança dos Servidores", 14, startCIS_Y);

            pdf.setFontSize(10);
            pdf.setTextColor("#bbbbbb");
            pdf.text(
                "Exibe a avaliação do nível de proteção e conformidade dos servidores monitorados. Com base em políticas de segurança, patches aplicados e configurações avaliadas, o indicador mostra o grau de exposição de cada sistema e direciona esforços de correção.",
                14,
                startCIS_Y + 8,
                { maxWidth: 180 }
            );

            let endCIS_Y = startCIS_Y + 25;

            try {
                let topCIS: TopAgentCisItem[] = await getTopAgentsCis(relatorio.periodo);
                topCIS = topCIS.sort((a, b) => b.score_cis_percent - a.score_cis_percent).slice(0, 10);

                // 🔸 Legendas coloridas
                const legendas = [
                    { nome: "Baixo", cor: "#1DD69A" },
                    { nome: "Médio", cor: "#6366F1" },
                    { nome: "Alto", cor: "#A855F7" },
                    { nome: "Crítico", cor: "#F914AD" },
                ];

                let xLegenda = 14;
                const yLegenda = startCIS_Y + 25;
                pdf.setFontSize(8);
                legendas.forEach((leg) => {
                    pdf.setFillColor(leg.cor);
                    pdf.rect(xLegenda, yLegenda - 3, 3.5, 3.5, "F");
                    pdf.setTextColor("#bbbbbb");
                    pdf.text(leg.nome, xLegenda + 6, yLegenda);
                    xLegenda += 28;
                });

                // 🔸 Barras CIS
                const barStartY = yLegenda + 10;
                const barHeight = 5;
                let currentY = barStartY;
                const margemEsquerda = 14;
                const barStartX = margemEsquerda + 45;
                const barWidth = pageWidth - barStartX - 35;

                pdf.setFont("helvetica", "normal");
                pdf.setFontSize(9);

                const getCoresPorScore = (p: number) => {
                    if (p < 30) return { cor: "#1DD69A", texto: "#1DD69A" };
                    if (p < 40) return { cor: "#6366F1", texto: "#6366F1" };
                    if (p <= 75) return { cor: "#A855F7", texto: "#A855F7" };
                    return { cor: "#F914AD", texto: "#F914AD" };
                };

                topCIS.forEach((item) => {
                    const score = Math.max(0, Math.min(100, Math.round(item.score_cis_percent)));
                    const agente = item.agent_name || "N/A";
                    const { cor, texto } = getCoresPorScore(score);

                    pdf.setTextColor("#bbbbbb");
                    pdf.text(agente, 14, currentY + 4);

                    pdf.setFillColor("#1a1a1a");
                    pdf.rect(barStartX, currentY, barWidth, barHeight, "F");

                    const filledWidth = (score / 100) * barWidth;
                    pdf.setFillColor(cor);
                    pdf.rect(barStartX, currentY, filledWidth, barHeight, "F");

                    pdf.setTextColor(texto);
                    pdf.text(`${score}%`, barStartX + barWidth + 8, currentY + 4);

                    currentY += 9;
                });

                if (topCIS.length === 0) {
                    pdf.setFontSize(10);
                    pdf.setTextColor("#bbbbbb");
                    pdf.text("Nenhum dado encontrado para este período", 14, barStartY + 10);
                }

                endCIS_Y = currentY + 10;
            } catch (e) {
                pdf.setTextColor("#ff5555");
                pdf.setFontSize(10);
                pdf.text("Erro ao carregar dados CIS", 14, startCIS_Y + 40);
                endCIS_Y = startCIS_Y + 60;
            }

            // ========================================================
            // 🔹 3. Top Sistemas Operacionais Vulneráveis (abaixo do CIS)
            // ========================================================
            const startY_OS = endCIS_Y + 5;

            try {
                let topOS = await getTopOSVulnerabilidades(5, relatorio.periodo || "todos");

                if (!Array.isArray(topOS) || topOS.length === 0) {
                    const fallback = await getTopOSVulnerabilidades(5, "todos");
                    if (Array.isArray(fallback) && fallback.length > 0) topOS = fallback;
                }

                const top5OS = [...(topOS || [])]
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5);

                pdf.setFontSize(16);
                pdf.setTextColor("#ffffff");
                pdf.text("Top 5 Sistemas Operacionais Detectados", 14, startY_OS);

                pdf.setFontSize(10);
                pdf.setTextColor("#bbbbbb");
                pdf.text(
                    "Apresenta os sistemas operacionais predominantes no ambiente, permitindo entender o perfil tecnológico e avaliar riscos associados a versões desatualizadas ou fora de suporte. Serve como base para estratégias de padronização e atualização de sistemas.",
                    14,
                    startY_OS + 7,
                    { maxWidth: 180 }
                );

                if (!top5OS.length) {
                    pdf.setTextColor("#bbbbbb");
                    pdf.setFontSize(10);
                    pdf.text(
                        "Nenhum dado encontrado para este período",
                        pageWidth / 2,
                        startY_OS + 20,
                        { align: "center" }
                    );
                } else {
                    const colunasOS = ["Sistema Operacional", "Total"];
                    const linhasOS = top5OS.map((item) => [item.os, item.total]);

                    autoTable(pdf, {
                        startY: startY_OS + 18,
                        head: [colunasOS],
                        body: linhasOS,
                        theme: "grid",
                        pageBreak: "auto",
                        styles: {
                            fillColor: "#1a1a1a",
                            textColor: "#ffffff",
                            lineColor: "#333333",
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
                pdf.text("Erro ao carregar dados de Top OS.", 14, startY_OS + 40);
            }

        } catch (err) {
            pdf.setFontSize(10);
            pdf.setTextColor("#ff5555");
            pdf.text("Erro ao carregar Detecção / CIS / OS", 14, 40);
        }



        // ========================================================
        // 🔹 Integridade de Arquivos (File Integrity Monitoring)
        // ========================================================

        // 👉 Força nova página para esta seção
        pdf.addPage();

        // Fundo escuro da nova página
        pdf.setFillColor("#121212");
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
            pdf.text("Top Hosts por Alteração de Arquivos", 14, 20);

            pdf.setFontSize(10);
            pdf.setTextColor("#bbbbbb");
            pdf.text(
                "Indica os servidores com maior número de modificações de arquivos monitorados. Essa métrica ajuda a detectar alterações não autorizadas, possíveis tentativas de intrusão e mudanças não rastreadas em sistemas críticos.",
                14,
                28,
                { maxWidth: 180 }
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
                    lineWidth: 0,
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
        // 🔹 TOP Hosts alterados por origem da alteração
        // ========================================================
        const startY_Users =
            (pdf as any).lastAutoTable?.finalY
                ? (pdf as any).lastAutoTable.finalY + 20
                // @ts-ignore
                : startY_OS + 60;

        try {
            const topUsers = await getTopUsers(relatorio.periodo);
            const top10Users = [...topUsers].sort((a, b) => b.count - a.count).slice(0, 10);

            const colunasUsers = ["Usuário", "ID do Host", "Nome do Host", "Contagem"];
            const linhasUsers = top10Users.map((u) => [
                u.user,
                u.agent_id,
                u.agent_name,
                u.count.toLocaleString("pt-BR"),
            ]);

            pdf.setFontSize(16);
            pdf.setTextColor("#ffffff");
            pdf.text("Top Hosts Alterados por Origem da Alteração", 14, startY_Users);

            pdf.setFontSize(10);
            pdf.setTextColor("#bbbbbb");
            pdf.text(
                "Apresenta a origem das alterações (usuário, processo ou sistema) em cada host afetado. Essa visibilidade apoia auditorias forenses e garante rastreabilidade das ações, reforçando o controle de integridade e conformidade com normas de segurança.",
                14,
                startY_Users + 7,
                { maxWidth: 180 }
            );

            if (top10Users.length === 0) {
                pdf.setFontSize(10);
                pdf.setTextColor("#bbbbbb");
                pdf.text(
                    "Nenhum dado encontrado para este período",
                    pageWidth / 2,
                    startY_Users + 20,
                    { align: "center" }
                );
            } else {
                autoTable(pdf, {
                    startY: startY_Users + 20,
                    head: [colunasUsers],
                    body: linhasUsers,
                    theme: "grid",
                    pageBreak: "auto",
                    styles: {
                        fillColor: "#1a1a1a",
                        textColor: "#ffffff",
                        lineColor: "#333333",
                        lineWidth: 0,
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
            pdf.text("Erro ao carregar Top Usuários", 14, startY_Users + 40);
        }

        // ========================================================
        // 🔹 Distribuição de Ações (Overtime Events)
        // ========================================================

        // 👉 em vez de adicionar nova página, continuamos após a anterior
        const startY_Acoes =
            (pdf as any).lastAutoTable?.finalY
                ? (pdf as any).lastAutoTable.finalY + 25 // pequeno espaçamento abaixo da tabela anterior
                : startY_Users + 40;

        try {
            const overtime = await getOvertimeEventos(relatorio.periodo);

            const totais =
                overtime?.datasets?.map((ds: any) => ({
                    name: ds.name,
                    total: ds.data.reduce((acc: number, n: number) => acc + (n || 0), 0),
                })) ?? [];

            const topAcoes = totais.sort((a, b) => b.total - a.total).slice(0, 5);

            pdf.setFontSize(16);
            pdf.setTextColor("#ffffff");
            pdf.text("Resumo de Ações nos Arquivos", 14, startY_Acoes);

            pdf.setFontSize(10);
            pdf.setTextColor("#bbbbbb");
            pdf.text(
                "Consolida o total de arquivos adicionados, modificados e deletados em um período, permitindo avaliar o nível de atividade sobre dados sensíveis. É uma métrica relevante para monitorar comportamentos anômalos e incidentes relacionados à integridade da informação.",
                14,
                startY_Acoes + 8,
                { maxWidth: 180 }
            );

            if (topAcoes.length === 0) {
                pdf.setTextColor("#bbbbbb");
                pdf.setFontSize(10);
                pdf.text(
                    "Nenhum dado encontrado para este período",
                    pageWidth / 2,
                    startY_Acoes + 20,
                    { align: "center" }
                );
            } else {
                const colunasAcoes = ["Ação", "Total"];
                const linhasAcoes = topAcoes.map((a) => [
                    a.name,
                    a.total.toLocaleString("pt-BR"),
                ]);

                autoTable(pdf, {
                    startY: startY_Acoes + 20,
                    head: [colunasAcoes],
                    body: linhasAcoes,
                    theme: "grid",
                    pageBreak: "auto",
                    styles: {
                        fillColor: "#1a1a1a",
                        textColor: "#ffffff",
                        lineColor: "#333333",
                        lineWidth: 0,
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
            pdf.text("Erro ao carregar Distribuição de Ações", 14, startY_Acoes + 40);
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
                                                {r.data} • Organização: {r.tenant} • Período: {r.periodo} dias
                                            </p>
                                        </div>

                                        <div className="flex gap-3">
                                            {/* 🔹 Baixar PDF */}
                                            <button
                                                onClick={async () => {
                                                    setBaixando(true);
                                                    try {
                                                        await exportarRelatorioTopHosts(r);
                                                    } finally {
                                                        setBaixando(false);
                                                    }
                                                }}
                                                disabled={baixando}
                                                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-all text-xs border border-purple-400 rounded-lg px-2 py-1 disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                {baixando ? (
                                                    <>
                                                        <Loader2 size={12} className="animate-spin" />
                                                        Baixando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download size={12} />
                                                        Baixar PDF
                                                    </>
                                                )}
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
