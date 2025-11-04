import axios from "axios";
import https from "https";

export async function buscarDadosReport(periodo = "15") {
  try {
    const url = `http://10.0.99.22:5678/webhook/report/data?period=${periodo}`;

    const username = "secone";
    const password = "R4#20!mq%@=1";

    const response = await axios.get(url, {
      auth: { username, password },
      headers: {
        "Content-Type": "application/json",
      },
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 20000,
    });

    strapi.log.info(`✅ Webhook /report/data retornou com sucesso (${periodo} dias)`);

    return response.data;
  } catch (err: any) {
    strapi.log.error("❌ Erro ao buscar dados do webhook /report/data:", err.message || err);
    throw err;
  }
}
