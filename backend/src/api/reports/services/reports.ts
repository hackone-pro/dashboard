import axios from "axios";
import https from "https";

const username = "secone";
const password = "R4#20!mq%@=1";

// 🔹 1. POST → aciona geração do relatório
export async function gerarRelatorioN8N(cliente: string, periodo: number | string = "15") {
  try {
    const url = `http://10.0.99.22:5678/webhook/report`;

    const response = await axios.post(
      url,
      {
        customer: cliente,
        period: Number(periodo),
      },
      {
        auth: { username, password },
        headers: { "Content-Type": "application/json" },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        timeout: 20000,
      }
    );

    strapi.log.info(`✅ Relatório solicitado no n8n (${cliente}, ${periodo} dias)`);
    return response.data;
  } catch (err: any) {
    strapi.log.error("❌ Erro ao solicitar relatório:", err.response?.data || err.message || err);
    throw err;
  }
}

// 🔹 2. GET → busca dados do relatório processado
export async function buscarDadosReport(periodo = "15", cliente = "default") {
  try {
    const url = `http://10.0.99.22:5678/webhook/report/data/${cliente}?period=${periodo}`;

    const response = await axios.get(url, {
      auth: { username, password },
      headers: { "Content-Type": "application/json" },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 20000,
    });

    strapi.log.info(`✅ Dados do relatório ${cliente} recuperados com sucesso (${periodo} dias)`);
    return response.data;
  } catch (err: any) {
    strapi.log.error("❌ Erro ao buscar dados do relatório:", err.response?.data || err.message || err);
    throw err;
  }
}
