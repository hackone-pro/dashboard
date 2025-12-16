import axios from "axios";
import https from "https";

const N8N_URL = process.env.N8N_URL || "";
const N8N_USER = process.env.N8N_USERNAME || "";
const N8N_PASS = process.env.N8N_PASSWORD || "";

/**
 * 🔹 Envia comando para o n8n gerar relatório remoto
*/
export async function gerarRelatorioN8N(cliente: string, periodo: number | string = "15") {
  try {
    const url = `${N8N_URL}/webhook/report`;

    const response = await axios.post(
      url,
      { customer: cliente, period: Number(periodo) },
      {
        auth: { username: N8N_USER, password: N8N_PASS },
        headers: { "Content-Type": "application/json" },
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        timeout: 50000,
      }
    );

    strapi.log.info(`✅ Relatório solicitado no n8n (${cliente}, ${periodo} dias)`);
    return response.data;

  } catch (err: any) {
    strapi.log.error("❌ Erro ao solicitar relatório no n8n", {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      data: err.response?.data,
      url: err.config?.url,
    });
  
    throw err;
  }
}

/**
 * 🔹 Busca os dados já processados pelo n8n
 */
export async function buscarDadosReport(periodo = "15", cliente = "default") {
  try {
    const url = `${N8N_URL}/webhook/report/data/${cliente}?period=${periodo}`;

    const response = await axios.get(url, {
      auth: { username: N8N_USER, password: N8N_PASS },
      headers: { "Content-Type": "application/json" },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 50000,
    });

    strapi.log.info(`✅ Dados do relatório ${cliente} recuperados (${periodo} dias)`);
    return response.data;

  } catch (err: any) {
    strapi.log.error("❌ Erro ao buscar dados do n8n", {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      data: err.response?.data,
      url: err.config?.url,
    });
  
    throw err;
  }
}
